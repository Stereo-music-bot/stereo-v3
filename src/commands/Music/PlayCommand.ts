import rest from '../../utils/extensions/music/rest';
import Queue from '../../utils/extensions/music/queue';
import { Message, MessageEmbed } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import { LoadTrackResponse } from '@kyflx-dev/lavalink-types';

export default class PlayCommand extends BaseCommand {
  constructor() {
    super('play', {
      category: 'Music',
      aliases: ['p'],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.music.play.description"),
      usage: (m: Message) => m.translate("commands.music.play.usage"),
      timeout: 5e3,
      clientPermissions: ['EMBED_LINKS'],
      rolePermissions: {
        ADD_SONGS: true,
        MANAGE_QUEUE: false,
        MANAGE_PLAYER: false,
      },
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const warning = client.utils.EmojiFinder("warning").toString();
    let song = args.join(' ');
    let player = client.music.players.get(message.guild.id);
    const { channel } = message.member.voice;

    if (!player && (!channel || !channel.joinable || !channel.speakable)) return message.channel.send(message.translate("music.common.lockedChannel", { redtick }));
    if (message.guild.me.voice.channel && message.guild.me.voice.channel.id !== channel.id)
      return message.channel.send(message.translate("music.common.foreignChannel", { redtick, channelName: message.guild.me.voice.channel.name }));
    
    let result: LoadTrackResponse;
    let type = args[0];
    try {
      message.channel.startTyping();
      ['--soundcloud', '--sc'].includes(type.toLowerCase())
      ? result = await rest.search(`scsearch:${encodeURIComponent(song = args.slice(1).join(' '))}`)
      : result = await rest.search(
        song.includes('https://') 
          ? encodeURI(song)
          : `ytsearch:${encodeURIComponent(song)}`
      );
    } catch (error) {
      message.channel.stopTyping();
      await message.channel.send(message.translate("commands.music.play.fails.error", { error, warning }));
      return client.utils.logs(error, "Play Command Error");
    }

    message.channel.stopTyping();
    if (!result || !result.tracks || !result.tracks.length) return message.channel.send(message.translate("commands.music.play.fails.noResults", { redtick }));

    player = client.music.players.get(message.guild.id) || client.music.create(message.guild.id);
    if (!player.queue) player.queue = new Queue(player);
    if (!player.radio) player.radio = { playing: false, name: undefined };
    const Announce = this.announce(client, message.guild.id);

    switch (result.loadType) {
      case 'TRACK_LOADED':
        player.queue.add(result.tracks[0].track, message.author.id);
        if (!player.connected) player.connect(channel.id, { selfDeaf: true });
        if (!player.playing && !player.paused) await player.queue.start(message, Announce);
        if (message.guild.me.permissions.has('DEAFEN_MEMBERS')) message.guild.me.voice.setDeaf(true);
        return message.channel.send(message.translate("commands.music.play.success.song", { title: result.tracks[0].info.title }));

      case 'PLAYLIST_LOADED':
        result.tracks.forEach(t => player.queue.add(t.track, message.author.id));
        if (!player.connected) player.connect(channel.id, { selfDeaf: true });
        if (!player.playing && !player.paused) await player.queue.start(message, Announce);
        if (message.guild.me.permissions.has('DEAFEN_MEMBERS')) message.guild.me.voice.setDeaf(true);
        return message.channel.send(message.translate("commands.music.play.success.playlist", { name: result.playlistInfo.name || "unkown", length: result.tracks.length }));
      
      case 'SEARCH_RESULT':
        const embed = new MessageEmbed()
          .setTitle(message.translate("commands.music.play.searchResult.title", { song }))
          .setDescription(result.tracks.slice(0, 10).map((t, i: number) => `**${i + 1}.** [${t.info.title}](${t.info.uri})`))
          .setColor(message.member.displayHexColor || 'BLUE')
          .setThumbnail(`https://i.ytimg.com/vi/${result.tracks[0].info.identifier}/hqdefault.jpg`)
          .setFooter(message.translate("commands.music.play.searchResult.footer", { type: ['--soundcloud', '--sc'].includes(type.toLowerCase()) ? 'Soundcloud' : 'Youtube' }))

        await message.channel.send(embed);

        const collector = message.channel.createMessageCollector((m: Message) => {
          return m.author.id === message.author.id && new RegExp(`^([1-9]|10|cancel)$`, 'i').test(m.content);
        }, { time: 6e4, max: 1});

        collector.on("collect", async (m: Message) => {
          if (/cancel/i.test(m.content)) return collector.stop('cancelled');

          const track = result.tracks[Number(m.content) - 1];
          player.queue.add(track.track, message.author.id);

          if (!player.connected) player.connect(channel.id, { selfDeaf: true });
          if (!player.playing && !player.paused) await player.queue.start(message, Announce);

          if (message.guild.me.permissions.has('DEAFEN_MEMBERS')) message.guild.me.voice.setDeaf(true);
          return message.channel.send(message.translate("commands.music.play.success.song", { title: track.info.title }));

        });

        collector.on("end", (_, reason) => {
          if (['time'].includes(reason)) return message.channel.send(message.translate("commands.music.play.fails.cancelled.time", { redtick }));
          if (['cancelled'].includes(reason)) return message.channel.send(message.translate("commands.music.play.fails.cancelled.user", { greentick: client.utils.EmojiFinder("greentick").toString() }));
        });
        break;

      case "NO_MATCHES": return message.channel.send(message.translate("commands.music.play.fails.loadError", { redtick }));
      case "LOAD_FAILED": return message.channel.send(message.translate("commands.music.play.fails.loadError", { redtick }));
    }  
  }

  announce(client: DiscordClient, id: string): boolean {
    return client.guildConfig.has(id) 
      ? client.guildConfig.get(id).announce 
        ? true 
        : false 
      : false;
  }
}