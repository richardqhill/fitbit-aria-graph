import { DefaultSession } from "next-auth";

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
}