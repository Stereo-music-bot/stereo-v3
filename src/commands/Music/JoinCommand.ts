import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import { Player } from 'lavaclient';
import Queue from "../../utils/extensions/music/queue";

export default class JoinCommand extends BaseCommand {
  constructor() {
    super('join', {
      category: 'Music',
      aliases: ["connect", "come", "getin"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.music.join.description"),
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
    let player: Player = client.music.players.get(message.guild.id);
    const redtick = client.utils.EmojiFinder("redtick").toString();

    if (player && !message.guild.me.voice.channel) {
      player.queue ? player.queue.clear() :
        client.music.destroy(message.guild.id);
    };

    if (player && message.guild.me.voice.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.me.voice.channel.name }));
    if (!channel)
      return message.channel.send(message.translate("music.common.unkownChannel", { redtick }));

    player = client.music.create(message.guild.id);
    player.connect(channel.id, { selfDeaf: true });
    player.queue = new Queue(player);

    player.queue.timeout = setTimeout(() => {
      player.queue.clear();
      return message.channel.send(message.translate("music.finished.empty.second"));
    }, 6e4 * 5);

    return message.react("🎧");
  }
}