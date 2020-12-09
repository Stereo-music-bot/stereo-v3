export interface RPInterface {
  roleId: string,
  permissions: {
    ADD_SONGS?: boolean,
    MANAGE_QUEUE?: boolean,
    MANAGE_PLAYER?: boolean
  }
};

export interface GCInterface {
  guildId: string
  prefix: string,
  announce: boolean,
  partner: boolean,
  ignoredChannels: Array<string>,
  language: string,
};