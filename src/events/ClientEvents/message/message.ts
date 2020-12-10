import BaseEvent from '../../../utils/structures/BaseEvent';
import { Message, TextChannel } from 'discord.js';
import DiscordClient from '../../../client/client';
import ms from 'ms';

const timeouts: Map<string, number> = new Map<string, number>();

export default class MessageEvent extends BaseEvent {
  constructor() {
    super('message');
  }

  async run(client: DiscordClient, message: Message) {
    const redtick = client.utils.EmojiFinder('redtick').toString();
    message.prefix = message.guild 
    ? (client.guildConfig.get(message.guild.id) 
      ? client.guildConfig.get(message.guild.id).prefix 
      : process.env.DISCORD_BOT_PREFIX) 
    : process.env.DISCORD_BOT_PREFIX;

    if (message.author.bot) return;
    if (
      message.content.startsWith(message.prefix) 
      || message.content.startsWith(`<@${client.user.id}>`) 
      || message.content.startsWith(`<@!${client.user.id}>`)
    ) {
      const [cmdName, ...cmdArgs] = message.content
        .slice(
          message.content.startsWith(message.prefix) 
          ? message.prefix.length 
          : message.content.startsWith(`<@${client.user.id}>`) 
            ? `<@${client.user.id}>`.length 
            : `<@!${client.user.id}>`.length
        )
        .trim()
        .split(/\s+/);
      const command = client.commands.get(cmdName.toLowerCase());
      if (command) {
        if (client.user.id === "750232563779633153" && !client.owners.includes(message.author.id)) return;
        
        if (command.options.ownerOnly && !client.owners.includes(message.author.id))
          return message.channel.send(message.translate("message.owneronly"))
          .catch(e => { return client.utils.logs(e, "Owner only message error") });

        if (message.channel.type === 'dm' && command.options.channelType === 'guild')
          return message.channel.send(message.translate('message.wrongChannel.dms', { redtick }))
          .catch(e => { return client.utils.logs(e, "DM error") });

        if (message.guild) {
          message.channel = message.channel as TextChannel;
          const permsForClient = message.channel.permissionsFor(client.user);
          const permsForUser = message.channel.permissionsFor(message.author);

          if (!permsForClient.has("SEND_MESSAGES", true))
            return message.author.send(message.translate("message.missingPerms.sendMessages", {
              redtick,
              channel: message.channel.toString(),
            }))
            .catch(e => { return client.utils.logs(e, "DM error") });
          
          if (!permsForClient.has("USE_EXTERNAL_EMOJIS", true))
            return message.channel.send(message.translate("message.missingPerms.externalEmojis", {
              channel: message.channel.toString(),
              permission: message.translate("permissions.USE_EXTERNAL_EMOJIS"),
            }))
            .catch(e => { return client.utils.logs(e, "DM error") });

          if (command.options.usage) {
            const required = command.options.usage(message)
            .trim()
            .split(/\|/g)
            .filter(str => str.includes("<") && str.includes(">"));
              
            if (required.length > cmdArgs.length) return message.channel.send(message.translate("message.missingArgs", {
                redtick,
                required: `\`${required.map(str => str).join(' ')}\``,
              }))
              .catch(e => { return client.utils.logs(e, "Missing Args error") })
          }
          
          if (command.options.clientPermissions && (permsForUser.missing(command.options.clientPermissions, true).length || !message.member.hasPermission(command.options.clientPermissions, { checkAdmin: true, checkOwner: true })))
          return message.channel.send(message.translate("message.missingPerms.client", {
            redtick,
            permissions: client.utils.missingPerms(message, command.options.clientPermissions),
          }))
          .catch(e => { return client.utils.logs(e, "Client Missing Perms error") });

          if (client.owners.includes(message.author.id)) return command.run(client, message, cmdArgs);
          
          if (command.options.userPermissions && (permsForUser.missing(command.options.userPermissions, true).length || !message.member.hasPermission(command.options.userPermissions, { checkAdmin: true, checkOwner: true })))
            return message.channel.send(message.translate("message.missingPerms.perms", {
              redtick,
              permissions: client.utils.missingPerms(message, command.options.userPermissions),
            }))
            .catch(e => { return client.utils.logs(e, "User Missing Perms error") });
        };

        const timeout = timeouts.get(`${message.author.id}-${command.name}`);
        if (timeout) {
          const l = (Date.now() - timeout);
          const left = command.options.timeout - l;
          return message.channel.send(message.translate('message.timeout', { remaining: ms(left, { long: true }) }))
          .catch(e => { return client.utils.logs(e, "timeout error") });
        } else {
          timeouts.set(`${message.author.id}-${command.name}`, Date.now());
          setTimeout(() => timeouts.delete(`${message.author.id}-${command.name}`), command.options.timeout);
        };

        command.run(client, message, cmdArgs);
      } else if (message.mentions.users.has(client.user.id) && message.content.endsWith(`${client.user.id}>`))
        return message.channel.send(message.translate("message.prefix", { prefix: message.prefix, mention: client.user.toString() }));
    }
  }
}