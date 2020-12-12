import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class StatusCommand extends BaseCommand {
  constructor() {
    super('status', {
      category: 'Owner Only', 
      aliases: [],
      channelType: "both",
      ownerOnly: true
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    client.status = 
      args.length && args[0].toLowerCase() === "true" 
        ? client.status === "✅" 
          ? "❌" 
          : "✅" 
        : client.status;
        
    client.statusMsg = 
      args.length && args[0].toLowerCase() === "true" 
        ? args.slice(1).join(" ") 
        : args.length 
          ? args.join(" ") 
          : client.statusMsg;

    message.channel.send(`> 👍 | Changing status to \`${client.status}\` & changed the msg to \`${client.statusMsg.substr(0, 950)}\`!`);
  }
}