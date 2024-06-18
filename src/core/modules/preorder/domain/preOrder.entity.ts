export interface PreOrderEntity {
  id: string;
  createdAt: number;
  customer: string;
  delivery: Delivery;
  extras: Extras;
  payment?: Payment;
  productsOrder: ProductOrder[];
  resumeOrder: ResumeOrder;
  status: Status;
  subscriptionId: string;
  tracking: Array<Tracking<Status>>;
}

interface Delivery {
  compromiso_entrega: {
    date: number;
    dateText: string;
  };
  cost: number;
  delivery_address: {
    comuna: string;
    dpto: string;
    firstName: string;
    homeType: string;
    isExactAddress: boolean;
    lastName: string;
    latitude: string;
    longitude: string;
    phone: string;
    placeId: string;
    region: string;
    streetName: string;
    streetNumber: string;
  };
  discount: number;
  method: 'DELIVERY';
  pricePaid: number;
  type: 'Envío Estándar (48 horas hábiles)';
}

interface Extras {
  referrer: string;
}

export interface Payment {
  payment: {
    amount: number;
    method: string;
    originCode: string;
    paymentDate: number;
    status: 'Aprobado';
    wallet: 'Transbank';
  };
}

export interface ProductOrder {
  batchId: string;
  bioequivalent: boolean;
  cooled: boolean;
  discountPerUnit: number;
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
  pricePaidPerUnit: number;
  productCategory: string;
  productSubCategory: string[];
  qty: number;
  quantityPerContainer: string;
  recommendations: string;
  requirePrescription: boolean;
  shortName: string;
  sku: string;
}

interface Prescription {
  file: string;
  maxNumberOfUses: number;
  numberOfUses: number;
  state: 'Pending' | 'Rejected' | 'Approved' | 'Approved_With_Comments' | '';
  validation: {
    comments: string;
    rut: string;
    responsible: string;
  };
}

interface ResumeOrder {
  canal: string;
  cartId: string;
  clasification: string;
  convenio: string;
  deliveryPrice: number;
  discount: Discount;
  nroProducts: number;
  seller: string;
  subtotal: number;
  totalPrice: number;
}

interface Discount {
  details: Array<{
    discount: number;
    promotionCode: string;
    reference: string;
    type: string;
  }>;
  total: number;
}

interface Tracking<T> {
  date: number;
  responsible: string;
  observation: string;
  status: T;
}

type PrescriptionType = 'Presentación receta médica' | 'Venta directa (Sin receta)' | 'Venta bajo receta cheque' | 'Receta médica retenida';

type Status = 'Created' | 'Pending' | 'Completed' | 'Cancelled';
