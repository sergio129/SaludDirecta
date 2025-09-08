import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioCompra: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  laboratorio: string;
  codigoBarras?: string;
  fechaVencimiento?: Date;
  requiereReceta: boolean;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const ProductSchema: Schema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  precio: {
    type: Number,
    required: [true, 'El precio de venta es requerido'],
    min: [0, 'El precio debe ser mayor o igual a 0']
  },
  precioCompra: {
    type: Number,
    required: [true, 'El precio de compra es requerido'],
    min: [0, 'El precio de compra debe ser mayor o igual a 0']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es requerido'],
    min: [0, 'El stock debe ser mayor o igual a 0'],
    default: 0
  },
  stockMinimo: {
    type: Number,
    required: [true, 'El stock mínimo es requerido'],
    min: [0, 'El stock mínimo debe ser mayor o igual a 0'],
    default: 5
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es requerida'],
    trim: true
  },
  laboratorio: {
    type: String,
    required: [true, 'El laboratorio es requerido'],
    trim: true
  },
  codigoBarras: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  fechaVencimiento: {
    type: Date
  },
  requiereReceta: {
    type: Boolean,
    default: false
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
ProductSchema.index({ nombre: 1 });
ProductSchema.index({ categoria: 1 });
ProductSchema.index({ laboratorio: 1 });
ProductSchema.index({ activo: 1 });
ProductSchema.index({ stock: 1 });

// Método para verificar si necesita reabastecimiento
ProductSchema.methods.necesitaReabastecimiento = function() {
  return this.stock <= this.stockMinimo;
};

// Método para calcular margen de ganancia
ProductSchema.methods.calcularMargen = function() {
  if (this.precioCompra === 0) return 0;
  return ((this.precio - this.precioCompra) / this.precioCompra) * 100;
};

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
