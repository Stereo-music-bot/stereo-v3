import { GuildMember, NewsChannel, TextChannel, GuildEmoji, PermissionString, Message } from 'discord.js';
import DiscordClient from '../../../client/client';
export default class Util {
  private client: DiscordClient

  constructor(client: DiscordClient) {
    this.client = client;
  };

  /**
   * Format the track or playlist duration
   * @param {Number} ms - The duration in milliseconds
   * @return {String} time - The formatted timestamp
   */
  public formatTime(ms: number): string {
    const hours = Math.floor((ms / (1e3 * 60 * 60)) % 60),
      minutes = Math.floor(ms / 6e4),
      seconds = ((ms % 6e4) / 1e3).toFixed(0);

    //@ts-ignore
    return `${
      hours ? `${hours.toString().padStart(2, "0")}:` : ""
    }${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  /**
 * 
 * @param client the client that is passed in when the command got triggered
 * @param emojiName the name of the emoji
 */
  public EmojiFinder(name: string): GuildEmoji {
    return this.client.guilds.cache.get('746536046275198997')
    .emojis.cache.find(e => e.name.toLowerCase() === name.toLowerCase())
    || undefined;
  };

  public missingPerms(message: Message, perms: Array<PermissionString>): Array<string> | string {
    const missingPerms = message.member.permissions.missing(perms).length 
    ? message.member.permissions.missing(perms).map(str => `\`${str.replace(/_/g, ' ').replace(/GUILD/g, 'SERVER').toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}\``)
    : (message.channel as TextChannel).permissionsFor(message.member).missing(perms).map(str => `\`${message.translate(`permissions.${str}`).replace(/_/g, ' ').replace(/GUILD/g, 'SERVER').toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}\``);
  
    return missingPerms.length > 1 ?
      `${missingPerms.slice(0, -1).join(', ')} and ${missingPerms.slice(-1)[0]}` :
        missingPerms[0];
  };

  public formatPerms(perms: string[]): Array<string> | string {
      const formattedPerms = perms.map(str => `\`${str.replace(/_/g, ' ').replace(/GUILD/g, 'SERVER').toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}\``);
    
    return formattedPerms.length > 1 ?
      `${formattedPerms.slice(0, -1).join(', ')} and ${formattedPerms.slice(-1)[0]}` :
      formattedPerms[0];
  };

  public filterMember(message: Message, id: string): GuildMember {
    return message.mentions.members.size
    ? message.mentions.members.last()
    : id.length
      ? message.guild.members.cache.get(id)
        || message.guild.members.cache.find(m => m.user.username.startsWith(id))
        || message.guild.members.cache.find(m => m.user.tag.startsWith(id))
    : undefined;
  };

  public trimArray(arr: Array<string>, maxLen = 10) {
    if (arr.length > maxLen) {
      const len = arr.length - maxLen;
      arr = arr.slice(0, maxLen);
      arr.push(`${len} more...`);
    }
    return arr;
  };

  public formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  }

  public logs(error: any, type: string): void {
    this.client.webhook.send(`> ❗ | New error | ${type} | Error: \`\`\`${error}\`\`\``);
  }

  private check (suffix: string): string {
    let thing: string;
    switch (suffix) {
      case ' ':
        thing = '   '
        break
      case '!':
        thing = ' :exclamation:'
        break
      case '?':
        thing = ' :question:'
        break
      case '0':
        thing = ' :zero:'
        break
      case '1':
        thing = ' :one:'
        break
      case '2':
        thing = ' :two:'
        break
      case '3':
        thing = ' :three:'
        break
      case '4':
        thing = ' :four:'
        break
      case '5':
        thing = ' :five:'
        break
      case '6':
        thing = ' :six:'
        break
      case '7':
        thing = ' :seven:'
        break
      case '8':
        thing = ' :eight:'
        break
      case '9':
        thing = ' :nine:'
        break
      case '+':
        thing = ' :heavy_plus_sign:'
        break
      case '-':
        thing = ' :heavy_minus_sign:'
        break
      case '×':
        thing = ' :heavy_multiplication_x:'
        break
      case '*':
        thing = ' :asterisk:'
        break
      case '$':
        thing = ' :heavy_dollar_sign:'
        break
      case '/':
        thing = ' :heavy_division_sign:'
        break
      default:
        thing = suffix
        break
    }
    return thing;
  };
};