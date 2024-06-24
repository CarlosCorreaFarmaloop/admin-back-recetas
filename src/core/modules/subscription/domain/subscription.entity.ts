export interface SubscriptionEntity {
  id: string;
  createdAt: number;
  updatedAt: number;

  customer: string;
  delivery: Delivery;
  discount: Discount;
  products: Product[];

  paymentMethods: PaymentMethod[];
  shipment: Shipment;

  nextPaymentDate: number;
  nextShipmentDate: number;
  currentPaymentId: string;
  currentShipmentId: string;
  generalStatus: GeneralStatus;
  paymentStatus: PaymentStatus;
  progressStatus: ProgressStatus;

  trackingGeneralStatus: Array<Tracking<GeneralStatus>>;
  trackingPaymentStatus: Array<Tracking<PaymentStatus>>;
  trackingProgressStatus: Array<Tracking<ProgressStatus>>;

  observations: Observation[];
  resume: Resume;
}

export interface Delivery {
  comuna: string;
  discount: number;
  fullName: string;
  homeNumber: string;
  homeType: 'Casa' | 'Departamento' | 'Parcela';
  isExactAddress: boolean;
  latitude: string;
  longitude: string;
  phone: string;
  placeId: string;
  price: number;
  pricePaid: number;
  region: string;
  streetName: string;
  streetNumber: string;
}

export interface Discount {
  details: Array<{
    discount: number;
    promotionCode: string;
    reference: string;
    type: string;
  }>;
  total: number;
}

export interface Observation {
  date: number;
  comment: string;
  responsible: string;
}

export interface PaymentMethod {
  cardNumber: string;
  cardType: string;
  externalStatus: string;
  recordDate: number;
  secret: string;
  status: number;
  token: string;
  transactionCode: string;
}

export interface Product {
  bioequivalent: boolean;
  cooled: boolean;
  discountPerUnit: number;
  ean: string;
  fullName: string;
  laboratoryName: string;
  liquid: boolean;
  pharmaceuticalForm: string;
  photoURL: string;
  prescription: Prescription;
  prescriptionType: PrescriptionType;
  presentation: string;
  price: number;
  pricePaidPerUnit: number;
  productCategory: string;
  productSubCategory: string[];
  quantity: number;
  quantityPerContainer: string;
  recommendations: string;
  requiresPrescription: boolean;
  shortName: string;
  sku: string;
}

export interface Prescription {
  file: string;
  maxNumberOfUses: number;
  numberOfUses: number;
  state: 'Pending' | 'Rejected' | 'Approved' | 'Approved_With_Comments' | '';
  validation: PrescriptionValidation;
}

export interface PrescriptionValidation {
  comments: string;
  rut: string;
  responsible: string;
}

export interface Resume {
  deliveryPrice: number;
  discount: number;
  numberOfProducts: number;
  subtotal: number;
  total: number;
  totalWithoutDiscount: number;
}

export interface Shipment {
  intervalMonth: number;
  dateOfFirstShipment: number;
  numberOfShipments: number;

  quantityShipped: number;

  shipmentSchedule: ShipmentSchedule[];
}

export interface ShipmentSchedule {
  id: string;
  paymentDate: number;
  nextPaymentDate: number;
  shipmentDate: number;

  paymentStatus: ShipmentPaymentStatus;
  userCanRetry: boolean;

  orderId: string;
  orderStatus: OrderStatus;

  numberOfAttempts: number;
  maxAttempts: number;
  numberOfUserAttempts: number;
  maxUserAttempts: number;
  attempts: Attempt[];
}

export interface Attempt {
  amount: number;
  cardNumber: string;
  externalCode: string;
  externalMessage: string;
  externalStatus: string;
  paymentMethod: string;
  responsible: AttemptResponsible;
  status: AttemptStatus;
  transactionDate: number;
}

export interface Tracking<T> {
  date: number;
  responsible: string;
  observation: string;
  status: T;
}

type PrescriptionType = 'Presentación receta médica' | 'Venta directa (Sin receta)' | 'Venta bajo receta cheque' | 'Receta médica retenida';

export type GeneralStatus = 'Created' | 'In Review' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';
export type PaymentStatus = 'Pending' | 'Paid' | 'Cancelled';
export type ProgressStatus = 'Created' | 'In Progress' | 'Cancelled' | 'Aborted' | 'Completed';

export type ShipmentPaymentStatus = 'Pending' | 'Success' | 'Failed' | 'Retrying';
export type AttemptStatus = 'Success' | 'Failed';
export type AttemptResponsible = 'Usuario' | 'Sistema';

export type OrderStatus = 'Pending' | 'Created' | 'Delivered';
