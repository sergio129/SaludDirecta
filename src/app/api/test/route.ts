import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🧪 TEST ENDPOINT - Iniciando pruebas...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔗 VERCEL:', process.env.VERCEL);
    console.log('🔑 NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('🌐 NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('🗄️ MONGODB_URI exists:', !!process.env.MONGODB_URI);

    // Test 1: MongoDB Connection
    console.log('📡 Test 1: Conectando a MongoDB...');
    const connectStart = Date.now();
    await dbConnect();
    const connectTime = Date.now() - connectStart;
    console.log(`✅ MongoDB conectado en ${connectTime}ms`);

    // Test 2: User Count
    console.log('👥 Test 2: Contando usuarios...');
    const userCount = await User.countDocuments();
    console.log(`✅ Encontrados ${userCount} usuarios`);

    // Test 3: Find Admin User
    console.log('👑 Test 3: Buscando usuario admin...');
    const adminUser = await User.findOne({ role: 'admin' });
    console.log('✅ Usuario admin:', adminUser ? adminUser.email : 'No encontrado');

    // Test 4: Find Specific User
    console.log('🔍 Test 4: Buscando usuario específico...');
    const testUser = await User.findOne({ email: 'sanayaromero62@gmail.com' });
    console.log('✅ Usuario específico:', testUser ? {
      email: testUser.email,
      role: testUser.role,
      activo: testUser.activo
    } : 'No encontrado');

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      executionTime: `${totalTime}ms`,
      tests: {
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          MONGODB_URI: !!process.env.MONGODB_URI
        },
        database: {
          connection: 'success',
          connectTime: `${connectTime}ms`,
          userCount,
          adminUser: adminUser ? adminUser.email : null,
          testUser: testUser ? {
            email: testUser.email,
            role: testUser.role,
            activo: testUser.activo
          } : null
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en test endpoint:', error);
    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      executionTime: `${totalTime}ms`,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
