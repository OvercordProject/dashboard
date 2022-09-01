const cookieParser = require('cookie-parser');
const express = require('express');
const debug = require('debug')('overcord:app');
// const flash = require("connect-flash");
const helmet = require('helmet');
const logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const favicon = require('serve-favicon');
const path = require('path');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const settings = require('./settings');
const models = require('../db/models');

// Basic routes
const indexRouter = require('./routes/index');
const logoutRouter = require('./routes/auth/logout');
const discordRouter = require('./routes/auth/discord');
const battleNetRouter = require('./routes/auth/battleNet');
const userRouter = require('./routes/user');
const teamsRouter = require('./routes/teams');
const leaderRouter = require('./routes/leaderboard');
const createTeamRoute = require('./routes/createTeam');

// Api routes
const apiTeamsRouter = require('./routes/api/teams');

// Check if user is logged
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  if (req.baseUrl.startsWith('/api')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return res.redirect('/');
}

// Check if user has accepted COC
function isCodeOfConduct(req, res, next) {
  if (req.cookies.codeOfConduct === 'true') {
    return next();
  }
  if (req.baseUrl.startsWith('/api')) {
    return res.status(403).json({
      message: 'You must accept the code of conduct',
    });
  }
  return res.redirect('/');
}

// Check if user has accepted PP
function isPrivacyPolicy(req, res, next) {
  if (req.cookies.privacyPolicy === 'true') {
    return next();
  }
  if (req.baseUrl.startsWith('/api')) {
    return res.status(403).json({
      message: 'You must accept the privacy policy',
    });
  }
  return res.redirect('/');
}

passport.serializeUser((user, done) => {
  done(null, user.discordId);
});

passport.deserializeUser((discordId, done) => {
  models.User.findOne({
    where: {
      discordId,
    },
  })
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err);
    });
});

// Initialize express app
const app = express();

app.locals = {
  ...settings,
};

// Load views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
if (process.env.NODE_ENV === 'developement') app.disable('view cache');
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", 'https://cdn.discordapp.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://css.gg'],
      imgSrc: ["'self'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'http://code.jquery.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }),
);

app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET,
    store: new SequelizeStore({
      db: models.sequelize,
    }),
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 8.64e7,
      httpOnly: true,
      secure: 'auto',
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'assets', 'favicon.ico')));

app.use((req, res, next) => {
  res.locals.codeOfConduct = req.query.codeOfConduct === 'true' || req.cookies.codeOfConduct === 'true';
  res.locals.privacyPolicy = req.query.privacyPolicy === 'true' || req.cookies.privacyPolicy === 'true';
  res.locals.path = req.path;
  res.locals.user = req.user;
  next();
});

// Pages
app.use('/', indexRouter);
app.use('/logout', isAuthenticated, logoutRouter);
app.use('/auth/discord', isPrivacyPolicy, isCodeOfConduct, discordRouter);
app.use('/auth/battlenet', isPrivacyPolicy, isCodeOfConduct, isAuthenticated, battleNetRouter);
app.use('/users', isPrivacyPolicy, isCodeOfConduct, isAuthenticated, userRouter);
app.use('/teams', isPrivacyPolicy, isCodeOfConduct, isAuthenticated, teamsRouter);
app.use('/leaderboard', isPrivacyPolicy, isCodeOfConduct, isAuthenticated, leaderRouter);
app.use('/team/create', isPrivacyPolicy, isCodeOfConduct, isAuthenticated, createTeamRoute);

// Api router
app.use('/api/teams', isPrivacyPolicy, isCodeOfConduct, isAuthenticated, apiTeamsRouter);

app.use('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

app.get('/codeOfConduct', async (req, res) => {
  res.render('code-of-conduct', {
    pageTitle: 'Code Of Conduct',
  });
});

app.get('/privacyPolicy', async (req, res) => {
  res.render('privacy-policy', {
    pageTitle: 'Privacy Policy',
  });
});

app.get('*', async (req, res) => {
  res
    .status(404)
    .render('404', {
      pageTitle: '404',
    });
});

app.use((err, req, res) => {
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  debug(err);
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
