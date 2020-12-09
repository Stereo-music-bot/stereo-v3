import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import ms from 'ms';

export default class PingCommand extends BaseCommand {
  constructor() {
    super('ping', {
      category: 'General',
      aliases: ['pong'],
      description: (m: Message) => m.translate("commands.general.ping.description"),
      ownerOnly: false,
      channelType: 'both',
      timeout: 5e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const msg = await message.channel.send(message.translate("commands.general.ping.loading"));

    const api = client.ws.ping;
    const uptime = ms(client.uptime, { long: true });
    const editLatency = (msg.createdTimestamp - Date.now()).toString();
    const edit = editLatency.startsWith('-')
    ? editLatency.slice(1)
    : editLatency;

    return msg.edit(message.translate("commands.general.ping.message", {
      api,
      uptime,
      edit,
    }))
  }
}