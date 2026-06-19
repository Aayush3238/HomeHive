const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) {
          return done(new Error('No email found from Google account'), null);
        }

        let user = await User.findByGoogleId(profile.id);

        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email });

        if (user) {
          return done(null, user);
        }

        const newUser = new User({
          firstname: profile.name.givenName || '',
          lastname: profile.name.familyName || '',
          email,
          password: null,
          role: null,
          googleId: profile.id,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        });

        user = await newUser.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
