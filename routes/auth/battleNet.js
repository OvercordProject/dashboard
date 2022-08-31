/* eslint-disable no-shadow */
const debug = require('debug')('discord-user-manager:bnet');
const express = require('express');
const passport = require('passport');
const BattleNetStrategy = require('passport-bnet').Strategy;

const router = express.Router();

// BattleNet strategy for autenticating users with a BattleNet account
passport.use(
  new BattleNetStrategy(
    {
      clientID: process.env.BATTLENET_CLIENT_ID,
      clientSecret: process.env.BATTLENET_CLIENT_SECRET,
      callbackURL: process.env.BASE_URL + process.env.BATTLENET_REDIRECT_URI,
      region: 'eu',
    },
    (_accessToken, _refreshToken, profile, done) => {
      done(null, profile);
    },
  ),
);

// GET BattleNet Login page.
router.get('/', passport.authenticate('bnet'));

// BattleNet login redirect URI
router.get('/callback', (req, res, next) => {
  passport.authenticate('bnet', async (err, profile) => {
    if (!req.user) {
      // The user must be authenticated
      debug('User not logged in.');
      return res.redirect('/auth/discord');
    }

    if (err || !profile) {
      debug(`An error occured logging ${req.user.username} into BattleNet: ${err}`);
      return res.redirect('/');
    }

    const { user } = req;

    try {
      await user.update({
        battleNetId: profile.id,
        battleNetUsername: profile.battletag,
      });
      // // Get overwatch profile picture
      // let BtnUser = user.name
      // let tag = BtnUser.replace(/#/g, "-");

      // overwatch.getProfile("pc", "eu", tag, async(err, json) => {
      //   if (!err){
      //     if(json.private === true) blizzardImg = null
      //     blizzardImg = json.portrait

      //     await user.update({
      //       img: blizzardImg
      //     });
      //   }
      // })
      if (process.env.NODE_ENV !== 'production') {
        debug('BattleNet user successfully logged in.');
      }
    } catch (err) {
      debug(`An error occurred while updating ${user.username}: ${err}`);
    }
    return res.redirect('/');
  })(req, res, next);
});

// Logout user
router.get('/logout', async (req, res) => {
  if (!req.user) {
    debug('User not logged in.');
    return res.redirect('/');
  }

  const { user } = req;

  await user.update({
    battleNetId: null,
    battleNetUsername: null,
  });

  return res.redirect('/');
});

module.exports = router;
