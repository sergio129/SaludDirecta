import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Sale from '@/lib/models/Sale';
import User from '@/lib/models/User';
import Category from '@/lib/models/Category';

export async function POST() {
  try {
    await dbConnect();

    // Crear categorías de ejemplo
    const categoriasEjemplo = [
      {
        nombre: 'Analgésicos',
        descripcion: 'Medicamentos para el dolor y fiebre',
        activo: true
      },
      {
        nombre: 'Antiinflamatorios',
        descripcion: 'Medicamentos para reducir inflamación',
        activo: true
      },
      {
        nombre: 'Antibióticos',
        descripcion: 'Medicamentos para infecciones bacterianas',
        activo: true
      },
      {
        nombre: 'Gastrointestinales',
        descripcion: 'Medicamentos para problemas digestivos',
        activo: true
      },
      {
        nombre: 'Antialérgicos',
        descripcion: 'Medicamentos para alergias',
        activo: true
      },
      {
        nombre: 'Cardiovasculares',
        descripcion: 'Medicamentos para el corazón y circulación',
        activo: true
      }
    ];

    // Insertar categorías si no existen
    for (const categoria of categoriasEjemplo) {
      const existe = await Category.findOne({ nombre: categoria.nombre });
      if (!existe) {
        await Category.create(categoria);
      }
    }

    console.log('Categorías de ejemplo creadas');

    // Crear productos de ejemplo
    const productosEjemplo = [
      {
        nombre: 'Paracetamol 500mg',
        descripcion: 'Analgésico y antipirético',
        precio: 2500,
        precioCompra: 1800,
        stock: 150,
        stockMinimo: 20,
        categoria: 'Analgésicos',
        laboratorio: 'Genfar',
        requiereReceta: false,
        activo: true
      },
      {
        nombre: 'Ibuprofeno 400mg',
        descripcion: 'Antiinflamatorio no esteroideo',
        precio: 3200,
        precioCompra: 2400,
        stock: 120,
        stockMinimo: 15,
        categoria: 'Antiinflamatorios',
        laboratorio: 'MK',
        requiereReceta: false,
        activo: true
      },
      {
        nombre: 'Amoxicilina 500mg',
        descripcion: 'Antibiótico de amplio espectro',
        precio: 4500,
        precioCompra: 3200,
        stock: 80,
        stockMinimo: 10,
        categoria: 'Antibióticos',
        laboratorio: 'Pfizer',
        requiereReceta: true,
        activo: true
      },
      {
        nombre: 'Omeprazol 20mg',
        descripcion: 'Inhibidor de la bomba de protones',
        precio: 3800,
        precioCompra: 2800,
        stock: 90,
        stockMinimo: 12,
        categoria: 'Gastrointestinales',
        laboratorio: 'AstraZeneca',
        requiereReceta: false,
        activo: true
      },
      {
        nombre: 'Loratadina 10mg',
        descripcion: 'Antihistamínico',
        precio: 2800,
        precioCompra: 2000,
        stock: 110,
        stockMinimo: 18,
        categoria: 'Antialérgicos',
        laboratorio: 'Bayer',
        requiereReceta: false,
        activo: true
      }
    ];

    // Insertar productos
    const productosInsertados = await Product.insertMany(productosEjemplo);
    console.log(`Insertados ${productosInsertados.length} productos`);

    // Obtener un usuario vendedor para las ventas
    const vendedor = await User.findOne({ role: 'vendedor', activo: true });
    if (!vendedor) {
      return Response.json({ error: 'No hay vendedores activos' }, { status: 400 });
    }

    // Crear ventas de ejemplo
    const ventasEjemplo = [];
    const hoy = new Date();

    for (let i = 0; i < 10; i++) {
      const fechaVenta = new Date(hoy);
      fechaVenta.setDate(fechaVenta.getDate() - Math.floor(Math.random() * 30)); // Últimos 30 días

      const productosAleatorios = productosInsertados
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 productos por venta

      const items = productosAleatorios.map(producto => ({
        producto: producto._id,
        nombreProducto: producto.nombre,
        cantidad: Math.floor(Math.random() * 3) + 1,
        precioUnitario: producto.precio,
        precioTotal: 0 // Se calculará automáticamente
      }));

      // Calcular totales
      const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
      const descuento = Math.random() < 0.3 ? Math.floor(subtotal * 0.1) : 0; // 30% de descuento
      const impuesto = Math.floor((subtotal - descuento) * 0.19); // IVA 19%
      const total = subtotal - descuento + impuesto;

      // Actualizar precioTotal de items
      items.forEach(item => {
        item.precioTotal = item.cantidad * item.precioUnitario;
      });

      const venta = {
        numeroFactura: `FAC-${String(1000 + i).padStart(4, '0')}`,
        cliente: Math.random() < 0.7 ? {
          nombre: `Cliente ${i + 1}`,
          cedula: `12345678${i}`,
          telefono: `30012345${i}`
        } : undefined,
        items,
        subtotal,
        descuento,
        impuesto,
        total,
        metodoPago: ['efectivo', 'tarjeta', 'transferencia'][Math.floor(Math.random() * 3)],
        estado: ['completada', 'pendiente', 'cancelada'][Math.floor(Math.random() * 3)],
        vendedor: vendedor._id,
        fechaVenta
      };

      ventasEjemplo.push(venta);
    }

    // Insertar ventas
    const ventasInsertadas = await Sale.insertMany(ventasEjemplo);
    console.log(`Insertadas ${ventasInsertadas.length} ventas`);

    return Response.json({
      message: 'Datos de ejemplo creados exitosamente',
      productos: productosInsertados.length,
      ventas: ventasInsertadas.length
    });

  } catch (error) {
    console.error('Error creando datos de ejemplo:', error);
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
