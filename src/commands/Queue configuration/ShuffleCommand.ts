import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class ShuffleCommand extends BaseCommand {
  constructor() {
    super('shuffle', {
      category: 'Queue Configuration',
      aliases: ['randomize'],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.queue_configuration.shuffle.description"),
      usage: (m: Message) => m.translate("commands.queue_configuration.shuffle.description"),
      timeout: 3e3,
      clientPermissions: ["ADD_REACTIONS"],
      rolePermissions: {
        ADD_SONGS: false,
        MANAGE_QUEUE: true,
        MANAGE_PLAYER: false,
      },
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const player = client.music.players.get(message.guild.id);
    const redtick = client.utils.EmojiFinder('redtick').toString();
    const { channel } = message.member.voice;

    if (!player || !player.queue || !player.queue.current || !player.queue.next[0]) 
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));

    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    player.queue.shuffle();
    return message.react("🔀");
  }
}