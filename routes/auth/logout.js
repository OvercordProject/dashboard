const debug = require('debug')('overcord:logout');
const express = require('express');

const router = express.Router();

// GET logout page.
router.get('/', (req, res, next) => {
  const username = req.user && req.user.username;
  if (req.session) {
    req.logout();
    req.session.destroy((err) => {
      if (err) {
        debug(`An error occured while destroying the session: ${err}`);

        next(err);
      } else {
        if (username && process.env.NODE_ENV !== 'production') {
          debug(`User ${username} logged out.`);
        }
        // Clear the cookie that stores the session id.
        res.clearCookie('sid');
        res.redirect('/');
      }
    });
  } else {
    debug('Session is not defined.');

    const err = new Error('Session is not defined.');
    err.status = 403;
    next(err);
  }
});

module.exports = router;
