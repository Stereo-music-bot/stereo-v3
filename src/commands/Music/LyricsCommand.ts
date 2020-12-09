import { Message, MessageEmbed } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import { decode } from '@lavalink/encoding';
import { KSoftClient, Track } from '@ksoft/api';
import rest from '../../utils/extensions/music/rest';

const ksoft = new KSoftClient(process.env.KSOFT_TOKEN);

export default class LyricsCommand extends BaseCommand {
  constructor() {
    super('lyrics', {
      category: 'Music',
      aliases: ['lyr'],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.music.lyrics.description"),
      usage: (m: Message) => m.translate("commands.music.lyrics.usage"),
      timeout: 5e3,
      clientPermissions: ['EMBED_LINKS'],
      rolePermissions: {
        ADD_SONGS: false,
        MANAGE_QUEUE: false,
        MANAGE_PLAYER: false,
      },
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const player = client.music.players.get(message.guild.id);
    const redtick = client.utils.EmojiFinder("redtick").toString();
    message.channel.startTyping()

    let data: Track;
    let query: string = args.join(" ");

    if (query) {
      const raw = await rest.search(`ytsearch:${encodeURIComponent(query)}`).catch(e => { client.utils.logs(e, "search error - lyrics"); undefined });
      query = raw ? raw.tracks[0].info.title : undefined;
    } else if (player) query = player.queue ? player.queue.current ? decode(player.queue.current.track).title : "" : "";
    else {
      message.channel.stopTyping();
      return message.channel.send(message.translate("commands.music.lyrics.fails.noArgs", { redtick }));
    };

    try {
      const d = await ksoft.lyrics.search(query, { limit: 1, textOnly: false });
      data = d.length ? d[0] : undefined;
    } catch (e) {
      client.utils.logs(e, "ksoft lyrics error");
      message.channel.stopTyping();
      return message.channel.send(message.translate("commands.music.lyrics.fails.error", { e, warning: client.utils.EmojiFinder("warning").toString() }));
    }
    
    message.channel.stopTyping();
    if (!data) return message.channel.send(message.translate("commands.music.lyrics.fails.noResult", { redtick, query }));

    const lyrics: string = data.lyrics.length > 2048 
      ? data.lyrics.substr(0, 2045) + '...'
      : data.lyrics;
    //@ts-ignore
    const url: string = data.url;

    if (!query) return message.channel.send(message.translate("commands.music.lyrics.fails.noResult", { redtick, query }));

    const embed: MessageEmbed = new MessageEmbed()
      .setTitle(message.translate("commands.music.lyrics.embed.title", { name: `${data.artist ? data.artist.name.replace(/-/g, ' ') + ' - ' : ''}${data.name.replace(/-/g, ' ')}` }))
      .setDescription(lyrics)
      .setURL(url || null)
      .setThumbnail(data.artwork || null)
      .setColor(message.member.displayHexColor || 'BLUE')
      .setFooter(message.translate("commands.music.lyrics.embed.footer"));

    return message.channel.send(embed);
  }
}