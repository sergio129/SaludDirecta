import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'vendedor'], default: 'vendedor' },
  activo: { type: Boolean, default: false },
  fecha_creacion: { type: Date, default: Date.now },
  fecha_activacion: { type: Date },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
