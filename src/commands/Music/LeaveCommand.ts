import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class LeaveCommand extends BaseCommand {
  constructor() {
    super('leave', {
      category: 'Music',
      aliases: ['disconnect', "goaway", "getlost", "fuckoff", "die"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.music.leave.description"),
      timeout: 1e3,
      clientPermissions: ['ADD_REACTIONS'],
      rolePermissions: {
        ADD_SONGS: false,
        MANAGE_QUEUE: false,
        MANAGE_PLAYER: true,
      },
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const { channel } = message.member.voice;
    const player = client.music.players.get(message.guild.id);
    const redtick = client.utils.EmojiFinder("redtick").toString();

    if (!player) return;
    if (!channel || player.channel !== channel.id) 
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    player.queue ? player.queue.clear() : "";
    return message.react("👋");
  }
}