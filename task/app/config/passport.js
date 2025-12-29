// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../models');
const User = db.users;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Extract user info from Google profile
      const email = profile.emails[0].value;
      const googleId = profile.id;
      
      // Check if user exists by google_id or email
      let user = await User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { google_id: googleId },
            { email: email }
          ]
        }
      });

      if (!user) {
        // Create new user
        user = await User.create({
          google_id: googleId,
          email: email,
          full_name: profile.displayName,
          first_name: profile.name?.givenName || '',
          last_name: profile.name?.familyName || '',
          avatar: profile.photos?.[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}`,
          provider: 'google',
          is_verified: profile.emails?.[0]?.verified || true
        });
      } else if (!user.google_id) {
        // Update existing user with google info
        await user.update({
          google_id: googleId,
          provider: 'google',
          is_verified: true
        });
      }

      return done(null, user);
    } catch (error) {
      console.error('Google Strategy Error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;