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
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials: Credentials | undefined): Promise<any> {
        try {
          console.log('🔐 Intentando autenticar usuario:', credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Credenciales faltantes');
            return null;
          }

          console.log('🔌 Conectando a base de datos...');
          await dbConnect();
          console.log('✅ Conexión exitosa a base de datos');

          const user = await User.findOne({ email: credentials.email });
          console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No');

          if (!user) {
            console.log('❌ Usuario no encontrado');
            return null;
          }

          if (!user.activo) {
            console.log('🚫 Usuario no activo');
            throw new Error('Usuario no autorizado. Contacta al administrador.');
          }

          console.log('🔒 Verificando contraseña...');
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          console.log('✅ Contraseña válida:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Contraseña incorrecta');
            return null;
          }

          console.log('🎉 Autenticación exitosa para:', user.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('💥 Error en authorize:', error);
          // Para errores del servidor, retornar null en lugar de lanzar error
          if (error instanceof Error && error.message.includes('Usuario no autorizado')) {
            throw error; // Re-lanzar errores de usuario no autorizado
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      try {
        console.log('🔑 JWT callback - Token:', !!token, 'User:', !!user, 'Account:', !!account);

        if (user) {
          token.role = user.role;
          token.id = user.id;
        }

        console.log('✅ JWT callback completado');
        return token;
      } catch (error) {
        console.error('💥 Error en JWT callback:', error);
        return token;
      }
    },
    async session({ session, token }: any) {
      try {
        console.log('📋 Session callback - Session:', !!session, 'Token:', !!token);

        if (session.user && token) {
          session.user.id = token.id || token.sub;
          session.user.role = token.role;
        }

        console.log('✅ Session callback completado');
        return session;
      } catch (error) {
        console.error('💥 Error en session callback:', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
