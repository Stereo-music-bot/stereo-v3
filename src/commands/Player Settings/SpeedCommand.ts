import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class SpeedCommand extends BaseCommand {
  constructor() {
    super('speed', {
      category: 'Player Settings',
      aliases: [],
      ownerOnly: true,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.player_settings.speed.description"),
      usage: (m: Message) => m.translate("commands.player_settings.speed.usage"),
      timeout: 3e3,
      rolePermissions: {
        ADD_SONGS: false,
        MANAGE_QUEUE: false,
        MANAGE_PLAYER: true,
      },
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const player = client.music.players.get(message.guild.id);
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const { channel } = message.member.voice;
    const speed = parseInt(args[0]);

    if (!speed || isNaN(speed) || speed > 300 || speed < 0) 
      return message.channel.send(message.translate("commands.player_settings.volume.unkownType", { redtick }));
    if (!player || (!player.playing && !player.paused))
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
      let filters: FilterObj | {};

      filters = {
        timescale: { rate: speed / 100 },
      };
  
      await player.send("filters", filters)
        .catch(e => { client.utils.logs(e, "slowed filter error"); return message.react(redtick); });

    return message.react("🔊");
  }
}

interface FilterObj {
  equalizer: [
    { band: number, gain: number },
    { band: number, gain: number },
  ],
  timescale: { pitch: number, rate: number },
  tremolo: { depth: number, frequency: number },
};