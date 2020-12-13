import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class VaporwaveCommand extends BaseCommand {
  constructor() {
    super('slowed', {
      category: 'Player Settings',
      aliases: ["vw"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.player_settings.slowed.description"),
      timeout: 3e3,
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

    if (!player || (!player.playing && !player.paused))
      return message.channel.send(message.translate("music.common.noQueue", { redtick }));
    if (!channel || channel.id !== player.channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    let filters: FilterObj | {};

    if (player.filter === "slowed") filters = {};
    else filters = {
      equalizer: [
        { band: 1, gain: 0.3 },
        { band: 0, gain: 0.3 },
      ],
      timescale: { pitch: 1.1, rate: 0.8 },
      tremolo: { depth: 0.3, frequency: 14 },
    };

    player.filter = player.filter === "slowed" ? "default" : "slowed";
    await player.send("filters", filters)
      .catch(e => { client.utils.logs(e, "slowed filter error"); return message.react(redtick); });

    return message.react("🎚");
  }
}

interface FilterObj {
  equalizer: [
    { band: number, gain: number },
    { band: number, gain: number },
  ],
  timescale: { pitch: number },
  tremolo: { depth: number, frequency: number },
};