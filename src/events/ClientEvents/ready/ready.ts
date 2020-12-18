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

    client.user.id === "750232563779633153" ? this.devStatus(client) : this.status(client);
    
    client.guilds.cache.forEach(guild => this.loadConfig(client, guild));

    if (client.user.username === 'Stereo') {
      setInterval(async function() {
        let channelId = '751459649538228256';
        let guild = client.guilds.cache.get(`743145077206941747`);
        let channel = guild.channels.cache.get(channelId);
        let count = client.guilds.cache.size;
  
        if (!channel) return console.log('no channel found');
        await channel.edit({ name: `🎊 Server Count: ${count}`}, `10 minutes passed. Changing server count`);
  
      }, 300000);
    }
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

  async devStatus(client: DiscordClient) {
    await client.user.setActivity('with v3 👀', { type: "PLAYING" });
    await client.user.setStatus('idle');
  }

  async status(client: DiscordClient) {
    let activities = ['+help', 'with my dj set', 'Mention me to see the prefix', `in ${client.guilds.cache.size} servers!`], i = 0;
    setInterval(() => client.user.setActivity(activities[i++ % activities.length] + ' | Stereo Music', { type: 'PLAYING' }), 15000);
    await client.user.setStatus('online');
  }
}