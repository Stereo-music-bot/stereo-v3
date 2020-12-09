import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class ForceskipCommand extends BaseCommand {
  constructor() {
    super('forceskip', {
      category: 'Queue Configuration',
      aliases: ["fs"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.queue_configuration.forceskip.description"),
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

    if (!player || !player.queue || !player.queue.current) 
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));

    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));

    await player.queue.skip(player);
    return message.react("⏭");
  }
}