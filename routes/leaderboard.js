/* eslint-disable no-await-in-loop */
const express = require('express');
const adapter = require('../discord/adapter');
const queries = require('../../db/modules/queries');

const router = express.Router();

// GET leaderboard page.
router.get('/', async (req, res) => {
  const leader = await queries.user.leaderboard();

  console.log(leader);

  // todo: pass all process on client side
  for (let i = 0; i < leader.length; i += 1) {
    const user = await adapter.resolveUser(leader[i].userid);
    leader[i].username = user.username;
    leader[i].discriminator = user.discriminator;
    leader[i].avatar = user.displayAvatarURL({
      dynamic: true,
      size: 64,
    });
  }

  console.log(leader);

  res.render('leaderboard', {
    pageTitle: 'Leaderboard',
    leader,
  });
});

module.exports = router;
