/* eslint-disable no-shadow */
const debug = require('debug')('overcord:discord');
const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

const adapter = require('../../discord/adapter');
const models = require('../../../db/models');

const router = express.Router();

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.BASE_URL + process.env.DISCORD_REDIRECT_URI,
      prompt: 'none',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      if (process.env.NODE_ENV !== 'production') {
        debug('Discord user succeffully logged in.');
        debug(profile);
      }

      try {
        const user = await adapter.resolveUser(profile.id);
        let isOnServer;
        if (user) isOnServer = true;
        else isOnServer = false;
        const banReason = await adapter.isUserBanned(profile.id);
        if (!banReason) {
          models.User.findOrCreate({
            where: {
              discordId: profile.id,
            },
          }).then(([user, created]) => {
            if (process.env.NODE_ENV !== 'production') {
              if (created) {
                debug(`New user added to database: ${profile.username}`);
              } else {
                debug(`User already registered to database: ${profile.username}`);
              }
            }

            user
              .update({
                discordId: profile.id,
                isOnServer,
              })
              .then(() => {
                done(null, user);
              });
          })
            .catch((err) => {
              debug(`An error occured when adding user: ${err}`);
              done(err);
            });
        } else {
          debug(`User ${profile.username} is banned: ${banReason}`);
          done('user banned');
        }
      } catch (err) {
        debug(`An error occured while adding ${profile.username}: ${err}.`);
        done(err);
      }
    },
  ),
);

// GET Discord Login page.
router.get('/', passport.authenticate('discord', {
  scope: ['identify'],
}));

// Discord login redirect URI
router.get(
  '/callback',
  passport.authenticate('discord', {
    failureRedirect: '/',
  }),
  (_req, res) => {
    if (process.env.NODE_ENV !== 'production') {
      debug('Discord user successfully logged in.');
    }
    res.redirect('/');
  },
);

module.exports = router;
