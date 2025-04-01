import { NextAuthOptions, getServerSession, ExtendedToken, FitbitAccount } from "next-auth";

async function refreshAccessToken(token: ExtendedToken) {
  try {
    const response = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
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
          const fitbitAccount = account as FitbitAccount;

          return {
            accessToken: fitbitAccount.access_token,
            accessTokenExpires: Date.now() + fitbitAccount.expires_in * 1000,
            refreshToken: fitbitAccount.refresh_token,
          };
        }
  
        if (Date.now() > (token.accessTokenExpires as number)) {
          return await refreshAccessToken(token as unknown as ExtendedToken);
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


export async function getAuthSession() {
  return await getServerSession(authOptions);
}