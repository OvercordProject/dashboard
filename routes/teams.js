const express = require('express');

const queries = require('../../db/modules/queries');
const adapter = require('../discord/adapter');

const router = express.Router();

// GET team page.
router.get('/:name', async (req, res) => {
  const fetchTeam = await queries.team.fetch(req.params.name);

  if (!fetchTeam) {
    return res.redirect('/404');
  }

  fetchTeam.rank = await queries.team.leaderboard({ search: fetchTeam.name });

  fetchTeam.leader = await adapter.resolveUser(fetchTeam.leaderId);

  console.log(fetchTeam);

  return res.render('team', {
    pageTitle: fetchTeam.name,
    fetchTeam,
  });
});

module.exports = router;
