import { Schema, model } from 'mongoose';

export const guildConfig = model('guildconfig', new Schema({
  guildId: {
    type: String,
    required: false,
    unique: false
  },
  prefix: {
    type: String,
    required: false,
    default: process.env.DISCORD_BOT_PREFIX,
  },
  announce: {
    type: Boolean,
    required: true,
    default: true
  },
  partner: {
    type: Boolean,
    required: true,
    default: false
  },
  ignoredChannels: {
    type: Array,
    required: false
  },
  language: {
    type: String,
    required: false,
    default: "en-US"
  }
}));