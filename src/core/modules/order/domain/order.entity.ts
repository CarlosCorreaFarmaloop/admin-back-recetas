export interface OrdenEntity {
  billing: Billing;
  createdAt: Date;
  customer?: string;
  delivery: Delivery;
  documentos?: Documento[];
  id: string;
  inPharmacy?: string;
  modifiedPrice?: boolean;
  note?: string;
  payment?: Payment;
  paymentForms: PaymentForm[];
  productsOrder: ProductOrder[];
  responsible: string;
  resumeOrder: ResumeOrder;
  statusOrder: StatusOrder;
  provisionalStatusOrder: IProvisionalStatusOrder;
  provisionalStatusOrderDate: number;
  tracking: Tracking[];
  cotizacion?: string;
  urlLabel?: string;
  observations?: Observations[];
  history: IOrderHistory[];
  extras: { referrer: string };
}

export type IProvisionalStatusOrder = '' | 'Pendiente' | 'Error';

export interface Billing {
  emitter: string;
  number: string;
  type: '' | 'Boleta' | 'Factura' | 'Despacho';
  status: IBillingStatus;
  statusDate?: Date;
  urlBilling: string;

  creditNotes?: CreditNote[];
  delivery?: BillingDelivery;
  direccion_destino?: DireccionDeDestino;
  direccion_origen?: DireccionDeOrigen;
  emissionDate?: Date;
  invoiceCustomer?: InvoiceCustomer;
  referenceDocumentId?: string;
  urlTimbre?: string;
}

export type IBillingStatus = '' | 'Pendiente' | 'Aprobado' | 'Rechazado';

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
  delivery_address: DeliveryAddress;
  method: DeliveryMethod;
  type: DeliveryType;
  cost: number;
  provider: DeliveryProvider;
  deliveryTracking?: DeliveryTracking[];
  compromiso_entrega: string;
}

export interface DeliveryAddress {
  comuna: string;
  dpto: string;
  firstName: string;
  fullAddress?: string;
  homeType: string;
  phone: string;
  region: string;
  streetName?: string;
  streetNumber?: string;
}

export type DeliveryType =
  | ''
  | 'Envío Estándar (48 horas hábiles)'
  | 'Envío Express (4 horas hábiles)'
  | 'Envío en el día (24 horas hábiles)'
  | 'Envío 24 horas hábiles';

export interface DeliveryProvider {
  status: DeliveryProviderStatus;
  provider: string;
  orderTransport: string;
  urlLabel: string;

  statusDate?: Date;
  trackingNumber?: string;
  urlLabelRayo?: string;
  service_id?: string;
  delivery_transport?: IDeliveryTransport;
  method?: string;
}

export type DeliveryProviderStatus = '' | 'Pendiente' | 'Asignado';

export interface DeliveryTracking {
  fecha: Date;
  estado: string;
  comentario: string;
  evidencias: string[];
}

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
  payment: {
    amount?: number;
    method?: string;
    originCode?: string;
    status: string;
    wallet: string;
  };
}

export interface PaymentForm {
  amount: number;
  method: string;
  voucher?: string;
}

export interface ProductOrder {
  batchId: string;
  bioequivalent: boolean;
  cooled: boolean;
  ean: string;
  expiration: number;
  laboratoryName: string;
  lineNumber?: number;
  liquid: boolean;
  modified: boolean;
  fullName: string;
  normalUnitPrice: number;
  originalPrice: number;
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
  canal?: string;
  convenio: string;
  deliveryPrice: number;
  discount: Discount;
  nroProducts: number;
  subtotal: number;
  tipoDespacho?: string;
  totalPrice: number;
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
  date: Date;
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
  | 'observacion';

export interface IDeliveryTransport {
  id: string;
  name: string;
}
