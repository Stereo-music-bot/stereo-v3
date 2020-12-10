import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

const types = ['queue', 'song', 'none'];
interface RepeatObject {
  song: boolean;
  queue: boolean;
  always: boolean;
}


export default class RepeatCommand extends BaseCommand {
  constructor() {
    super('repeat', {
      category: 'Player Settings',
      aliases: ["loop"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.player_settings.repeat.description"),
      usage: (m: Message) => m.translate("commands.player_settings.repeat.usage"),
      timeout: 3e3,
      clientPermissions: ["ADD_REACTIONS"],
      rolePermissions: {
        ADD_SONGS: false,
        MANAGE_QUEUE: false,
        MANAGE_PLAYER: true,
      },
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const player = client.music.players.get(message.guild.id);
    const { channel } = message.member.voice;
    let type = args[0] ? args[0].toLowerCase() : '';

    if (!type || !types.includes(type)) 
      return message.channel.send(message.translate("commands.player_settings.repeat.invalidType", { types: types.join('`, `'), redtick }));
    if (!player || (!player.playing && !player.paused))
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    const repeatObject: RepeatObject = type === 'queue'
    ? { song: false, queue: true, always: false }
    : type === 'song'
      ? { song: true, queue: false, always: false }
      : { song: false, queue: false, always: false };

    player.queue.setRepeat(type, repeatObject);
    return player.queue.repeat.queue ? message.react("🔁") : player.queue.repeat.song ? message.react("🔂"): message.react("▶");
  }
}