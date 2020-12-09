import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class SkipCommand extends BaseCommand {
  constructor() {
    super('skip', {
      category: 'Queue Configuration',
      aliases: ["s", "next"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.queue_configuration.skip.description"),
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
    const redtick = client.utils.EmojiFinder('redtick').toString();
    const player = client.music.players.get(message.guild.id);
    const { channel } = message.member.voice;


    if (!player || !player.queue || !player.queue.current) 
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));

    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));

    const vote = player.queue.votes;
    const voteCount: number = channel.members.filter(m => !m.user.bot).size - 1;

    if (vote.users.includes(message.author.id)) return message.react(redtick);
  
    if (vote.votes + 1 >= voteCount) {
      await player.queue.skip(player);
      if (player.queue.current) return message.react("⏭");
    } else if (voteCount <= 0) {
      await player.queue.skip(player);
      if (player.queue.current) return message.react("⏭");
    } else {
      vote.votes += 1;
      vote.users.push(message.author.id);
      return message.react("👍");
    }
  }
}