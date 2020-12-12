import { Message, MessageEmbed } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import FuzzySearch from 'fuzzy-search';
import ms from 'ms';

const inviteLink = 'https://stereodiscord.glitch.me/invite';
const supportServer = 'https://discord.gg/bvn89qP';
const website = 'https://stereodiscord.glitch.me/';
const donationPage = 'https://www.paypal.com/paypalme/daangamesdg';


export default class HelpCommand extends BaseCommand {
  constructor() {
    super('help', {
      category: 'General',
      aliases: ['commandslist', "commands"],
      ownerOnly: false,
      channelType: 'both',
      description: (m: Message) => m.translate("commands.general.help.description"),
      usage: (m: Message) => m.translate("commands.general.help.usage"),
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
  	const prefix = message.prefix;

    let embed = new MessageEmbed()
      .setTitle(message.translate("commands.general.help.embed.title", { name: message.guild ? message.guild.name : message.author.username }))
      .setThumbnail(message.guild ? message.guild.iconURL({ dynamic: true, size: 4096 }) : client.user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setColor(message.member ? message.member.displayHexColor : 'BLUE')
    
    embed.addField(
      message.translate("commands.general.help.embed.size.title", { 
        size: client.owners.includes(message.author.id) 
        ? client.cs.size 
        : (client.cs.size - client.cs.filter(c => c.options.ownerOnly).size) 
      }), 
      message.translate("commands.general.help.embed.size.msg", { inviteLink, supportServer, website, donationPage })
    );
    
    if (args[0]) {
      const cmd = client.commands.get(args[0].toLowerCase()); 
      if (!cmd) {
        const result = noResult(client.cs.array(), args[0]);
        return message.channel.send(message.translate("commands.general.help.noResults", { 
            search: result.length ? message.translate("commands.general.help.search", { query: result.map(c => `\`${c.name}\``).join(', ') }) : ""
          })
        );
      };
      const options = cmd.options;

      const usage = options.usage ? options.usage(message).split(/\|/g).join(" ") : "";
      const desc = options.description ? options.description(message).split(/\s+/) : message.translate("commands.general.help.missing", { item: message.translate("commands.general.help.items.desc") }).split(/\s+/);
      const description = (desc[desc.length - 1].includes(".") || desc[desc.length - 1].includes("?") || desc[desc.length - 1].includes("!"))
      ? desc.join(" ") : desc.join(" ") + ".";

      embed.setDescription([
        message.translate("commands.general.help.embed.description.name", { name: cmd.name }),
        message.translate("commands.general.help.embed.description.category", { category: options.category }),
        message.translate("commands.general.help.embed.description.aliases", { aliases: options.aliases.length ? options.aliases.map(alias => `\`${alias}\``).join(' ') : '`—`' }) + "\n",
        message.translate("commands.general.help.embed.description.timeout", { timeout: !options.timeout ? '—' : ms(options.timeout, { long: false }) }),
        message.translate("commands.general.help.embed.description.description", { description }),
        message.translate("commands.general.help.embed.description.usage", { usage: `${cmd.name} ${usage}` }) + "\n",
        message.translate("commands.general.help.embed.description.owneronly", { emoji: options.ownerOnly ? '🔒' : '🔓', boolean: message.translate(`commands.general.help.embed.description.${options.ownerOnly}`) }),
        message.translate("commands.general.help.embed.description.rolePerms", { 
          perms: options.rolePermissions ? 
          options.rolePermissions.ADD_SONGS 
          ? '`Add Songs`'
          : options.rolePermissions.MANAGE_QUEUE
            ? '`Manage Queue`'
            : options.rolePermissions.MANAGE_QUEUE 
              ? '`Manage Player`' 
              : '`—`'
          : '`—`' 
        }),
        message.translate("commands.general.help.embed.description.userPerms", { perms: options.userPermissions ? client.utils.formatPerms(options.userPermissions) : '`—`' }),
        message.translate("commands.general.help.embed.description.clientPerms", { perms: options.clientPermissions ? client.utils.formatPerms(options.clientPermissions) : '`—`' }),
      ]);
      
      return message.channel.send(embed);
    } else {
      let categories: string[];
      if (!client.owners.includes(message.author.id)) categories = removeDuplicates(client.cs.filter(cmd => !cmd.options.ownerOnly).map(cmd => cmd.options.category));
      else categories = removeDuplicates(client.cs.map(cmd => cmd.options.category));

      embed.setDescription(message.translate("message.prefix", { prefix, mention: client.user.toString() }));
      
      for (const category of categories) embed.addField(
        `${category} — ( ${client.cs.filter(cmd => cmd.options.category === category).size} )`, 
        client.cs.filter(cmd => cmd.options.category === category).map(cmd => `\`${cmd.name}\``).join(' ')
      );

      return message.channel.send(embed);
    }
  }
}

function removeDuplicates(arr: Array<string>): Array<string> {
  return [...new Set(arr)];
}

function noResult(commands: Array<BaseCommand>, input: string) {
  const searcher = new FuzzySearch(commands, ['options.aliases', 'name'], {
    caseSensitive: true,
    sort: true,
  });
  return searcher.search(input);
}