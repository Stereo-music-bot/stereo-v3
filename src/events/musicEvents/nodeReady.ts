import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';

export default class socketReadyEvent extends BaseEvent {
  constructor() {
    super('socketReady');
  }
  async run (client: DiscordClient, node) {
    console.log(`${node.id} is connected!`);
  }
}