import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Users are defined via environment variables.
// Format: USERS=[{"username":"alice","password":"<bcrypt-hash>","name":"Alice"},...]
// Generate a hash: https://bcrypt-generator.com  (rounds=10)
// Or set ADMIN_USER / ADMIN_PASS / ADMIN_NAME for a single quick user.

function getUsers(): Array<{ username: string; password: string; name: string }> {
  if (process.env.USERS) {
    try {
      return JSON.parse(process.env.USERS);
    } catch {
      console.error("Invalid USERS env var — expected JSON array");
    }
  }
  // Fallback single admin from individual env vars (plain password, hashed at runtime)
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
        const users = getUsers();
        const found = users.find(
          (u) => u.username.toLowerCase() === credentials.username.toLowerCase()
        );
        if (!found) return null;
        // Support both bcrypt hashes and plain-text passwords (plain only for dev)
        const valid =
          found.password.startsWith("$2")
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
