import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class RemoveCommand extends BaseCommand {
  constructor() {
    super('remove', {
      category: 'Queue Configuration',
      aliases: [],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.queue_configuration.remove.description"),
      usage: (m: Message) => m.translate("commands.queue_configuration.remove.usage"),
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
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const player = client.music.players.get(message.guild.id);
    const { channel } = message.member.voice;
    const id = parseInt(args[0]);

    if (!player || (!player.playing && !player.paused))
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    if (isNaN(id) || id > player.queue.next.length || id < player.queue.next.length) return message.react(redtick);
    
    await player.queue.remove(id);
    return message.react("🗑");
  }
}