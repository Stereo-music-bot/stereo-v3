import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import ms from "ms";

export default class SeekCommand extends BaseCommand {
  constructor() {
    super('seek',  {
      category: 'Player Settings',
      aliases: [],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.player_settings.seek.description"),
      usage: (m: Message) => m.translate("commands.player_settings.seek.usage"),
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
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const player = client.music.players.get(message.guild.id);
    const { channel } = message.member.voice;

    const position = ms(args.join(" "));
    if (!player || (!player.playing && !player.paused))
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));

    if (isNaN(position) || position < 0)
      return message.channel.send(message.translate("commands.player_settings.seek.incorrectValue", { redtick }));

    await player.seek(position + player.position);
    return message.react("⏭");
  }
}