export interface EcommerceOrderEntity {
  id: string;
  cotizacion?: string;
  customer: string;
  delivery: Delivery;
  extras: Extras;
  payment: Payment;
  productsOrder: ProductOrder[];
  resumeOrder: ResumeOrder;
  statusOrder: string;
}

interface Delivery {
  delivery_address: DeliveryAddress;
  method: string;
  type?: string;
  cost: number;
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

interface ProductOrder {
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
