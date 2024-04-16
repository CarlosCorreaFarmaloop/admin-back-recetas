import mongoose, { model } from 'mongoose';
import { MovementEntity } from '../../core/modules/movements/domain/movements.entity';

const MovementSchema = new mongoose.Schema({
  batch: String,
  createAt: Date,
  documentNumber: String,
  documento_referencia: String,
  documentType: String,
  id: String,
  movementType: String,
  quantity: Number,
  sku: String,
});

const MovementModel = model<MovementEntity>('movements', MovementSchema);

export default MovementModel;
