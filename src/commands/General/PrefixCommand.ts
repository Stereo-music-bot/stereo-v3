import { Message } from 'discord.js';
import { guildConfig } from "../../utils/DataBase/guildconfigSchema";
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class PrefixCommand extends BaseCommand {
  constructor() {
    super('prefix', {
      category: 'General',
      aliases: ['setprefix'],
      description: (m: Message) => m.translate('commands.general.prefix.description'),
      usage: (m: Message) => m.translate('commands.general.prefix.usage'),
      userPermissions: ['MANAGE_GUILD'],
      ownerOnly: false,
      timeout: 15e3,
      channelType: "guild",
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder('redtick').toString();
    const greentick = client.utils.EmojiFinder('greentick').toString();
    let prefix = args[0];

    if (!prefix) return message.channel.send(message.translate("message.prefix", { prefix: message.prefix, mention: client.user.toString() }));

    if (!prefix || prefix.length > 5) return message.channel.send(message.translate('commands.general.prefix.fail.incorrectPrefix', { redtick }));
    prefix = ["reset", process.env.DISCORD_BOT_PREFIX].includes(prefix.toLowerCase()) ? process.env.DISCORD_BOT_PREFIX : prefix;

    try {
      const config = client.guildConfig.get(message.guild.id);
      const newConfig = {...config, prefix};

      client.guildConfig.set(message.guild.id, newConfig);
      guildConfig.findOneAndUpdate({ guildId: message.guild.id }, newConfig, (err: any) => { if (err) throw new Error(err)});

      if (prefix === process.env.DISCORD_BOT_PREFIX) return message.channel.send(message.translate('commands.general.prefix.success.reset', { greentick, prefix }));
      return message.channel.send(message.translate('commands.general.prefix.success.changed', { greentick, prefix }));
    } catch (e) {
      message.channel.send(message.translate('commands.general.prefix.fail.error', { warning: client.utils.EmojiFinder("warning").toString() }));
      return client.utils.logs(e, "prefix edit error");
    }
  }
}