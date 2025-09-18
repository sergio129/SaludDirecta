// Script para actualizar productos existentes con los nuevos campos de unidades y empaques
// Ejecutar con: npx tsx scripts/update-products.ts

import mongoose from 'mongoose';
import Product from '../lib/models/Product';
import dbConnect from '../lib/mongodb';

async function updateExistingProducts() {
  try {
    await dbConnect();
    console.log('Conectado a la base de datos');

    // Actualizar productos que no tienen los nuevos campos
    const result = await Product.updateMany(
      {
        $or: [
          { tipoVenta: { $exists: false } },
          { unidadesPorEmpaque: { $exists: false } }
        ]
      },
      {
        $set: {
          tipoVenta: 'unidad', // Por defecto se venden por unidad
          unidadesPorEmpaque: 1, // 1 unidad por empaque por defecto
          precioPorUnidad: '$precio', // El precio actual se mantiene como precio por unidad
          precioPorEmpaque: '$precio' // Por defecto mismo precio
        }
      }
    );

    console.log(`Actualizados ${result.modifiedCount} productos`);

    // Ejemplos de productos que se venden por empaque
    const empaqueProducts = await Product.find({
      nombre: {
        $regex: /(aspirina|ibuprofeno|paracetamol|amoxicilina|omeprazol)/i,
        $options: 'i'
      }
    }).limit(5);

    for (const product of empaqueProducts) {
      await Product.findByIdAndUpdate(product._id, {
        tipoVenta: 'ambos', // Permite venta por unidad y empaque
        unidadesPorEmpaque: 30, // 30 unidades por caja
        precioPorUnidad: Math.round(product.precio / 30), // Precio por unidad
        precioPorEmpaque: product.precio // Precio por caja completa
      });
      console.log(`Actualizado: ${product.nombre} - 30 unidades por empaque`);
    }

    console.log('Actualización completada');

  } catch (error) {
    console.error('Error actualizando productos:', error);
  } finally {
    await mongoose.connection.close();
  }
}

updateExistingProducts();