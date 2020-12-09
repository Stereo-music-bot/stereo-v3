import { Message, MessageEmbed } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import { decode, TrackInfo } from '@lavalink/encoding';
import rest from "../../utils/extensions/music/rest";

const repeats = {
  queue: (m: Message) => m.translate("commands.music.np.repeats.queue"),
  song: (m: Message) => m.translate("commands.music.np.repeats.song"),
  none: (m: Message) => m.translate("commands.music.np.repeats.none"),
}

export default class NowplayingCommand extends BaseCommand {
  constructor() {
    super('nowplaying', {
      category: 'Music',
      aliases: ['np', "current"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.music.np.description"),
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

    if (!player || (!player.playing && !player.paused) || !player.queue || !player.queue.current) 
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    
    let current: TrackInfo;

    try {
      current = decode(player.queue.current.track);
    } catch (e) {
      try {
        rest.decode(player.queue.current.track);
      } catch (err) {
        client.utils.logs(err, "np decode error");
        return message.channel.send(message.translate("commands.music.np.error", { warning: client.utils.EmojiFinder("warning").toString() }));
      }  
    };

    const requester = message.guild.members.cache.get(player.queue.current.requester);
    const required = message.guild.channels.cache.get(player.channel).members.size - 2;
    const votes = player.queue.votes.votes;

    const embed = new MessageEmbed()
    .setColor(requester.displayHexColor || 'BLUE')
    .setThumbnail(`https://i.ytimg.com/vi/${current.identifier}/hqdefault.jpg`)
    .setFooter(message.translate("commands.music.np.embed.footer", { votes, required }))
    .setAuthor(`Now playing: ${current.title}`, player.playing ? 'https://emoji.gg/assets/emoji/6935_Plak_Emoji.gif' : 'https://daangamesdg.is-inside.me/gR1qd5DI.png')
    .setDescription([
      message.translate("commands.music.np.embed.song", { link: `[${current.title.replace(/\[/g, '').replace(/\]/g, '')}](${current.uri})` }),
      message.translate("commands.music.np.embed.requester", { requester: requester.toString() }) + "\n",
      (player.queue.repeat.always || player.queue.repeat.queue) ? repeats['queue'](message) : player.queue.repeat.song ? repeats['song'](message) : repeats['none'](message),
      message.translate("commands.music.np.embed.volume", { volume: player.volume }),
      message.translate("commands.music.np.embed.filter", { filter: player.filter || "default" }),
      message.translate("commands.music.np.embed.bassboost", { bassboost: player.bass || "none" }) + "\n",
      message.translate("commands.music.np.embed.progress", { progress: `${(client.utils.formatTime(player.position).length === 2 ? `00:` + client.utils.formatTime(player.position) : client.utils.formatTime(player.position)) || '00:00'}\` / \`${client.utils.formatTime(Number(current.length))}` }),
      `> ⌚ | [${"▬".repeat(Math.floor((player.position / Number(current.length)) * 20)) + "⚪" + "▬".repeat(20 - Math.floor((player.position / Number(current.length)) * 20))}]`
    ]);

    return message.channel.send(embed);
  }
}