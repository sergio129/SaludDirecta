import dbConnect from './mongodb.ts';
import Product from './models/Product.ts';

export default async function migrateProducts() {
  try {
    await dbConnect();

    // Actualizar todos los productos que no tienen los campos nuevos
    const result = await Product.updateMany(
      {
        $or: [
          { stockCajas: { $exists: false } },
          { unidadesPorCaja: { $exists: false } },
          { stockUnidadesSueltas: { $exists: false } },
          { precioCompraCaja: { $exists: false } },
          { precioCaja: { $exists: false } },
          { margenGananciaUnidad: { $exists: false } },
          { margenGananciaCaja: { $exists: false } }
        ]
      },
      {
        $set: {
          stockCajas: 0,
          unidadesPorCaja: 1,
          stockUnidadesSueltas: 0,
          precioCompraCaja: 0,
          precioCaja: 0,
          margenGananciaUnidad: 0,
          margenGananciaCaja: 0
        }
      }
    );

    console.log(`Migración completada. ${result.modifiedCount} productos actualizados.`);

    // Recalcular el stock total para todos los productos
    const products = await Product.find({});
    for (const product of products) {
      const totalStock = (product.stockCajas * product.unidadesPorCaja) + product.stockUnidadesSueltas;
      await Product.updateOne(
        { _id: product._id },
        { $set: { stock: totalStock } }
      );
    }

    console.log('Recálculo de stock total completado.');

  } catch (error) {
    console.error('Error en la migración:', error);
  }
}