import { Account, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: {
      name?: string;
      email?: string;
      image?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    accessToken?: string;
  }

  interface ExtendedToken extends JWT{
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
    error?: string;
  }
  
  interface FitbitAccount extends Account {
    access_token: string;
    expires_in: number;
    refresh_token: string;
  }
}