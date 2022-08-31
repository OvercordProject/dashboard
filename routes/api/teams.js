const express = require('express');
const filter = require('leo-profanity');
const frenchBadwordsList = require('french-badwords-list');

const userInfos = require('../../../db/modules/queries/userinfos');
const teams = require('../../../db/modules/queries/teams');

const router = express.Router();

filter.loadDictionary('fr');
filter.loadDictionary('en');
filter.add(frenchBadwordsList.array);

// POST teams page.
router.post('/', async (req, res) => {
  const profile = await userInfos.fetch(req.user.discordId);

  // eslint-disable-next-line prefer-const
  let teamName = req.body.name;
  let teamImage = req.body.image;

  if (!teamName && !teamImage) {
    return res.status(400).json({
      message: 'Invalid payload',
    });
  }

  if (!teamImage) {
    teamImage = '/assets/images/discord.png';
  }

  if (teamName) {
    if (filter.check(teamName)) {
      return res.status(400).json({
        message: 'Invalid team name',
      });
    }
    const team = await teams.fetch(teamName);

    if (team) {
      return res.status(400).json({
        message: 'Team already exists.',
      });
    }
  }

  if (profile.team) {
    const userTeam = await teams.fetch(profile.team);
    if (req.user.discordId === userTeam.leaderId) {
      if (teamName) {
        await teams.updateData(profile.team, 'name', teamName);
        await userInfos.updateData(req.user.discordId, 'team', teamName); // todo: rewrite all teams queries to work with id
      }
      if (teamImage && teamImage !== '/assets/images/discord.png') {
        await teams.updateData(profile.team, 'img', teamImage);
      }
    }
    // todo: change after db queries are done
    const newTeam = teamName ? await teams.fetch(teamName) : userTeam;
    return res.status(200).json(newTeam);
  }

  const newTeam = await teams.create(teamName, teamImage, req.user.discordId);
  await userInfos.updateData(req.user.discordId, 'team', newTeam.name);

  if (!teamName) {
    return res.status(400).json({ message: 'Name is required' });
  }

  return res.status(201).json(newTeam);
});

router.delete('/', async (req, res) => {
  const profile = await userInfos.fetch(req.user.discordId);

  if (!profile) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  if (!profile.team) {
    return res.status(400).json({
      message: 'You are not in a team',
    });
  }

  const team = await teams.fetch(profile.team);

  if (team.leaderId !== req.user.discordId) {
    return res.status(403).json({
      message: 'Forbidden',
    });
  }

  await teams.delete(profile.team);
  await userInfos.updateData(req.user.discordId, 'team', null);

  return res.status(200).json({
    message: 'Team successfully deleted',
  });
});

module.exports = router;
