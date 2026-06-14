import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "./supabase";

function getEnvUsers(): Array<{ username: string; password: string; name: string }> {
  if (process.env.USERS) {
    try { return JSON.parse(process.env.USERS); } catch { /* invalid */ }
  }
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  const name = process.env.ADMIN_NAME ?? "Admin";
  if (user && pass) return [{ username: user, password: pass, name }];
  return [];
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null;
        const uname = credentials.username.toLowerCase().trim();

        // 1. Check Supabase users table first (registered users)
        const db = getSupabaseAdmin();
        if (db) {
          const { data } = await db
            .from("mjw_users")
            .select("username, password_hash, display_name")
            .eq("username", uname)
            .single();
          if (data) {
            const valid = await bcrypt.compare(credentials.password, data.password_hash);
            if (!valid) return null;
            return { id: data.username, name: data.display_name, email: `${data.username}@mjw.local` };
          }
        }

        // 2. Fall back to USERS env var (existing/admin accounts)
        const envUsers = getEnvUsers();
        const found = envUsers.find((u) => u.username.toLowerCase() === uname);
        if (!found) return null;
        const valid = found.password.startsWith("$2")
          ? await bcrypt.compare(credentials.password, found.password)
          : credentials.password === found.password;
        if (!valid) return null;
        return { id: found.username, name: found.name, email: `${found.username}@mjw.local` };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.username = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.username) {
        (session.user as { username?: string }).username = token.username as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
};
