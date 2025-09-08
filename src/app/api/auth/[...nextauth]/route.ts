/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

interface Credentials {
  email: string;
  password: string;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials: Credentials | undefined): Promise<any> {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await dbConnect();

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            return null;
          }

          if (!user.activo) {
            throw new Error('Usuario no autorizado. Contacta al administrador.');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Error en authorize:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      try {
        if (user) {
          token.role = user.role;
        }
        return token;
      } catch (error) {
        console.error('Error en JWT callback:', error);
        return token;
      }
    },
    async session({ session, token }: any) {
      try {
        if (session.user && token) {
          session.user.id = token.sub!;
          session.user.role = token.role as string;
        }
        return session;
      } catch (error) {
        console.error('Error en session callback:', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
