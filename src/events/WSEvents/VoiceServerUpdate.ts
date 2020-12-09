import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';

export default class VOICE_SERVER_UPDATEEvent extends BaseEvent {
  constructor() {
    super('VOICE_SERVER_UPDATE');
  }
  async run (client: DiscordClient, pk) {
    client.music.serverUpdate(pk);
  }
}