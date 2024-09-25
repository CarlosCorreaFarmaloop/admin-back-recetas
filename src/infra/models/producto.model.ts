import mongoose, { model } from 'mongoose';

import { ProductoEntity } from '../../core/modules/producto/domain/producto.entity';

const BatchSchema = new mongoose.Schema({
  active: Boolean,
  expireDate: Number,
  id: String,
  normalPrice: Number,
  settlementPrice: Number,
  stock: Number,
  unitCost: Number,
});

const CompositionSchema = new mongoose.Schema({
  principio_activo: String,
  concentracion: String,
  unidad_de_medida: String,
});

const ProductoSchema = new mongoose.Schema({
  active: Boolean,
  basePrice: Number,
  batchs: [BatchSchema],
  bioequivalent: Boolean,
  composicion: [CompositionSchema],
  cooled: Boolean,
  ean: String,
  fullName: String,
  genericName: String,
  laboratoryName: String,
  pharmaceuticalForm: String,
  photoURL: String,
  prescriptionType: String,
  presentation: String,
  priority: Number,
  productCategory: String,
  productSubCategory: String,
  quantityPerContainer: Number,
  recommendations: String,
  requiresPrescription: Boolean,
  restrictions: String,
  shortName: String,
  sku: String,
  temporaryCategories: [String],
});

export const ProductoModel = model<ProductoEntity>('complete_products', ProductoSchema);
