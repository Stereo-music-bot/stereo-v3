import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

const gains = {
  hard: 0.12,
  medium: 0.07,
  low: 0.04,
  none: 0,
};
const levels = [
  "hard", 
  "medium", 
  "low", 
  "none",
];

export default class BassboostCommand extends BaseCommand {
  constructor() {
    super('bassboost', {
      category: 'Player Settings',
      aliases: ["bb", "bass"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.player_settings.bassboost.description"),
      usage: (m: Message) => m.translate("commands.player_settings.bassboost.usage"),
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
    const level = (args[0] || '').toLowerCase();

    if (!level || !levels.includes(level)) 
      return message.channel.send(message.translate("commands.player_settings.bassboost.invalidType", { types: levels.join('`, `'), redtick }));
    if (!player || (!player.playing && !player.paused))
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    await player.setEqualizer(
      Array(6)
        .fill(null)
        .map((_, i) => ({ band: i++, gain: gains[level.toLowerCase()] }))
    );

    player.bass = level as "hard" | "medium" | "low" | "none";
    return message.react("🎚️");
  }
}