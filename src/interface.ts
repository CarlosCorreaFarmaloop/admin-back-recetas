export interface OrderFromEcommerce {
  id: string;
  cotizacion?: string;
  customer: string;
  delivery: Delivery;
  payment: Payment;
  productsOrder: ProductOrder[];
  resumeOrder: ResumeOrder;
  statusOrder: string;
}

export interface Delivery {
  delivery_address: DeliveryAddress;
  method: string;
  type?: string;
  cost: number;
}

export interface DeliveryAddress {
  firstName: string;
  lastName: string;
  phone: string;
  streetName: string;
  comuna: string;
  region: string;
  city?: string;
  homeType: string;
  number?: string;
  dpto?: string;
  reference?: string;
}

export interface Payment {
  wallet?: string;
  method?: string;
  amount?: number;
  originCode?: string;
  status?: string;
}

export interface ProductOrder {
  batchId: string;
  bioequivalent: boolean;
  cooled: boolean;
  ean: string;
  fullName: string;
  laboratoryName: string;
  liquid: boolean;
  normalUnitPrice: number;
  pharmaceuticalForm: string;
  photoURL: string;
  prescription?: string;
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
}

export interface ResumeOrder {
  nroProducts: number;
  subtotal: number;
  deliveryPrice: number;
  totalPrice: number;
  discount: Discount;
}

export interface Discount {
  total: number;
  details: Details[];
}

export interface Details {
  descuentos_unitarios?: DescuentoUnitario[];
  discount?: number;
  promotionCode?: string;
  reference?: string;
  type?: string;
}

export interface DescuentoUnitario {
  cantidad: number;
  descuento_unitario: number;
  expireDate: string;
  lote_id: string;
  mg: number;
  price: number;
  sku: string;
}

export type PrescriptionType =
  | 'Presentación receta médica'
  | 'Venta directa (Sin receta)'
  | 'Venta bajo receta cheque'
  | 'Receta médica retenida';
