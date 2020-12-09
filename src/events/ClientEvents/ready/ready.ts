import { guildConfig } from "../../../utils/DataBase/guildconfigSchema";
import BaseEvent from '../../../utils/structures/BaseEvent';
import DiscordClient from '../../../client/client';
import { Guild } from "discord.js";

export default class ReadyEvent extends BaseEvent {
  constructor() {
    super('ready');
  }
  async run (client: DiscordClient) {
    client.music.init(client.user.id);
    console.log(`${client.user.tag} has logged in.`);
    await client.user.setActivity('with v3 👀', { type: "PLAYING" });
    await client.user.setStatus('idle');

    client.guilds.cache.forEach(guild => this.loadConfig(client, guild));
  }

  async loadConfig(client: DiscordClient, guild: Guild) {
    let data = await guildConfig.findOne({ guildId: guild.id });
    if (!data) data = await guildConfig.create({ 
      guildId: guild.id,
      prefix: process.env.DISCORD_BOT_PREFIX,
      announce: true,
      partner: false,
      language: "en-US",
    });
     
    const doc = await data.toObject();
    return client.guildConfig.set(guild.id, doc);
  }
}