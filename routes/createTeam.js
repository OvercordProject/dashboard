const express = require('express');

const router = express.Router();

// GET create team page.
router.get('/', async (req, res) => {
  res.render('createTeam', {
    pageTitle: 'Create a team',
  });
});

module.exports = router;
