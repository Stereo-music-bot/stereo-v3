import { Message, PermissionString } from 'discord.js';
import DiscordClient from '../../client/client';

interface rolePermissions {
  ADD_SONGS: boolean,
  MANAGE_QUEUE: boolean,
  MANAGE_PLAYER: boolean,
};

interface Options {
  category: string,
  aliases: string[],
  ownerOnly: boolean,
  channelType: "dm" | "guild" | "both",
  timeout?: number,
  description?: (m: Message) => string,
  usage?: (m: Message) => string,
  clientPermissions?: PermissionString[],
  userPermissions?: PermissionString[],
  rolePermissions?: rolePermissions,
};

export default abstract class BaseCommand {
  constructor(private Name: string, private Options: Options) {}

  get name(): string { return this.Name; }
  get options(): Options { return this.Options; }

  abstract run(client: DiscordClient, message: Message, args: Array<string> | null): Promise<Message | any>;
}