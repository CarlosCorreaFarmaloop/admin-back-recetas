import mongoose, { model } from 'mongoose';
import { CotizacionEntity } from '../../core/modules/cotizacion/domain/cotizacion.entity';

const TrackingSchema = new mongoose.Schema({
  estado: String,
  fecha: Date,
  responsable: String,
});

const ProductoSchema = new mongoose.Schema({
  beneficio_unitario: Number,
  cantidad: Number,
  copago_unitario: Number,
  deducible_unitario: Number,
  lote: String,
  nombre: String,
  observacion: String,
  precio_unitario: Number,
  sku: String,
});

const CotizacionSchema = new mongoose.Schema({
  beneficiario: String,
  correo_electronico: String,
  cotizacion_id: Number,
  credencial: String,
  deducible_total: Number,
  descuento_total: Number,
  documento: String,
  estado_crendencial: String,
  estado: String,
  fecha_creacion: Number,
  id: String,
  productos: [ProductoSchema],
  rut: String,
  seguro_id: String,
  seguro_nombre: String,
  tracking: [TrackingSchema],
  voucher_url: String,
});

const CotizacionModel = model<CotizacionEntity>('cotizaciones', CotizacionSchema);

export default CotizacionModel;
