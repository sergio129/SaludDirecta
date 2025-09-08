import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  _id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const CategorySchema: Schema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la categoría es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    unique: true
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres']
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índices para mejorar rendimiento
CategorySchema.index({ nombre: 1 });
CategorySchema.index({ activo: 1 });

// Método para verificar si puede ser eliminada
CategorySchema.methods.puedeSerEliminada = async function() {
  // Verificar si hay productos usando esta categoría
  const Product = mongoose.model('Product');
  const productosCount = await Product.countDocuments({ categoria: this.nombre, activo: true });
  return productosCount === 0;
};

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
