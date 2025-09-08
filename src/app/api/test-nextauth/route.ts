import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import NextAuth from 'next-auth/next';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 NEXTAUTH TEST - Verificando configuración...');

    // Verificar configuración de NextAuth
    const config = {
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      hasUrl: !!process.env.NEXTAUTH_URL,
      url: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      providers: authOptions.providers?.length || 0,
      hasCallbacks: !!authOptions.callbacks,
      sessionStrategy: authOptions.session?.strategy,
      debug: authOptions.debug
    };

    console.log('⚙️ Configuración de NextAuth:', config);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      nextauth: {
        version: '4.x',
        configuration: config,
        status: 'configured'
      }
    });

  } catch (error) {
    console.error('❌ Error en NextAuth test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      nextauth: {
        status: 'error',
        configuration: null
      }
    }, { status: 500 });
  }
}
