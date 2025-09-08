import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { activo, role } = await request.json();

    await dbConnect();

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Actualizar campos
    if (activo !== undefined) {
      user.activo = activo;
      if (activo && !user.fecha_activacion) {
        user.fecha_activacion = new Date();
      }
    }

    if (role !== undefined && role !== user.role) {
      user.role = role;
    }

    await user.save();

    return NextResponse.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await dbConnect();

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No permitir eliminar al último admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', activo: true });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'No se puede eliminar al último administrador activo' }, { status: 400 });
      }
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
