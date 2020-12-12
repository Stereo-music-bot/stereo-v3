import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class ResetCommand extends BaseCommand {
  constructor() {
    super('reset', {
      category: 'Player Settings',
      aliases: ["re"],
      description: (m: Message) => m.translate("commands.player_settings.reset.description"),
      rolePermissions: {
        ADD_SONGS: false,
        MANAGE_QUEUE: true,
        MANAGE_PLAYER: false,
      },
      ownerOnly: false,
      timeout: 15e3,
      channelType: "guild",
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const player = client.music.players.get(message.guild.id);
    const { channel } = message.member.voice;

    if (!player || (!player.playing && !player.paused))
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    await player.queue.reset();
    return message.react("🔄");
  }
}