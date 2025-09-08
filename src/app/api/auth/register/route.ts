import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando registro de usuario...');

    const { name, email, password, role } = await request.json();
    console.log('Datos recibidos:', { name, email, role: role || 'vendedor' });

    if (!name || !email || !password) {
      console.log('Campos faltantes');
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    console.log('Conectando a base de datos...');
    await dbConnect();
    console.log('Conexión exitosa a base de datos');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Usuario ya existe:', email);
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    console.log('Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'vendedor',
      activo: false, // Usuario inactivo por defecto, requiere aprobación del admin
    });

    console.log('Guardando usuario...');
    await user.save();
    console.log('Usuario guardado exitosamente:', email);

    return NextResponse.json({ message: 'Usuario registrado exitosamente' }, { status: 201 });
  } catch (error) {
    console.error('Error completo en registro:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}
