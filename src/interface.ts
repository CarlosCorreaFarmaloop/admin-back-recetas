export interface OrderFromEcommerce {
  id: string;
  cotizacion?: string;
  customer: string;
  productsOrder: ProductOrder[];
  delivery: Delivery;
  payment: Payment;
  resumeOrder: ResumeOrder;
  statusOrder: string;
}

export interface ProductOrder {
  sku: string;
  batchId: string;
  qty: number;
  normalUnitPrice: number;
  price: number;
  requirePrescription: boolean;
  prescription?: string;
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
