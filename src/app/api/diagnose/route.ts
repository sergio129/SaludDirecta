import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DIAGNÓSTICO DE CONEXIÓN ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI existe:', !!process.env.MONGODB_URI);
    console.log('NEXTAUTH_SECRET existe:', !!process.env.NEXTAUTH_SECRET);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

    // Intentar conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await dbConnect();
    console.log('✅ Conexión a MongoDB exitosa');

    // Verificar usuarios existentes
    const totalUsers = await User.countDocuments();
    console.log('Total de usuarios en BD:', totalUsers);

    const allUsers = await User.find({}, 'name email role activo fecha_creacion').lean();
    console.log('Usuarios encontrados:', allUsers.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
      activo: u.activo,
      fecha_creacion: u.fecha_creacion
    })));

    // Buscar usuario admin
    const adminUser = await User.findOne({ role: 'admin' });
    console.log('Usuario admin encontrado:', adminUser ? {
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      activo: adminUser.activo
    } : 'No encontrado');

    return NextResponse.json({
      status: 'success',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI ? 'Configurado' : 'Faltante',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Configurado' : 'Faltante',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
      },
      database: {
        connection: 'success',
        totalUsers,
        users: allUsers.map(u => ({
          name: u.name,
          email: u.email,
          role: u.role,
          activo: u.activo
        })),
        adminUser: adminUser ? {
          name: adminUser.name,
          email: adminUser.email,
          activo: adminUser.activo
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI ? 'Configurado' : 'Faltante',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Configurado' : 'Faltante',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
      }
    }, { status: 500 });
  }
}
