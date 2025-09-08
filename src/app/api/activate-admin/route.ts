import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST() {
  try {
    await dbConnect();

    // Activar el usuario admin específico
    const result = await User.updateOne(
      { email: 'sanayaromero62@gmail.com' },
      {
        $set: {
          activo: true,
          fecha_activacion: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Usuario admin activado exitosamente',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
