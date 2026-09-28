import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    if (user.isBanned) {
                        return done(null, false, {
                            message: "Account suspended.",
                        });
                    }

                    return done(null, user);
                }

                // Check if email already registered
                user = await User.findOne({
                    email: profile.emails[0].value,
                });

                if (user) {
                    // Link Google to existing account
                    user.googleId = profile.id;
                    user.isVerified = true;

                    if (!user.avatar) {
                        user.avatar = profile.photos[0]?.value;
                    }

                    await user.save({ validateBeforeSave: false });

                    return done(null, user);
                }

                // Create new user
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    avatar: profile.photos[0]?.value || null,
                    isVerified: true,
                });

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;