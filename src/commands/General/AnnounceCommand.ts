import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import { guildConfig } from "../../utils/DataBase/guildconfigSchema";

export default class AnnounceCommand extends BaseCommand {
  constructor() {
    super('announce', {
      category: 'General',
      aliases: ['setannounce'],
      description: (m: Message) => m.translate("commands.general.announce.description"),
      userPermissions: ['MANAGE_GUILD'],
      ownerOnly: false,
      timeout: 15e3,
      channelType: "guild",
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const player = client.music.players.get(message.guild.id);

    try {
      if (player && player.queue) player.queue.Announce();
      const config = client.guildConfig.get(message.guild.id);
      const newConfig = {...config, announce: !config.announce};

      client.guildConfig.set(message.guild.id, newConfig);
      guildConfig.findOneAndUpdate({ guildId: message.guild.id }, newConfig, (e) => { if (e) throw new Error(e) });

      return message.channel.send(message.translate("commands.general.announce.success", { status: newConfig.announce ? '🔔' : '🔕' }));
    } catch (e) {
      message.channel.send(message.translate("commands.general.announce.error", { warning: client.utils.EmojiFinder("warning").toString() }));
      return client.utils.logs(e, "announce save error");
    }
  }
}