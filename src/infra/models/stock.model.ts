import mongoose, { model } from 'mongoose';

import { StockEntity } from '../../core/modules/stock/domain/stock.entity';

const BatchSchema = new mongoose.Schema(
  {
    active: Boolean,
    expireDate: Number,
    id: String,
    mg: Number,
    normalPrice: Number,
    settlementPrice: Number,
    stock: Number,
    unitCost: Number,
  },
  { _id: false }
);

const StockSchema = new mongoose.Schema({
  active: Boolean,
  batchs: [BatchSchema],
  fullName: String,
  laboratoryName: String,
  sku: String,
});

export const StockModel = model<StockEntity>('complete_products', StockSchema);
