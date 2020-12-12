import { config } from 'dotenv';
config();
import { WebhookClient } from 'discord.js';
import utils from './utils/extensions/other/utils';
import Queue from './utils/extensions/music/queue';
import { GCInterface } from './utils/DataBase/interfaces';
import { registerCommands, registerEvents, registerWSEvents, registerMusicEvents } from './utils/registry';
import languageHandler from './utils/extensions/discord/language';
import DiscordClient from './client/client';
import mongoose from 'mongoose';
import { Manager } from 'lavaclient';

import './utils/extensions/discord/stereoMessage';

const client = new DiscordClient({});

(async () => {
  client.status = "✅";
  client.statusMsg = "—";

  client.guildConfig = new Map();
  client.languages = new languageHandler(client, './languages');
  client.languages.loadAll();

  client.utils = new utils(client);
  client.webhook = new WebhookClient('762318210959540234', 'qX0BfjL9GVopsV6zq1OXXEkeEvGC_3u9tHLUYTgCkWMZlsZE3azVJYNVsx1K5-8Vd12h');

  client.owners = ["304986851310043136"];

  client.music = new Manager([{
    id: "main",
    host: process.env.HOST,
    port: parseInt(process.env.PORT),
    password: process.env.PASSWORD,
  }], {
    shards: client.shard ? client.shard.count : 1,
    send(id, pk) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(pk);
    },
  });

  await registerCommands(client, '../commands');
  await registerEvents(client, '../events/ClientEvents');
  await registerWSEvents(client, '../events/WSEvents');
  await registerMusicEvents(client, client.music, '../events/musicEvents');

  client.login(process.env.DISCORD_BOT_TOKEN);

  mongoose.connect(process.env.DB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  mongoose.connection.on("connected" , () => {
    if (process.env.DISCORD_BOT_PREFIX === '+') client.webhook.send(
      `> ✅ | Successfully connected to database!`
    );
    return console.log('Mongoose Database successfully connected!');
  });
  mongoose.connection.on("err" , (err: Error) => {
    console.error(`Mongoose Error:\n ${err.stack ? err.stack : err.name} | ${err.message}`);
    return client.webhook.send(
      `> ❌ | New error | **DB Error** | Global DB Error | Error: \`${err.stack ? err.stack : err.name} | ${err.message}\``
    );
  });
  mongoose.connection.on("disconnected" , () => {
    console.warn("Mongoose Connection Lost :(");
    return client.webhook.send(
      `> ❌ | New error | **DB Warning** | Global DB Warning/Issue | Issue: \`DB Connection Lost\``
    );
  });
})();

declare module "lavaclient" {
  interface Player {
    queue: Queue;
    send(op: string, body?: any): Promise<void>;
    _connected: boolean;
    bass: 'hard' | 'medium' | 'low' | 'none';
    repeating: 'queue' | 'song' | 'always' | 'none';
    filter: 'nightcore' | 'default';
    radio?: { playing: boolean, name: string };
  }
}

declare module "discord.js" {
  interface Client {
    guildConfig: Map<string, GCInterface>,
    languages: languageHandler;
    utils: utils;
    webhook: WebhookClient;
    owners: string[];
    music: Manager;
    status: string,
    statusMsg: string,
  }

  interface Message {
    prefix: string;
    translate(path: string, variables?: Record<string, any>): string;
    language: string,
  }
}

