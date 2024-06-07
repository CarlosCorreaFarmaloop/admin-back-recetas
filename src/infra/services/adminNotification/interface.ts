import { SubscriptionEntity, ShipmentSchedule } from '../../../core/modules/subscription/domain/subscription.entity';

export interface IAdminNotificationService {
  notifyOrderSubscription: (
    newId: string,
    subscription: SubscriptionEntity,
    shipmentSchedule: ShipmentSchedule
  ) => Promise<boolean>;
}

export interface SubscriptionOrder {
  customer: string;
  delivery: Delivery;
  extras: {
    referrer: string;
  };
  id: string;
  payment: {
    payment: {
      amount: number;
      method: string;
      originCode: string;
      paymentDate: number;
      status: 'Aprobado';
      wallet: 'Transbank';
    };
  };
  productsOrder: ProductOrder[];
  resumeOrder: {
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
  };
}

interface Delivery {
  compromiso_entrega: {
    date: number;
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

interface ProductOrder {
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
  prescription: {
    file: string;
  };
  prescriptionType:
    | 'Presentación receta médica'
    | 'Venta directa (Sin receta)'
    | 'Venta bajo receta cheque'
    | 'Receta médica retenida';
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

interface Discount {
  details: Array<{
    discount: number;
    promotionCode: string;
    reference: string;
    type: string;
  }>;
  total: number;
}
