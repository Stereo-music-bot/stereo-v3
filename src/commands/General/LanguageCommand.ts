import { Message, MessageEmbed, User, MessageReaction, Collection } from 'discord.js';
import { guildConfig } from "../../utils/DataBase/guildconfigSchema";
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class LanguageCommand extends BaseCommand {
  constructor() {
    super('language', {
      category: 'General',
      aliases: ["setlang", "lang"],
      ownerOnly: false,
      channelType: 'guild',
      description: (m: Message) => m.translate("commands.general.language.description"),
      usage: (m: Message) => m.translate("commands.general.language.usage"),
      userPermissions: ["MANAGE_GUILD"],
      clientPermissions: ["MANAGE_MESSAGES", "ADD_REACTIONS"],
      timeout: 6e4
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const rt = client.utils.EmojiFinder('redtick');
    const gt = client.utils.EmojiFinder('greentick');

    const redtick = rt.toString();
    const greentick = gt.toString();

    const language: string = args.join(" ");

    if (!language) {
      const embed: MessageEmbed = new MessageEmbed()
      .setTitle(message.translate('commands.general.language.embed'))
      .setDescription(client.languages.languages.keyArray().map((k, i) => `**${i + 1}**. ${k}`).join('\n'))
      .setColor(message.member.displayHexColor || 'BLUE')
      return message.channel.send(embed);
    };

    const lang = client.languages.languages.get(language);
    if (!lang) return message.channel.send(message.translate('commands.general.language.fail.unkownLang', { language, prefix: message.prefix }));
    if (language === client.guildConfig.get(message.guild.id).language) return message.channel.send(message.translate("commands.general.language.fail.sameLang", { redtick }));

    const embed: MessageEmbed = new MessageEmbed()
    .setTitle(message.translate('commands.general.language.prompt.title'))
    .setDescription(message.translate('commands.general.language.prompt.confirmText', { language, redtick, greentick }))
    .setFooter(message.translate('commands.general.language.prompt.footer', { user: message.author.tag }), message.author.displayAvatarURL({ dynamic: true, size: 4096 }))
    .setColor(message.member.displayHexColor || 'BLUE');

    const filter = (reaction: MessageReaction, user: User) => {
      return user.id === message.author.id && [rt.id, gt.id].includes(reaction.emoji.id);
    };

    const msg = await message.channel.send(embed);
    [greentick, redtick].forEach(emoji => msg.react(emoji));

    const collector = await msg.awaitReactions(filter, { max: 1, time: 3e4, errors: ["time"] }).catch(e => new Collection<string, MessageReaction>());
    if (!collector.size) return message.channel.send(message.translate("commands.general.language.fail.cancelled", { redtick })) 
    && msg.delete().catch(e => "")
    && msg.reactions.removeAll().catch(e => "");

    if (collector.first().emoji.id === rt.id) return message.channel.send(message.translate("commands.general.language.fail.cancelled", { redtick })) 
    && msg.delete().catch(e => "")
    && msg.reactions.removeAll().catch(e => "");

    else if (collector.first().emoji.id === gt.id) {
      msg.reactions.removeAll().catch(e => "");

      const config = client.guildConfig.get(message.guild.id);
      const newConfig = {...config, language};
      
      client.guildConfig.set(message.guild.id, newConfig);
      await guildConfig.findOneAndUpdate({ guildId: message.guild.id }, newConfig, (e) => { if (e) throw new Error(e) })
      .catch((e) => { 
        client.utils.logs(e, "set language error");
        return msg.edit(message.translate("commands.general.language.fail.error", { warning: client.utils.EmojiFinder("warning").toString() }));
      });

      return message.channel.send(message.translate("commands.general.language.success", { greentick })) && msg.delete().catch(e => "");
    }
  }
}