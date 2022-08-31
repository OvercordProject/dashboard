const express = require('express');

const userInfos = require('../../db/modules/queries/userinfos');
const adapter = require('../discord/adapter');

const router = express.Router();

// GET user page.
router.get('/:id', async (req, res) => {
  const fetchUser = await adapter.resolveUser(req.params.id);
  if (!fetchUser) {
    return res.redirect('/404');
  }

  fetchUser.image = fetchUser.displayAvatarURL({
    dynamic: true,
    size: 64,
  });

  const userData = await userInfos.fetch(req.params.id);
  if (userData) {
    fetchUser.team = userData.team;
    fetchUser.rank = await userInfos.leaderboard({ search: fetchUser.id });
    fetchUser.messages = userData.messages;
    fetchUser.vocal = userData.vocal;
    fetchUser.level = userData.level;
    fetchUser.xp = userData.xp;
  }

  console.log(fetchUser);

  return res.render('user', {
    pageTitle: fetchUser.username,
    fetchUser,
  });
});

module.exports = router;
