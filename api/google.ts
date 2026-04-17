import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
      };
      if (!user.email) return done(new Error("Google account has no email"), undefined);
      const dbUser = await prisma.users.upsert({
        where: {
            google_id: user.id
        },
        update: {},
        create: {
            email: user.email,
            username: user.name,
            google_id: user.id
        }
      })
      done(null, dbUser);
    }
  )
);

export default passport;