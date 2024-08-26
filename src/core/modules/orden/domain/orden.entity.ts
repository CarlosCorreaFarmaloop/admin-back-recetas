export interface OrdenEntity {
  billing: Billing;
  createdAt: Date;
  customer: string;
  delivery: Delivery;
  documentos?: Documento[];
  id: string;
  inPharmacy?: string;
  modifiedPrice?: boolean;
  note?: string;
  payments: Payment[];
  productsOrder: ProductOrder[];
  responsible: string;
  resumeOrder: ResumeOrder;
  statusOrder: StatusOrder;
  provisionalStatusOrder: IProvisionalStatusOrder;
  provisionalStatusOrderDate: number;
  tracking: Tracking[];
  seguroComplementario?: ISeguroComplementario;
  observations?: Observations[];
  history: IOrderHistory[];
  extras: { referrer: string };
}

export type IProvisionalStatusOrder = '' | 'Pendiente' | 'Error' | 'Aprobado';

export interface Billing {
  emitter: string;
  number: string;
  type: IBillingType;
  status: IBillingStatus;
  urlBilling: string;

  urlTimbre?: string;
  emissionDate?: Date;
  statusDate?: Date;

  creditNotes?: CreditNote[];
  delivery?: BillingDelivery;
  direccion_destino?: DireccionDeDestino;
  direccion_origen?: DireccionDeOrigen;
  invoiceCustomer?: InvoiceCustomer;
  referenceDocumentId?: string;

  raw?: object;
}

export type IBillingStatus = '' | 'Pendiente' | 'Aprobado' | 'Rechazado';

export type IBillingType = 'Boleta' | 'Factura' | 'Despacho' | '';

export interface CreditNote {
  createdAt: Date;
  deliveryRefunded: boolean;
  deliveryPrice: number;
  number: number;
  referenceDocumentId: string;
  responsible: string;
  urlLabel: string;
  refundedProducts: RefundedProducts[];
  total_amount: number;
  reason?: string;
}

export interface RefundedProducts {
  documentDetailId: number;
  quantity: number;
  isMerma: boolean;
  sku: string;
  batchId: string;
  name: string;
  price: number;
}

export interface BillingDelivery {
  referenceId: number;
  lineNumber: number;
}

export interface InvoiceCustomer {
  activity: string;
  address: string;
  city: string;
  company: string;
  email: string;
  id: string;
  municipality: string;
  name: string;
  phone: string;
  rut: string;
}

interface DireccionDeDestino {
  direccion: string;
  comuna: string;
  region: string;
  receptor: string;
}

interface DireccionDeOrigen {
  direccion: string;
  comuna: string;
  region: string;
}

export interface Delivery {
  method: DeliveryMethod;
  type: DeliveryType;
  delivery_address: DeliveryAddress;
  cost: number;
  discount: number;
  pricePaid: number;
  provider: DeliveryProvider;
  deliveryTracking: DeliveryTracking[];
  compromiso_entrega: CompromisoEntrega;
  tags?: Record<string, any>;
}

export interface DeliveryAddress {
  comuna: string;
  dpto: string;
  firstName: string;
  fullAddress?: string;
  homeType: string;
  phone: string;
  region: string;

  streetName: string;
  streetNumber: string;

  placeId: string;
  isExactAddress: boolean;
  latitude: string;
  longitude: string;
}

export interface CompromisoEntrega {
  dateText: string;
  date: number;
}

export type DeliveryType =
  | ''
  | 'Envío Estándar (48 horas hábiles)'
  | 'Envío Express (4 horas hábiles)'
  | 'Envío en el día (24 horas hábiles)'
  | 'Envío 24 horas hábiles';

export interface DeliveryProvider {
  provider: string;
  urlLabel: string;
  trackingNumber: string;
  emmissionDate?: number;
  note: string;
  status: DeliveryProviderStatus;
  statusDate?: number;

  service_id?: string;
  urlLabelRayo?: string;
}

export type DeliveryProviderStatus = '' | 'Pendiente' | 'Asignado' | 'Error';

export interface DeliveryTracking {
  fecha: number;
  estado: EstadoCourierTracking;
  comentario: string;
  evidencias: string[];
}

export type EstadoCourierTracking =
  | 'Creado'
  | 'Confirmado'
  | 'Recogido'
  | 'En delivery'
  | 'Entregado'
  | 'Cancelado'
  | 'Observación';

export interface Documento {
  delivery?: DeliveryDocumento;
  documento: 'Boleta' | 'Guia_Yapp' | 'Boleta_Yapp';
  emissionDate?: Date;
  emitter?: string;
  number?: string;
  precio_subtotal: number;
  precio_total: number;
  productos: ProductoDocumento[];
  referenceDocumentId?: string;
  type?: 'Boleta' | 'Factura' | 'Despacho';
  url?: string;
  urlTimbre?: string;
  voucher_url?: string;
}

export interface DeliveryDocumento {
  precio: number;
  precio_sin_descuento: number;
}

export interface ProductoDocumento {
  cantidad: number;
  lote: string;
  precio_referencia: number;
  precio_sin_descuento: number;
  precio: number;
  receta?: Prescription;
  requiere_receta: boolean;
  sku: string;
  seguro_copago?: number;
  seguro_beneficio?: number;
  seguro_deducible?: number;
}

export interface Payment {
  amount: number;
  method: string;
  originCode: string;
  paymentDate: number;

  status: Status;
  wallet: Wallet;
}

export type Status = 'Cancelado' | 'Aprobado' | 'Pendiente';

export type Wallet = 'Transbank' | 'Mercadopago' | 'Integracion';

export interface ProductOrder {
  batchId: string;
  bioequivalent: boolean;
  cooled: boolean;
  ean: string;
  expiration: number;
  laboratoryName: string;
  lineNumber?: number;
  liquid: boolean;
  modified?: boolean;
  fullName: string;
  normalUnitPrice: number;
  originalPrice?: number;
  pharmaceuticalForm: string;
  photoURL: string;
  prescription: Prescription;
  prescriptionType: string;
  presentation: string;
  price: number;
  productCategory: string;
  productSubCategory: string[];
  qty: number;
  quantityPerContainer: string;
  recommendations: string;
  referenceId?: number;
  refundedQuantity?: number;
  requirePrescription: boolean;
  shortName: string;
  sku: string;
  pricePaidPerUnit: number;
  discountPerUnit: number;
}

export interface Prescription {
  file: string;
  state: StatePrescription;
  stateDate: number;
  validation: PrescriptionValidation;
}

export interface PrescriptionValidation {
  comments: string;
  rut: string;
  responsible: string;
}

export type StatePrescription = 'Pending' | 'Rejected' | 'Approved' | 'Approved_With_Comments' | '';

export interface ResumeOrder {
  canal: string;
  clasification1: string;
  clasification2: string;
  clasification3: string;
  clasificationOther1: string;
  clasificationOther2: string;
  clasificationOther3: string;
  convenio: string;
  deliveryPrice: number;
  discount: Discount;
  nroProducts: number;
  subtotal: number;
  tipoDespacho?: string;
  totalPrice: number;
  clasification: string;
  seller: string;
  cartId: string;
}

export interface Discount {
  details: Details[];
  total: number;
}

export interface Details {
  descuentos_unitarios?: DescuentosUnitarios[];
  discount?: number;
  promotionCode: string;
  reference: string;
  type: string;
}

export interface DescuentosUnitarios {
  cantidad: number;
  descuento_unitario: number;
  expireDate: string;
  lote_id: string;
  mg: number;
  price: number;
  sku: string;
}

export interface Tracking {
  date: number;
  responsible: string;
  toStatus: string;
  reason?: string;
}

export type DeliveryMethod = 'DELIVERY' | 'STORE';

export type StatusOrder =
  | 'CANCELADO'
  | 'CREADO'
  | 'VALIDANDO_RECETA'
  | 'RECETA_VALIDADA'
  | 'EN_OBSERVACION'
  | 'PREPARANDO'
  | 'ASIGNAR_A_DELIVERY'
  | 'EN_DELIVERY'
  | 'LISTO_PARA_RETIRO'
  | 'ENTREGADO'
  | 'OBSERVACIONES_RECETAS';

export interface Observations {
  date: Date;
  name: string;
  observation: string;
  responsible: string;
}

export interface IOrderHistory {
  type: IHistoryType;
  changeDate: Date;
  responsible: string;
  changeFrom: string;
  changeTo: string;
  aditionalInfo: {
    product_sku: string;
    comments: string;
  };
}

export type IHistoryType =
  | 'status'
  | 'receta-reemplazada'
  | 'receta-cargada'
  | 'receta-estado'
  | 'seguro'
  | 'courier'
  | 'courier-envio'
  | 'numero-seguimiento'
  | 'observacion'
  | 'direccion-entrega';

export interface IDeliveryTransport {
  id: string;
  name: string;
}

export interface ISeguroComplementario {
  nombreBeneficiario: string;
  id_externo: number;
  id: string;
  credencial_url: string;
  deducible_total: number;
  descuento_total: number;
  tipo_documento_emitir: ISeguroDocumento;
  fecha_creacion: number;
  productos: ISeguroComplementarioProducto[];
  rut: string;
  aseguradora_rut: string;
  aseguradora_nombre: string;

  status: ISeguroComplementarioStatus;
  statusDate: number;

  billing: ISeguroComplementarioBilling[];
  vouchers_url: string[];
  estado_credencial: EstadoCredencial;
  historial: ISeguroComplementarioHistorial[];
}

export type ISeguroComplementarioStatus = '' | 'Pendiente' | 'Aprobado' | 'Error';

export interface ISeguroComplementarioBilling extends Billing {
  destinatario: string;
}

export type EstadoCredencial = 'Pendiente' | 'Aprobado' | 'Cancelado';

export interface ISeguroComplementarioHistorial {
  fecha: Date;
  responsible: string;
  historia: string;
}
export interface ISeguroComplementarioProducto {
  sku: string;
  lote: string;
  descuento_unitario: number;
  cantidad_afectada: number;
  copago_unitario: number;
  precio_pagado_por_unidad: number;
  deducible_unitario: number;
  nombre: string;
  observacion: string;
}

export type ISeguroDocumento = 'bill' | 'dispatch_note';
