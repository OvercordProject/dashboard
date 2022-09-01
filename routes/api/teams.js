const express = require('express');
const filter = require('leo-profanity');
const frenchBadwordsList = require('french-badwords-list');

const queries = require('../../../db/modules/queries');

const router = express.Router();

filter.loadDictionary('fr');
filter.loadDictionary('en');
filter.add(frenchBadwordsList.array);

// POST teams page.
router.post('/', async (req, res) => {
  const profile = await queries.user.fetch(req.user.discordId);

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
    const team = await queries.team.fetch(teamName);

    if (team) {
      return res.status(400).json({
        message: 'Team already exists.',
      });
    }
  }

  if (profile.team) {
    const userTeam = await queries.team.fetch(profile.team);
    if (req.user.discordId === userTeam.leaderId) {
      if (teamName) {
        await userTeam.edit('name', teamName);
      }
      if (teamImage && teamImage !== '/assets/images/discord.png') {
        await userTeam.edit('img', teamImage);
      }
    }
    // todo: change after db queries are done
    const newTeam = teamName ? await queries.team.fetch(teamName) : userTeam;
    return res.status(200).json(newTeam);
  }

  const newTeam = await queries.team.create(req.user.discordId, {
    name: teamName,
    image: teamImage,
  });
  await profile.edit('team', newTeam.id);

  if (!teamName) {
    return res.status(400).json({ message: 'Name is required' });
  }

  return res.status(201).json(newTeam);
});

router.delete('/', async (req, res) => {
  const profile = await queries.user.fetch(req.user.discordId);

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

  const team = await queries.team.fetch(profile.team);

  if (team.leaderId !== req.user.discordId) {
    return res.status(403).json({
      message: 'Forbidden',
    });
  }

  await team.delete();
  await profile.edit('team', null);

  return res.status(200).json({
    message: 'Team successfully deleted',
  });
});

module.exports = router;
