import { Message, MessageEmbed, MessageReaction, User, TextChannel } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import { decode } from "@lavalink/encoding";

interface TrackInfo {
  flags?: number;
  source: string;
  identifier: string;
  author: string;
  length: bigint;
  isStream: boolean;
  position: bigint;
  title: string;
  uri: string | null;
  version?: number;
  probeInfo?: { raw: string, name: string, parameters: string | null };
}

interface Items {
  title: string,
  uri: string,
  length: bigint,
  identifier: string,
  index: number,
}

export default class QueueCommand extends BaseCommand {
  constructor() {
    super('queue', {
      category: 'Music',
      aliases: ['q'],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.music.queue.description"),
      usage: (m: Message) => m.translate("commands.music.queue.usage"),
      timeout: 3e3,
      clientPermissions: ["EMBED_LINKS"],
      rolePermissions: {
        ADD_SONGS: false,
        MANAGE_QUEUE: false,
        MANAGE_PLAYER: false,
      },
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const player = client.music.players.get(message.guild.id);
    if (!player || !player.queue || !player.queue.current) return message.channel.send(message.translate("commands.music.queue.noPlayer", { redtick: client.utils.EmojiFinder("redtick").toString() }))
      .catch(e => { return client.utils.logs(e, "No player - queue errror") });

    const items: Items[] = player.queue.next.map((data, index) => {
      const res: TrackInfo = decode(data.track);
      return {
         title:
          res.title.length > 20
            ? res.title.substring(0, 40)
            : res.title,
        uri: res.uri,
        length: res.length,
        identifier: res.identifier,
        index,
      };
    });
    
    let page = args[0] ? parseInt(args[0]) : 0;
    const current = decode(player.queue.current.track);
    const embed = new MessageEmbed()
    .setTitle(message.translate("commands.music.queue.embed.title", { name: message.guild.name }))
    .setColor(message.member.displayColor || "BLUE")
    .setThumbnail(`https://i.ytimg.com/vi/${current.identifier}/hqdefault.jpg`)
    .addField(message.translate("commands.music.queue.current", { requester: message.guild.members.cache.get(player.queue.current.requester).user.tag }), [
      `> 🎵 | [${current.title.replace(/\[/g, '').replace(/\]/g, '')}](${current.uri}) - \`${client.utils.formatTime(Number(current.length))}\``,
    ]);

    if (!player.queue.next.length) return message.channel.send(embed)
    .catch(e => { return client.utils.logs(e, "Embed - queue errror") });

    const maxPages = Math.ceil(player.queue.next.length / 10);
    if (page > maxPages || page < 1) page = 1;

    const display = items.slice((page - 1) * 10, page * 10);
    const msg = await message.channel.send(
      embed.setDescription(display.map((data) => `**${data.index + 1}.** [${data.title.replace(/\[/g, '').replace(/\]/g, '').substr(0, 45)}](${data.uri}) - \`${client.utils.formatTime(Number(data.length))}\``).join("\n"))
      .setFooter(message.translate("commands.music.queue.embed.footer", { page, maxPages, command: `${message.prefix}queue ${this.options.usage(message).replace(/\|/g, " ")}` }))
    ).catch(e => { return client.utils.logs(e, "No player - queue errror") });

    const pages = this.generateEmbeds(client, items, embed);
    if (pages.length <= 1) return;
    this.pagination((msg as Message), pages, ["◀", "🗑", "▶"], 12e4, page);
  }

  generateEmbeds(client: DiscordClient, items: Items[], base: MessageEmbed): MessageEmbed[] {
    const embeds: MessageEmbed[] = [];
    let count: number = 10;

    for (let i = 0; i < items.length; i += 10) {
      const current = items.slice(i, count);
      const map = current.map((data) => `**${data.index + 1}.** [${data.title.replace(/\[/g, '').replace(/\]/g, '').substr(0, 45)}](${data.uri}) - \`${client.utils.formatTime(Number(data.length))}\``).join("\n")
      count += 10;

      embeds.push(new MessageEmbed(base).setDescription(map));
    }

    return embeds;
  }

  async pagination(message: Message, pages: MessageEmbed[], emojiList: string[] = ["◀", "▶"], timeout = 12e4, pageNumber: number = 1) {
    let page = pageNumber;
    const currentPage = message;

    emojiList.forEach(emoji => currentPage.react(emoji));

    const filter = (reaction: MessageReaction, user: User) => {
      return emojiList.includes(reaction.emoji.name) && !user.bot;
    };
    const collector = currentPage.createReactionCollector(filter, { time: timeout });

    collector.on("collect", (reaction: MessageReaction, user: User) => {
      switch (reaction.emoji.name) {
        case emojiList[0]: page = page === 1 ? pages.length : page - 1; break;
        case emojiList[2]: page = page === pages.length ? 1 : page + 1; break;
        case emojiList[1]: return currentPage.delete();
			  default: break;
      };

      if ((message.channel as TextChannel).permissionsFor(message.guild.me).has("MANAGE_MESSAGES")) reaction.users.remove(user);
      currentPage.edit(pages[page - 1].setFooter(
        message.translate("commands.music.queue.embed.footer", { 
          page, 
          maxPages: pages.length, 
          command: `${message.prefix}queue ${this.options.usage(message).replace(/\|/g, " ")}` 
        })
      ));
    });

    collector.on("end", () => { 
      if (!currentPage.deleted && (message.channel as TextChannel).permissionsFor(message.guild.me).has("MANAGE_MESSAGES")) 
        currentPage.reactions.removeAll();
    });
  }
}