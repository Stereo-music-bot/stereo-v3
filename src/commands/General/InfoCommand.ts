import { Message, MessageEmbed, version as djsversion } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import { version as tsversion } from 'typescript';
import DiscordClient from '../../client/client';
import moment from 'moment';

export default class InfoCommand extends BaseCommand {
  constructor() {
    super('info', {
      category: 'General',
      aliases: ['bot', 'about'],
      description: (m: Message) => m.translate("commands.general.info.description"),
      clientPermissions: ['EMBED_LINKS'],
      ownerOnly: false,
      channelType: "both",
      timeout: 5e3
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const embed: MessageEmbed = new MessageEmbed()
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter(message.translate("commands.general.info.embed.footer"), 'https://discord.js.org/static/logo-square.png')
      .setTitle(message.translate("commands.general.info.embed.title", { bot: client.user.username }))
      .setColor(message.guild ? message.guild.me.displayHexColor : "BLUE")
      .addField(message.translate("commands.general.info.embed.general.title"), [
        message.translate("commands.general.info.embed.general.client", { client: client.user.toString() }),
        message.translate("commands.general.info.embed.general.commands", { emoji: client.utils.EmojiFinder('terminalicon').toString(), commands: client.cs.size.toString() }),
        message.translate("commands.general.info.embed.general.users", { users: client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toString() }), 
        `> ${client.utils.EmojiFinder('jslogo').toString()} | **NodeJs**: \`${process.version}\``,
        `> ${client.utils.EmojiFinder('tslogo').toString()} | **TypeScript**: \`v${tsversion}\``,
        `> ${client.utils.EmojiFinder('djslogo').toString()} | **Discord.js**: \`v${djsversion}\``,
        message.translate("commands.general.info.embed.general.creation", { 
          date: `${moment(client.user.createdTimestamp).format(`Do-MM-YYYY`)} ${moment(client.user.createdTimestamp).format(`HH:mm:ss`)}` 
        }),
        "\u200b"
      ])
      .addField(message.translate("commands.general.info.embed.creators.title", { bot: client.user.tag }), [
        message.translate("commands.general.info.embed.creators.dev", {
          emoji: client.utils.EmojiFinder("DaanGamesDG").toString(),
          user: client.users.cache.get("304986851310043136") ? 
            client.users.cache.get("304986851310043136").toString() :
            await client.users.fetch("304986851310043136", true, true) 
        }),
        message.translate("commands.general.info.embed.creators.me", { 
          emoji: client.utils.EmojiFinder("e_luzmog").toString(),
          user: client.users.cache.get("765295694583693372")
            ? client.users.cache.get("765295694583693372").toString()
            : await client.users.fetch("765295694583693372", true, true) 
        }),
        message.translate("commands.general.info.embed.creators.ca", { 
          emoji: client.utils.EmojiFinder("DinoAtlasDragon").toString(),
          user: client.users.cache.get("552788119334813716")
            ? client.users.cache.get("552788119334813716").toString() 
            : await client.users.fetch("552788119334813716", true, true) 
        }),
        message.translate("commands.general.info.embed.creators.cr", {
          emoji: client.utils.EmojiFinder("ChuggyTrain123").toString(),
          user: client.users.cache.get("548157913760530442") 
            ? client.users.cache.get("548157913760530442").toString() 
            : await client.users.fetch("548157913760530442", true, true) 
        }),
      ])
      .addField(message.translate("commands.general.info.embed.helpers", { bot: client.user.tag }), [
        `— **${client.users.cache.get("304986851310043136").tag}**: EN & NL`,
        `— **${client.users.cache.get("765295694583693372").tag}**: FR`,
      ]);
    return message.channel.send(embed);
  }
}