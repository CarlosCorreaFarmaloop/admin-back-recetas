import { Status, Wallet } from '../core/modules/order/domain/order.entity';

export interface AdminOrderEntity {
  id: string;
  customer: string;
  billing: {
    type: IBillingType;
  };
  delivery: Delivery;
  payments: Payment[];
  productsOrder: ProductOrder[];
  resumeOrder: ResumeOrder;
  extras: IReferrer;
  seguroComplementario?: ISeguroComplementario;
}

export type IBillingType = 'Boleta' | 'Factura' | 'Despacho' | '';

export interface Delivery {
  cost: number;
  delivery_address: DeliveryAddress;
  method: DeliveryMethod;
  type: DeliveryType;
  discount: number;

  compromiso_entrega: ICompromisoEntrega;
  pricePaid: number;
}

export type DeliveryMethod = 'DELIVERY' | 'STORE';

export interface ICompromisoEntrega {
  dateText: string;
  date: number;
}

export type DeliveryType =
  | ''
  | 'Envío Estándar (48 horas hábiles)'
  | 'Envío Express (4 horas hábiles)'
  | 'Envío en el día (24 horas hábiles)'
  | 'Envío 24 horas hábiles';

export interface DeliveryAddress {
  comuna: string;
  dpto: string;
  firstName: string;
  homeType: string;
  lastName: string;
  phone: string;
  region: string;
  streetName: string;

  streetNumber: string;
}

export interface Payment {
  originCode: string;
  amount: number;
  method: string;
  status: Status;
  wallet: Wallet;

  paymentDate: number;
}

export interface ProductOrder {
  batchId: string;
  bioequivalent: boolean;
  cooled: boolean;
  ean: string;
  expiration: number;
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

  pricePaidPerUnit: number;
  discountPerUnit: number;
}

export interface Prescription {
  file: string;
}

export type PrescriptionType =
  | 'Presentación receta médica'
  | 'Venta directa (Sin receta)'
  | 'Venta bajo receta cheque'
  | 'Receta médica retenida';

export interface ResumeOrder {
  canal: string;
  convenio: string;
  deliveryPrice: number;
  discount: Discount;
  subtotal: number;
  totalPrice: number;
  nroProducts: number;
  clasification?: string;
}

export interface Discount {
  details: Details[];
  total: number;
}

export interface Details {
  discount: number;
  promotionCode: string;
  reference: string;
  type: string;
}

export interface ISeguroComplementario {
  nombreBeneficiario: string;
  id_externo: number;
  credencial_url: string;
  deducible_total: number;
  descuento_total: number;
  tipo_documento_emitir: Documento;
  fecha_creacion: number;
  id: string;
  productos: Producto[];
  rut: string;
  aseguradora_rut: string;
  aseguradora_nombre: string;
}
export interface Producto {
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

export type Documento = 'bill' | 'dispatch_note';

export interface IReferrer {
  referrer: string;
}
