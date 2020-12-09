import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class VolumeCommand extends BaseCommand {
  constructor() {
    super('volume', {
      category: 'Player Settings',
      aliases: ["v", "vol"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.player_settings.volume.description"),
      usage: (m: Message) => m.translate("commands.player_settings.volume.usage"),
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
    const player = client.music.players.get(message.guild.id);
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const { channel } = message.member.voice;
    const volume = parseInt(args[0]);

    if (!volume || isNaN(volume) || volume > 200 || volume < 0) 
      return message.channel.send(message.translate("commands.player_settings.volume.unkownType", { redtick }));
    if (!player || (!player.playing && !player.paused))
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    await player.setVolume(volume)
      .catch(e => {
        client.utils.logs(e, "volume change error");
        return message.channel.send(message.translate("commands.player_settings.error", { warning: client.utils.EmojiFinder("redtick").toString() }));
      });

    return message.react("🔊");
  }
}