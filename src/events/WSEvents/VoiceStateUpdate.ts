import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';

export default class VOICE_STATE_UPDATEEvent extends BaseEvent {
  constructor() {
    super('VOICE_STATE_UPDATE');
  }
  async run (client: DiscordClient, pk) {
    client.music.stateUpdate(pk)
  }
}