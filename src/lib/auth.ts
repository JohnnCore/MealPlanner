import { compare } from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { getUserByEmail } from '@/server/auth/queries';

import { NEXTAUTH_SECRET } from './config';

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'text',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await getUserByEmail(credentials.email);
        if (!user || !user.password) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) token.user = user as typeof token.user;

      // Profile edits call useSession().update({ name, email }) so the sidebar and
      // dashboard reflect the new values without forcing a re-login.
      if (trigger === 'update' && token.user && session) {
        const patch = session as Partial<{ name: string | null; email: string }>;
        if (patch.name !== undefined) token.user.name = patch.name;
        if (patch.email !== undefined) token.user.email = patch.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.user) session.user = token.user;
      return session;
    },
  },
};

export default authOptions;
