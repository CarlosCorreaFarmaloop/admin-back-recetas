export interface EcommerceOrderEntity {
  id: string;
  customer: string;
  delivery: Delivery;
  payment: Payment;
  productsOrder: ProductOrder[];
  resumeOrder: ResumeOrder;
  extras: IReferrer;
  seguroComplementario?: ISeguroComplementario;
}

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
  payment: {
    originCode?: string;
    amount?: number;
    method?: string;
    status: string;
    wallet: string;

    paymentDate?: number;
  };
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
  deliveryPrice: number;
  discount: Discount;
  subtotal: number;
  totalPrice: number;
  nroProducts: number;
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

// export interface EcommerceOrderEntity {
//   id: string;
//   customer: string;
//   cotizacion?: string;
//   delivery: Delivery;
//   payment?: {
//     payment: Payment;
//   };
//   productsOrder: ProductOrder[];
//   resumeOrder: ResumeOrder;
//   statusOrder: StatusOrder;
//   extras: Extras;
// }

// interface Delivery {
//   compromiso_entrega: string;
//   cost: number;
//   delivery_address: DeliveryAddress;
//   method: DeliveryMethod;
//   type?: DeliveryType;
// }

// export type DeliveryType =
//   | ''
//   | 'Envío Estándar (48 horas hábiles)'
//   | 'Envío Express (4 horas hábiles)'
//   | 'Envío en el día (24 horas hábiles)'
//   | 'Envío 24 horas hábiles';

// export type DeliveryMethod = 'DELIVERY' | 'STORE';

// interface DeliveryAddress {
//   comuna: string;
//   dpto: string;
//   firstName: string;
//   homeType: string;
//   lastName: string;
//   phone: string;
//   region: string;
//   streetName: string;
// }

// interface Extras {
//   referrer: string;
// }

// interface Payment {
//   originCode?: string;
//   amount?: number;
//   method?: string;
//   status: string;
//   wallet: string;
// }

// interface ProductOrder {
//   batchId: string;
//   bioequivalent: boolean;
//   cooled: boolean;
//   ean: string;
//   expiration: number;
//   fullName: string;
//   laboratoryName: string;
//   liquid: boolean;
//   normalUnitPrice: number;
//   pharmaceuticalForm: string;
//   photoURL: string;
//   prescription?: Prescription;
//   prescriptionType: PrescriptionType;
//   presentation: string;
//   price: number;
//   productCategory: string;
//   productSubCategory: string[];
//   qty: number;
//   quantityPerContainer: string;
//   recommendations: string;
//   requirePrescription: boolean;
//   shortName: string;
//   sku: string;
// }

// export interface Prescription {
//   file: string;
//   state: StatePrescription;
//   validation: PrescriptionValidation;
// }

// export interface PrescriptionValidation {
//   comments: string;
//   rut: string;
//   responsible: string;
// }

// export type StatePrescription = 'Pending' | 'Rejected' | 'Approved' | 'Approved_With_Comments' | '';

// interface ResumeOrder {
//   subtotal: number;
//   deliveryPrice: number;
//   totalPrice: number;
//   discount: Discount;
//   nroProducts: number;
// }

// interface Discount {
//   total: number;
//   details: Details[];
// }

// interface Details {
//   descuentos_unitarios?: DescuentoUnitario[];
//   discount?: number;
//   promotionCode?: string;
//   reference?: string;
//   type?: string;
// }

// interface DescuentoUnitario {
//   cantidad: number;
//   descuento_unitario: number;
//   expireDate: string;
//   lote_id: string;
//   mg: number;
//   price: number;
//   sku: string;
// }

// type PrescriptionType =
//   | 'Presentación receta médica'
//   | 'Venta directa (Sin receta)'
//   | 'Venta bajo receta cheque'
//   | 'Receta médica retenida';

// export type StatusOrder =
//   | 'EN_OBSERVACION'
//   | 'CANCELADO'
//   | 'CREADO'
//   | 'VALIDANDO_RECETA'
//   | 'RECETA_VALIDADA'
//   | 'PREPARANDO'
//   | 'EN_DELIVERY'
//   | 'ENTREGADO'
//   | 'LISTO_PARA_RETIRO'
//   | 'ASIGNAR_A_DELIVERY'
//   | 'OBSERVACIONES_RECETAS';
