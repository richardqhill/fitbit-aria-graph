import NextAuth from "next-auth";
import { authOptions } from "@/auth";

const authHandler = NextAuth(authOptions);
export { authHandler as GET, authHandler as POST };