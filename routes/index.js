const express = require('express');
const adapter = require('../discord/adapter');

const router = express.Router();

// GET home page.
router.get('/', async (req, res) => {
  if (req.query.codeOfConduct === 'true') {
    res.cookie('codeOfConduct', req.query.codeOfConduct, {
      maxAge: 3.154e10, // 1 year
    });
  }

  if (req.query.privacyPolicy === 'true') {
    res.cookie('privacyPolicy', req.query.privacyPolicy, {
      maxAge: 3.154e10, // 1 year
    });
  }

  let fetchUser = null;
  if (req.user) {
    fetchUser = await adapter.resolveUser(req.user.discordId);
  }

  res.render('index', {
    pageTitle: 'Home',
    fetchUser,
  });
});

module.exports = router;
