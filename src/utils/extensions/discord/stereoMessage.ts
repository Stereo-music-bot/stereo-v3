import { Structures } from 'discord.js';
import discordClient from '../../../client/client';

export default Structures.extend(
  "Message",
  (Message) =>
    class StereoMessage extends Message {
      public get language() {
        if (!this.guild) return 'en-US';

        const config = (this.client as discordClient).guildConfig.get(this.guild.id);
        return config ? config.language : 'en-US';
      }

      public translate(path: string, variables?: Record<string, any>): string {
        const data = (this.client as discordClient).languages.get(
          this.language,
          path,
          variables
        );

        return (
          (data as string) ? (data as string)
            .replace(/\\n/g, '\n')
            .replace(/\\u3000/g, '\u3000')
            .replace(/\\u200b/g, '\u200b') 
          : `\`${path}\` has not been initialized for ${this.language}`
        );
      }
    }
);