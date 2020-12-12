import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import rest from "../../utils/extensions/music/rest";
import fetch from "node-fetch";

export default class RadioCommand extends BaseCommand {
  constructor() {
    super('radio', {
      category: 'Music',
      aliases: [],
      description: (m: Message) => m.translate("commands.music.radio.description"),
      usage: (m: Message) => m.translate("commands.music.radio.usage"),
      clientPermissions: ['EMBED_LINKS'],
      rolePermissions: {
        ADD_SONGS: true,
        MANAGE_QUEUE: false,
        MANAGE_PLAYER: false,
      },
      ownerOnly: false,
      timeout: 7e3,
      channelType: "guild",
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    let player = client.music.players.get(message.guild.id);

    const station = args.map(a => a).join(' ');
    const { channel } = message.member.voice;

    if (player)
      return message.channel.send(message.translate("commands.music.radio.playerExists", { redtick }));
    if (!channel)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.channels.cache.get(player.channel).name }));
    
    player = client.music.create(message.guild.id);

    let data: any;
    try {
      data = await (await fetch(`https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(station)}`)).json();
    } catch (e) {
      message.channel.send(message.translate("music.errors.error", { redtick, title: station }));
      return client.utils.logs(e, "radio error");
    }
   
    if (!data.length) return message.channel.send(message.translate("commands.music.play.fails.noResults", { redtick }));

    const { tracks } = await rest.search(data[0].url);
    if (!tracks.length) return message.channel.send(message.translate("commands.music.play.fails.noResults", { redtick }));

    if (!player.connected) player.connect(channel.id, { selfDeaf: true });
    if (!player.playing && !player.paused) await player.play(tracks[0].track);

    setInterval(async () => {
      data = await (await fetch(`https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(station)}`)).json();
      await player.play(tracks[0].track);
    }, 18e5);

    return message.channel.send(message.translate("commands.music.radio.success", { station }));
  }
}