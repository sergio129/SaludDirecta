// Configuración de NextAuth para diferentes entornos
export const getAuthOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = !!process.env.VERCEL;

  console.log('🌍 Entorno detectado:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    isProduction,
    isVercel
  });

  return {
    providers: [
      // Los providers se definen en el archivo principal
    ],
    session: {
      strategy: 'jwt' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 días
      updateAge: 24 * 60 * 60, // 24 horas
    },
    callbacks: {
      // Los callbacks se definen en el archivo principal
    },
    pages: {
      signIn: '/login',
      error: '/auth/error',
    },
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
    debug: !isProduction,
    useSecureCookies: isProduction,
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: isProduction,
        },
      },
    },
  };
};
