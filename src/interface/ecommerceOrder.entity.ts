export interface EcommerceOrderEntity {
  id: string;
  cotizacion?: string;
  customer: string;
  delivery: Delivery;
  payment?: {
    payment: Payment;
  };
  productsOrder: ProductOrder[];
  resumeOrder: ResumeOrder;
  statusOrder: StatusOrder;
  extras: Extras;
}

interface Delivery {
  compromiso_entrega: string;
  cost: number;
  delivery_address: DeliveryAddress;
  method: DeliveryMethod;
  type?: DeliveryType;
}

export type DeliveryType =
  | ''
  | 'Envío Estándar (48 horas hábiles)'
  | 'Envío Express (4 horas hábiles)'
  | 'Envío en el día (24 horas hábiles)'
  | 'Envío 24 horas hábiles';

export type DeliveryMethod = 'DELIVERY' | 'STORE';

interface DeliveryAddress {
  comuna: string;
  dpto: string;
  firstName: string;
  homeType: string;
  lastName: string;
  phone: string;
  region: string;
  streetName: string;
}

interface Extras {
  referrer: string;
}

interface Payment {
  originCode?: string;
  amount?: number;
  method?: string;
  status: string;
  wallet: string;
}

interface ProductOrder {
  batchId: string;
  bioequivalent: boolean;
  cooled: boolean;
  modified: boolean;
  ean: string;
  expiration: number;
  fullName: string;
  laboratoryName: string;
  liquid: boolean;
  normalUnitPrice: number;
  pharmaceuticalForm: string;
  photoURL: string;
  prescription?: Prescription;
  prescriptionType: PrescriptionType;
  presentation: string;
  price: number;
  productCategory: string;
  productSubCategory: string[];
  qty: number;
  quantityPerContainer: string;
  recommendations: string;
  requirePrescription: boolean;
  shortName: string;
  sku: string;
  originalPrice: number;
}

export interface Prescription {
  file: string;
  state: StatePrescription;
  validation: PrescriptionValidation;
}

export interface PrescriptionValidation {
  comments: string;
  rut: string;
  responsible: string;
}

export type StatePrescription = 'Pending' | 'Rejected' | 'Approved' | 'Approved_With_Comments' | '';

interface ResumeOrder {
  nroProducts: number;
  subtotal: number;
  deliveryPrice: number;
  totalPrice: number;
  discount: Discount;
}

interface Discount {
  total: number;
  details: Details[];
}

interface Details {
  descuentos_unitarios?: DescuentoUnitario[];
  discount?: number;
  promotionCode?: string;
  reference?: string;
  type?: string;
}

interface DescuentoUnitario {
  cantidad: number;
  descuento_unitario: number;
  expireDate: string;
  lote_id: string;
  mg: number;
  price: number;
  sku: string;
}

type PrescriptionType =
  | 'Presentación receta médica'
  | 'Venta directa (Sin receta)'
  | 'Venta bajo receta cheque'
  | 'Receta médica retenida';

export type StatusOrder =
  | 'EN_OBSERVACION'
  | 'CANCELADO'
  | 'CREADO'
  | 'VALIDANDO_RECETA'
  | 'RECETA_VALIDADA'
  | 'PREPARANDO'
  | 'EN_DELIVERY'
  | 'ENTREGADO'
  | 'LISTO_PARA_RETIRO'
  | 'ASIGNAR_A_DELIVERY'
  | 'OBSERVACIONES_RECETAS';
