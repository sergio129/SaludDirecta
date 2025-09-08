import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    user.activo = true;
    user.fecha_activacion = new Date();
    await user.save();

    console.log('Usuario activado:', email);

    return NextResponse.json({
      message: 'Usuario activado exitosamente',
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        activo: user.activo
      }
    });

  } catch (error) {
    console.error('Error activando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
