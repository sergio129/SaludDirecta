import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';

const authOptions = {
  providers: [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoria = searchParams.get('categoria');
    const activo = searchParams.get('activo');

    const query: any = {};

    // Filtro por búsqueda (nombre, código, código de barras)
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { codigoBarras: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtro por categoría
    if (categoria && categoria !== 'todas') {
      query.categoria = categoria;
    }

    // Filtro por estado activo
    if (activo !== null) {
      query.activo = activo === 'true';
    } else {
      query.activo = true; // Por defecto solo productos activos
    }

    const products = await Product.find(query).sort({ fechaCreacion: -1 });

    return NextResponse.json(products);

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre, descripcion, precio, precioCompra, stock, stockMinimo, categoria, laboratorio, requiereReceta, codigo, codigoBarras } = await request.json();

    if (!nombre || !precio || !precioCompra || stock === undefined || !stockMinimo || !categoria || !laboratorio) {
      return NextResponse.json({ error: 'Todos los campos requeridos deben ser proporcionados' }, { status: 400 });
    }

    await dbConnect();

    const product = new Product({
      nombre,
      descripcion,
      precio,
      precioCompra,
      stock,
      stockMinimo,
      categoria,
      laboratorio,
      requiereReceta: requiereReceta || false,
      codigo,
      codigoBarras,
      activo: true
    });

    await product.save();

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error('Error creando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
