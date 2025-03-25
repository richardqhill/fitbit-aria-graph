import NextAuth, { getServerSession } from "next-auth";
import { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "fitbit",
      name: "Fitbit",
      type: "oauth",
      version: "2.0",
      clientId: process.env.FITBIT_CLIENT_ID!,
      clientSecret: process.env.FITBIT_CLIENT_SECRET!,
      authorization: {
        url: "https://www.fitbit.com/oauth2/authorize",
        params: { scope: "weight profile" },
      },
      token: "https://api.fitbit.com/oauth2/token",
      userinfo: "https://api.fitbit.com/1/user/-/profile.json",
      profile(profile) {
        return {
          id: profile.user.encodedId,
          name: profile.user.fullName,
          email: profile.user.email || "",
          image: profile.user.avatar,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = (token as { accessToken?: string }).accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};


export const authHandler = NextAuth(authOptions);
export { authHandler as GET, authHandler as POST };

export async function getAuthSession() {
  return await getServerSession(authOptions);
}