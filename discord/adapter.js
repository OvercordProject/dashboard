/* eslint-disable no-shadow */
/* eslint-disable max-len */
/* eslint-disable consistent-return */
/* eslint-disable class-methods-use-this */
/* eslint-disable array-callback-return */
/* eslint-disable default-case */
/* eslint-disable prefer-rest-params */
/* eslint-disable no-return-await */
const EventEmitter = require('events');
const debug = require('debug')('overcord:adapter');
const { Client, Intents } = require('discord.js');
const config = require('./config');

const { User } = require('../../db/models');

class Adapter extends EventEmitter {
  constructor() {
    super();
    this.log = this.log.bind(this);
    this.logInfo = this.logInfo.bind(this);
    this.logWarning = this.logWarning.bind(this);
    this.logError = this.logError.bind(this);
    this.logDebug = this.logDebug.bind(this);
    this.getGuild = this.getGuild.bind(this);
    this.banUser = this.banUser.bind(this);
    this.unban = this.unban.bind(this);
    this.isUserBanned = this.isUserBanned.bind(this);
    this.onGuildMemberAdd = this.onGuildMemberAdd.bind(this);
    this.onGuildMemberRemove = this.onGuildMemberRemove.bind(this);
    this.onGuildBanAdd = this.onGuildBanAdd.bind(this);
    this.onGuildBanRemove = this.onGuildBanRemove.bind(this);
    this.onReady = this.onReady.bind(this);
    this.destroy = this.destroy.bind(this);
    this.resolveChannel = this.resolveChannel.bind(this);
    this.resolveGuildMember = this.resolveGuildMember.bind(this);
    this.resolveRole = this.resolveRole.bind(this);
    this.resolveUser = this.resolveUser.bind(this);

    this.client = new Client({
      intents: [Intents.FLAGS.GUILDS],
      partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    });

    this.client.once('ready', this.onReady);
    this.client.on('guildMemberAdd', this.onGuildMemberAdd);
    this.client.on('guildMemberRemove', this.onGuildMemberRemove);
    this.client.on('guildBanAdd', this.onGuildBanAdd);
    this.client.on('guildBanRemove', this.onGuildBanRemove);
    this.client.on('warn', this.logWarning);
    this.client.on('error', this.logError);

    this.client.login(config.token);
  }

  onReady() {
    this.logInfo(`
    Platform    : ${process.platform}
    Node version: ${process.version}`);

    this.logInfo('Ready!');
    this.emit('ready');
  }

  async destroy() {
    await this.client.destroy();
  }

  async log(logLevel) {
    const args = [...arguments].slice(1);
    const message = args
      .map((arg) => {
        switch (typeof arg) {
          case 'string':
            return arg;
          case 'object':
            return [...arg];
        }
      })
      .join(' ');
    debug('[%s]: %s', logLevel, message);
  }

  async logInfo() {
    return await this.log('info', arguments);
  }

  async logWarning() {
    return await this.log('warning', arguments);
  }

  async logError() {
    return await this.log('error', arguments);
  }

  async logDebug() {
    return await this.log('debug', arguments);
  }

  async onGuildMemberAdd(guildMember) {
    this.logInfo(`${guildMember} has been added to the server.`);
  }

  async onGuildMemberRemove(guildMember) {
    this.logInfo(`${guildMember} was removed from the server.`);

    const user = await User.findOne({
      where: {
        discordId: guildMember.id,
      },
    });

    if (user) {
      // Remove the Discord related data from the user's record.
      await user.update({
        discordId: null,
        discordUsername: null,
        discordDiscriminator: null,
        discordAvatar: null,
        isOnServer: false,
      });
    }
  }

  async onGuildBanAdd(guild, user) {
    await this.logInfo(`${user} was banned.`);
  }

  async onGuildBanRemove(guild, user) {
    await this.logInfo(`${user} ban removed.`);
  }

  getGuild() {
    const guild = this.client.guilds.resolve(config.guildId);
    if (!guild) {
      throw new Error(`Guild with id ${config.guildId} was not found.`);
    }
    return guild;
  }

  async resolveChannel(channelResolvable) {
    let channel = null;
    const guild = this.getGuild();

    channel = guild.channels.resolve(channelResolvable)
      || guild.channels.cache.find((guildChannel) => guildChannel.name === channelResolvable);

    if (!channel) {
      channel = this.client.channels.resolve(channelResolvable.id) || channelResolvable.channel;
    }

    return channel;
  }

  async resolveUser(userResolvable) {
    let user = null;
    switch (typeof userResolvable) {
      case 'string':
        user = await this.client.users.fetch(userResolvable).catch(() => { });
        break;
      case 'object':
        user = userResolvable.user || userResolvable.owner || userResolvable.author || userResolvable;
        break;
    }

    return user;
  }

  resolveGuildMember(guildMemberResolvable) {
    const guild = this.getGuild();
    let guildMember = null;
    switch (typeof guildMemberResolvable) {
      case 'string':
        guildMember = guild.members.resolve(guildMemberResolvable);
        break;
      case 'object':
        guildMember = guild.members.resolve(guildMemberResolvable.id);
        break;
    }

    return guildMember;
  }

  resolveRole(roleResolvable) {
    const guild = this.getGuild();
    if (!guild || !guild.available) {
      throw new Error('Guild is currently not available.');
    }

    let role = null;
    switch (typeof roleResolvable) {
      case 'string':
        role = guild.roles.resolve(roleResolvable) || guild.roles.cache.find((role) => role.name === roleResolvable);
        break;
      case 'object':
        role = guild.roles.resolve(roleResolvable.id);
        break;
    }

    return role;
  }

  async banUser(userResolvable, reason) {
    const guild = this.getGuild();
    if (guild && guild.available) {
      await guild.ban(userResolvable, {
        reason,
      });
    }
  }

  async unban(userResolvable) {
    const guild = this.getGuild();
    if (guild && guild.available) {
      try {
        await guild.unban(userResolvable);
      } catch (err) {
        this.logError(`An error occured while unbanning user ${userResolvable}: ${err}`);
      }
    } else {
      this.logError(`Failed to unban user ${userResolvable}. Reason: Guild not available.`);
    }
  }

  async isUserBanned(userResolvable) {
    const guild = this.getGuild();
    const user = await this.resolveUser(userResolvable);

    let ban = null;
    try {
      const bans = await guild.bans.fetch();
      ban = bans.get(user.id);
    } catch (err) {
      this.logError(`Error fetching ban info: ${err}`);
    }

    return ban && ban.reason;
  }
}

module.exports = new Adapter();
