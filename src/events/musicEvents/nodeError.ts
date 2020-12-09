import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';

export default class socketErrorEvent extends BaseEvent {
  constructor() {
    super('socketError');
  }
  async run (client: DiscordClient, { id }, error) {
    console.log(`${id} ran into an error, ${error}`);
  }
}