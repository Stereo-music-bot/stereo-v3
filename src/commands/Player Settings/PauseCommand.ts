import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class PauseCommand extends BaseCommand {
  constructor() {
    super('pause', {
      category: 'Player Settings',
      aliases: ["stop"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.player_settings.pause.description"),
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

    if (!player)
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!player.playing) return message.react(redtick);
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    await player.pause()
      .catch(e => {
        client.utils.logs(e, "pause error");
        return message.channel.send(message.translate("commands.player_settings.pause.error", { warning: client.utils.EmojiFinder("redtick").toString() }));
      });

    return message.react("⏸");
  }
}