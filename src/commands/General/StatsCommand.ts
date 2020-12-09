import { Message, MessageEmbed } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import { version } from '../../../package.json';
import ms from 'ms';
import os from 'os';

export default class StatsCommand extends BaseCommand {
  constructor() {
    super('stats', {
      category: 'General',
      aliases: [],
      description: (m: Message) => m.translate("commands.general.stats.description"),
      ownerOnly: false,
      channelType: 'both',
      clientPermissions: ["EMBED_LINKS"],
      timeout: 5e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const core = os.cpus()[0];

    const embed = new MessageEmbed()
    .setColor(message.guild ? message.guild.me.displayHexColor : "BLACK")
    .setTitle(message.translate("commands.general.stats.embed.title"))
    .setDescription(message.translate("commands.general.stats.embed.description"))
    .addField(message.translate("commands.general.stats.embed.general.title"),
      `\`\`\`${[
        message.translate("commands.general.stats.embed.general.platform", { platform: os.platform }),
        message.translate("commands.general.stats.embed.general.uptime", { uptime: ms(os.uptime() * 1000, { long: true }) }),
      ].join("\n")}\`\`\``
    )
    .addField(message.translate("commands.general.stats.embed.cpu.title"), 
      `\`\`\`${[
        `${core.model}`,
        message.translate("commands.general.stats.embed.cpu.info", {
          cores: os.cpus().length.toString(),
          speed: core.speed.toString(),
        })
      ].join("\n")}\`\`\``
    )
    .addField(message.translate("commands.general.stats.embed.memory.title"), 
      `\`\`\`${[
        message.translate("commands.general.stats.embed.memory.total", {
          total: client.utils.formatBytes(process.memoryUsage().heapTotal),
        }),
        message.translate("commands.general.stats.embed.memory.used", {
          used: client.utils.formatBytes(process.memoryUsage().heapUsed),
        }),
      ].join("\n")}\`\`\``
    )
    .addField(message.translate("commands.general.stats.embed.bot.title"), 
    `\`\`\`${[
      message.translate("commands.general.stats.embed.bot.status", { status: client.status || "✅" }),
      message.translate("commands.general.stats.embed.bot.count", { count: client.guilds.cache.size }),
      message.translate("commands.general.stats.embed.bot.version", { version }),
      message.translate("commands.general.stats.embed.bot.uptime", {  uptime: ms(client.uptime, { long: true }) }),
    ].join("\n")}\`\`\``
  )

    return message.channel.send(embed);
  }
}