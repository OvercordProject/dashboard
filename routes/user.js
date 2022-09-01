const express = require('express');

const queries = require('../../db/modules/queries');
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

  const userData = await queries.user.fetch(req.params.id);
  if (userData) {
    const userTeam = userData.team ? await queries.team.fetch(userData.team) : null;
    fetchUser.team = userTeam ? userTeam.name : null;
    fetchUser.rank = await queries.user.leaderboard({ search: fetchUser.id });
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
