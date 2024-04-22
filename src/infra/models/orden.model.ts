import mongoose, { model } from 'mongoose';
import {
  CompromisoEntrega,
  IOrderHistory,
  DeliveryTracking,
  Payment,
  PaymentForm,
  Details,
  Discount,
  Prescription,
  OrdenEntity,
  ProductOrder,
  Tracking,
  InvoiceCustomer,
  PrescriptionValidation,
  ResumeOrder,
  Documento,
  Delivery,
} from '../../core/modules/order/domain/order.entity';

const TrackingSchema = new mongoose.Schema<Tracking>(
  {
    date: Number,
    responsible: String,
    toStatus: String,
    reason: String,
  },
  { _id: false }
);

const InvoiceCustomerSchema = new mongoose.Schema<InvoiceCustomer>(
  {
    id: String,
    rut: String,
    city: String,
    company: String,
    municipality: String,
    activity: String,
    address: String,
    name: String,
    phone: String,
    email: String,
  },
  { _id: false }
);

const PrescriptionValidationSchema = new mongoose.Schema<PrescriptionValidation>(
  {
    comments: String,
    rut: String,
    responsible: String,
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema<Prescription>(
  {
    file: String,
    state: String,
    validation: PrescriptionValidationSchema,
  },
  { _id: false }
);

const ProductOrderSchema = new mongoose.Schema<ProductOrder>(
  {
    batchId: String,
    expiration: Number,
    lineNumber: Number,
    modified: Boolean,
    laboratoryName: String,
    normalUnitPrice: Number,
    originalPrice: Number,
    prescription: PrescriptionSchema,
    price: Number,
    qty: Number,
    referenceId: Number,
    refundedQuantity: Number,
    requirePrescription: Boolean,
    sku: String,
    bioequivalent: Boolean,
    cooled: Boolean,
    ean: String,
    fullName: String,
    liquid: Boolean,
    pharmaceuticalForm: String,
    photoURL: String,
    prescriptionType: String,
    presentation: String,
    productCategory: String,
    productSubCategory: [String],
    quantityPerContainer: String,
    recommendations: String,
    shortName: String,
  },
  { _id: false }
);

const DescuentosUnitariosSchema = new mongoose.Schema(
  {
    sku: String,
    expireDate: String,
    price: Number,
    cantidad: Number,
    mg: Number,
    descuento_unitario: Number,
  },
  { _id: false }
);

const DiscountDetailsSchema = new mongoose.Schema<Details>(
  {
    descuentos_unitarios: [DescuentosUnitariosSchema],
    discount: Number,
    promotionCode: String,
    reference: String,
    type: String,
  },
  { _id: false }
);

const DiscountSchema = new mongoose.Schema<Discount>(
  {
    details: [DiscountDetailsSchema],
    total: Number,
  },
  { _id: false }
);

const ResumeOrderSchema = new mongoose.Schema<ResumeOrder>(
  {
    canal: String,
    convenio: String,
    deliveryPrice: Number,
    discount: DiscountSchema,
    nroProducts: Number,
    subtotal: Number,
    tipoDespacho: String,
    totalPrice: Number,
  },
  { _id: false }
);

const PaymentFormsSchema = new mongoose.Schema<PaymentForm>(
  {
    amount: Number,
    method: String,
    voucher: String,
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema<Payment>(
  {
    payment: {
      amount: Number,
      method: String,
      paymentDate: Number,
      originCode: String,
      status: String,
      wallet: String,
    },
  },
  { _id: false }
);

const ProductoDocumentoSchema = new mongoose.Schema(
  {
    cantidad: Number,
    lote: String,
    precio_referencia: Number,
    precio_sin_descuento: Number,
    precio: Number,
    receta: String,
    requiere_receta: Boolean,
    sku: String,
    seguro_copago: Number,
    seguro_beneficio: Number,
    seguro_deducible: Number,
  },
  { _id: false }
);

const DeliveryDocumentoSchema = new mongoose.Schema(
  {
    precio: Number,
    precio_sin_descuento: Number,
  },
  { _id: false }
);

const DocumentoSchema = new mongoose.Schema<Documento>(
  {
    delivery: DeliveryDocumentoSchema,
    documento: String,
    emissionDate: Date,
    emitter: String,
    number: String,
    precio_subtotal: Number,
    precio_total: Number,
    productos: [ProductoDocumentoSchema],
    referenceDocumentId: String,
    type: String,
    url: String,
    voucher_url: String,
  },
  { _id: false }
);

const DeliveryTrackingSchema = new mongoose.Schema<DeliveryTracking>(
  {
    estado: String,
    fecha: Number,
    comentario: String,
    evidencias: [String],
  },
  { _id: false }
);

const DeliveryTransportSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
  },
  { _id: false }
);

const ProviderSchema = new mongoose.Schema(
  {
    trackingNumber: String,
    status: String,
    statusDate: Date,
    provider: String,
    urlLabel: String,

    orderTransport: String,
    service_id: String,
    method: String,
    delivery_transport: DeliveryTransportSchema,
    urlLabelRayo: String,
    emmissionDate: Number,
  },
  { _id: false }
);

const DeliveryAddressSchema = new mongoose.Schema(
  {
    comuna: String,
    dpto: String,
    firstName: String,
    fullAddress: String,
    homeType: String,
    phone: String,
    region: String,
    streetName: String,
    streetNumber: String,
  },
  { _id: false }
);

const CompromisoEntregaSchema = new mongoose.Schema<CompromisoEntrega>(
  {
    date: Number,
    dateText: String,
  },
  { _id: false }
);

const DeliverySchema = new mongoose.Schema<Delivery>(
  {
    delivery_address: DeliveryAddressSchema,
    method: { type: String, enum: ['DELIVERY', 'STORE'] },
    type: String,
    cost: Number,
    provider: ProviderSchema,
    deliveryTracking: [DeliveryTrackingSchema],
    compromiso_entrega: CompromisoEntregaSchema,
  },
  { _id: false }
);

const BillingDeliverySchema = new mongoose.Schema(
  {
    referenceId: Number,
    lineNumber: Number,
  },
  { _id: false }
);

const DireccionDeOrigenSchema = new mongoose.Schema(
  {
    direccion: String,
    comuna: String,
    region: String,
  },
  { _id: false }
);

const RefundedProductsSchema = new mongoose.Schema(
  {
    documentDetailId: Number,
    quantity: Number,
    isMerma: Boolean,
    sku: String,
    batchId: String,
    name: String,
    price: Number,
  },
  { _id: false }
);

const CreditNoteShema = new mongoose.Schema(
  {
    createdAt: Date,
    deliveryRefunded: Boolean,
    deliveryPrice: Number,
    number: Number,
    referenceDocumentId: String,
    responsible: String,
    urlLabel: String,
    refundedProducts: [RefundedProductsSchema],
    total_amount: Number,
    reason: String,
  },
  { _id: false }
);

const DireccionDeDestinoSchema = new mongoose.Schema(
  {
    direccion: String,
    comuna: String,
    region: String,
    receptor: String,
  },
  { _id: false }
);

const BillingSchema = new mongoose.Schema(
  {
    creditNotes: [CreditNoteShema],
    delivery: BillingDeliverySchema,
    direccion_destino: DireccionDeDestinoSchema,
    direccion_origen: DireccionDeOrigenSchema,
    emissionDate: Date,
    emitter: String,
    invoiceCustomer: InvoiceCustomerSchema,
    number: String,
    referenceDocumentId: String,
    type: { type: String, enum: ['Boleta', 'Factura', 'Despacho', ''] },
    urlBilling: String,
    urlTimbre: String,
    status: { type: String, enum: ['Pendiente', 'Aprobado', 'Rechazado', ''] },
    statusDate: Date,
  },
  { _id: false }
);

const ObservationsSchema = new mongoose.Schema(
  {
    observation: String,
    responsible: String,
    name: String,
    date: Date,
  },
  { _id: false }
);

const HistorySchema = new mongoose.Schema<IOrderHistory>(
  {
    type: {
      type: String,
      enum: ['status', 'receta', 'seguro', 'courier', 'courier-envio', 'numero-seguimiento', 'observacion'],
    },
    changeDate: Date,
    responsible: String,
    changeFrom: String,
    changeTo: String,
    aditionalInfo: {
      product_sku: String,
      comments: String,
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema({
  billing: BillingSchema,
  cotizacion: String,
  createdAt: Date,
  customer: String,
  delivery: DeliverySchema,
  documentos: [DocumentoSchema],
  id: String,
  inPharmacy: String,
  modifiedPrice: Boolean,
  note: String,
  payment: PaymentSchema,
  paymentForms: [PaymentFormsSchema],
  productsOrder: [ProductOrderSchema],
  responsible: String,
  resumeOrder: ResumeOrderSchema,
  statusOrder: String,
  provisionalStatusOrder: String,
  provisionalStatusOrderDate: Number,
  tracking: [TrackingSchema],
  urlLabel: String,
  observations: [ObservationsSchema],
  history: [HistorySchema],
  extras: { referrer: String },
});

const OrderModel = model<OrdenEntity>('orders', OrderSchema);

export default OrderModel;
