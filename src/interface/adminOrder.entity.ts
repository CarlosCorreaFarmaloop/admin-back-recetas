export interface AdminOrderEntity {
  id: string;
  billing: Billing;
  cotizacion?: string;
  createdAt: Date;
  customer: string;
  delivery: Delivery;
  extras: Extras;
  payment: Payment;
  productsOrder: ProductOrder[];
  resumeOrder: ResumeOrder;
  seguro_complementario?: SeguroComplementario;
  statusOrder: string;
  tracking: Tracking[];
}

interface Billing {
  emitter: string;
  number: string;
  type: string;
  urlBilling: string;
}

interface Delivery {
  compromiso_entrega: string;
  cost: number;
  delivery_address: DeliveryAddress;
  method: string;
  provider: Provider;
  type?: string;
}

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

interface Provider {
  provider: string;
  orderTransport: string;
  urlLabel: string;
}

interface Extras {
  referrer: string;
}

interface Payment {
  amount?: number;
  method?: string;
  originCode?: string;
  status: string;
  wallet: string;
}

export interface ProductOrder {
  batchId: string;
  bioequivalent: boolean;
  cooled: boolean;
  ean: string;
  expireDate: string;
  fullName: string;
  laboratoryName: string;
  liquid: boolean;
  normalUnitPrice: number;
  pharmaceuticalForm: string;
  photoURL: string;
  prescription: Prescription;
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
  seguro_complementario?: SeguroComplementarioProducto;
}

interface Prescription {
  state: string;
  file: string;
  validation: { rut: string; comments: string };
}

interface SeguroComplementarioProducto {
  beneficio_unitario: number;
  cantidad: number;
  copago_unitario: number;
  deducible_unitario: number;
  observacion: string;
  precio_unitario: number;
}

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

interface SeguroComplementario {
  beneficiario: string;
  cotizacion_id: number;
  credencial: string;
  deducible_total: number;
  descuento_total: number;
  documento: string;
  estado_crendencial: string;
  estado: string;
  fecha_creacion: number;
  id: string;
  rut: string;
  seguro_id: string;
  seguro_nombre: string;
}

interface Tracking {
  date: Date;
  responsible: string;
  toStatus: string;
}

export type PrescriptionType =
  | 'Presentación receta médica'
  | 'Venta directa (Sin receta)'
  | 'Venta bajo receta cheque'
  | 'Receta médica retenida';
