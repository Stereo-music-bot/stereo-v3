import { Message, MessageEmbed } from 'discord.js';
import { EventEmitter } from 'events';
import { Player } from 'lavaclient';
import { decode } from '@lavalink/encoding';
import rest from "./rest";

interface QueueObject {
  track: string;
  requester: string;
}

interface RepeatObject {
  song: boolean;
  queue: boolean;
  always: boolean;
}

export default class Queue extends EventEmitter {
  public next: QueueObject[] = [];
  public previous: QueueObject[] = [];
  public current: QueueObject;

  public repeat: RepeatObject = { song: false, queue: false, always: false };
  public votes: { users: string[], votes: number } = { users: [], votes: 0 };

  public announce: boolean = true;
  private message: Message;

  public timeout: NodeJS.Timeout = null;
  public pauseTimeout: NodeJS.Timeout = null;

  public constructor(public player: Player) {
    super();


    player
    .on('end', async (tet) => {
        if (tet && ["REPLACED", "STOPPED"].includes(tet.reason)) return;
        if (this.repeat.song) this.next.unshift(this.current);

        if (this.message.guild.me.voice.channel.members.size === 1 && !this.repeat.always) return this.emit('finished', 'Alone');
        this._next();

        if (!this.current) return this.emit('finished', 'emptyQueue');
        await player.play(this.current.track);
    })
    .on('start', async (sevt) => {
      if (!sevt) return;
      if (this.timeout) clearTimeout(this.timeout);
      if (this.pauseTimeout) clearTimeout(this.pauseTimeout);

      this.player = this.message.client.music.players.get(this.message.guild.id);
      this.votes = { users: [], votes: 0 };

      if (!this.announce) return;
      let { title, identifier, uri, length } = decode(sevt.track);
      
      if (title && title.length === 0 && this.player.radio && this.player.radio.name && !this.player.radio.playing) {
          title = this.player.radio.name;
          this.player.radio.playing = true;
      };
      
      const embed = new MessageEmbed()
          .setAuthor(this.message.translate("music.announce.embed.title", { title }), "https://emoji.gg/assets/emoji/6935_Plak_Emoji.gif")
          .setDescription([
              this.message.translate("music.announce.embed.description.song", { song: `[${title.replace(/\[/g, '').replace(/\]/g, '')}](${uri})` }),
              this.message.translate("music.announce.embed.description.requester", { requester: this.message.guild.members.cache.get(this.current.requester).toString() }),
              this.message.translate("music.announce.embed.description.duration", { duration: this.message.client.utils.formatTime(Number(length)) }),
          ])
          .setThumbnail(`https://i.ytimg.com/vi/${identifier}/hqdefault.jpg`)
          .setColor(this.message.guild.members.cache.get(this.current.requester).displayHexColor || 'BLUE')
      return this.message.channel.send(embed)
        .catch(e => { return this.message.client.utils.logs(e, "Announce Error") });
  })
  .on('stuck', async () => {
      const { title } = decode(this.current.track);
      await this.message.client.webhook.send(`> ❌ | New error | **${this.message.guild.name}** | Play error | Error: \`Player stuck on song: ${title} | ${this.current.track}\``);
      this.message.channel.send(this.message.translate("music.errors.stuck", { title, redtick: this.message.client.utils.EmojiFinder("redtick").toString() }))
      .catch(e => this.message.client.utils.logs(e, "Announce Player Stuck Error"));
      return this.skip(this.player);
  })
  .on('error', async (e) => {
      let title: any;
      try {
          const d = decode(this.current.track);
          title = d.title;
      } catch (e) { title = 'Unknown' }
      await this.message.client.webhook.send(`> ❌ | New error | **${this.message.guild.name}** | Song error | Song: ${title} | Error: \`${!e.exception ? e.error : e.exception.message}\``);
      this.message.channel.send(this.message.translate("music.errors.error", { title, redtick: this.message.client.utils.EmojiFinder("redtick").toString() }))
      .catch(e => this.message.client.utils.logs(e, "Announce Player `error` Error"));
      return this.skip(this.player);
  })
  .on("closed", (wsce) => this.emit("finished", "disconnect"));

  this.on('finished', async (reason: string) => {
      if ((this.repeat.queue && reason !== 'Alone') || this.repeat.always) {
          this.next = this.previous;
          this.next.length ? '' : this.next.push(this.current);
          if (!this.next.length) return this.emit('finished', 'empty');
          this.current = this.next.shift();
          this.previous = [];
          return await this.start(this.message, this.announce);
      };

      switch (reason) {
          case 'Alone':
              if (this.repeat.always) return;

              this.message.channel.send(this.message.translate("music.finished.alone"))
              .catch(e => this.message.client.utils.logs(e, "Alone announce Error"));
              return await this.clear();
      
          case 'empty':
          default:
              this.message.channel.send(this.message.translate("music.finished.empty.first"))
              .catch(e => this.message.client.utils.logs(e, "Empty 1 announce Error"));
              const timeout = setTimeout(() => { 
                return this.message.channel.send(this.message.translate("music.finished.empty.second"))
                .catch(e => this.message.client.utils.logs(e, "Empty 2 announce Error")) 
                && this.clear();
              }, 6e4 * 5);

              return this.timeout = timeout;
          case 'disconnect':
              this.message.channel.send(this.message.translate("music.finished.disconnected"))
              .catch(e => this.message.client.utils.logs(e, "Disconnected announce Error"));
              return await this.clear();
          case "exceedingTimeLimit":
            this.message.channel.send(this.message.translate("music.finished.exceedingTimeLimit"))
            .catch(e => this.message.client.utils.logs(e, "Exceeding limit announce Error"));
            return this.clear();
      };
  });
  }

  public _next() {
      this.previous.push(this.current);
      return (this.current = this.next.shift());
  };

  public async clear() {
    this.next = [];
    this.previous = [];
    this.repeat = { song: false, queue: false, always: false };

    return await this.player.manager.destroy(
      this.message ? this.message.guild.id : this.player.guild
    );
  };

  public async start(message: Message, announce: boolean) {
    this.announce = announce;
    this.message = message;
    this.votes = { votes: 0, users: [] };
    if (!this.current) this._next();
    await this.player.play(this.current.track);
  };

  public add(track: string, requester: string) {
    return this.next.push({ track, requester });
  };

  public async skip(player: Player) {
    if (this.repeat.song) this.next.unshift(this.current);
    if (this.repeat.queue || this.repeat.always) this.previous.push(this.current);
    player.stop();
    this._next();
    player.radio = undefined;
    this.votes = { votes: 0, users: [] };
    if (!this.current || !this.current.track) return this.emit('finished', 'empty');
    return await player.play(this.current.track);
  };

  public shuffle() {
    for (let i = this.next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.next[i], this.next[j]] = [this.next[j], this.next[i]];
      }
    return this.next;
  }

  public async remove(song: number) {
    const Number = song - 1;
    return this.next = this.next.filter((_, i) => i !== Number);
  }

  public async skipto(song: number) {
    this.next = this.next.slice(song);
    return await this.skip(this.player);
  }

  public setRepeat(type: string, repeat: RepeatObject) {
    this.player.repeating = type as 'queue' | 'song' | 'always' | 'none';
    return this.repeat = repeat;
  }

  public async reset() {
    const player = this.message.client.music.players.get(this.message.guild.id);
    this.repeat = { song: false, queue: false, always: false };
    player.repeating = 'none';
    player.filter = 'default';
    player.bass = 'none';
    await player.send('filters', {});
    await player.setVolume(100);
    await player.setEqualizer(
        Array(6)
          .fill(null)
          .map((_, i) => ({ band: i++, gain: 0 }))
      );

    return this.player = player;
  }

  public Announce() {
    return this.announce = !this.announce;
  }

  public fix() {

  }

  public vote(id: string) {
    return this.votes = { users: [...this.votes.users, id], votes: this.votes.votes + 1 };
  };
}