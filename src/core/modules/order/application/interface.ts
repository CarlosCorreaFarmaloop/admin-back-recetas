import {
  OrdenEntity,
  StatusOrder,
  IHistoryType,
  DeliveryProviderStatus,
  IBillingStatus,
  ProductOrder,
  StatePrescription,
} from '../domain/order.entity';

export type ICrearOrden = Pick<
  OrdenEntity,
  | 'id'
  | 'seguroComplementario'
  | 'payment'
  | 'customer'
  | 'extras'
  | 'productsOrder'
  | 'resumeOrder'
  | 'statusOrder'
  | 'delivery'
  | 'billing'
  | 'provisionalStatusOrder'
  | 'createdAt'
>;

export type ICrearPartialOrden = Pick<
  OrdenEntity,
  | 'id'
  | 'seguroComplementario'
  | 'customer'
  | 'extras'
  | 'productsOrder'
  | 'resumeOrder'
  | 'statusOrder'
  | 'delivery'
  | 'payment'
  | 'billing'
  | 'provisionalStatusOrder'
  | 'createdAt'
>;

export type IUpdatePaymentOrden = Pick<OrdenEntity, 'id' | 'payment'>;

export interface IUpdateOrderTracking extends Pick<OrdenEntity, 'id'> {
  statusOrder: StatusOrder;
  responsible: string;
  reason: string;
}

export interface IUpdateOrderHistory extends Pick<OrdenEntity, 'id'> {
  responsible: string;
  type: IHistoryType;
  changeFrom: string;
  changeTo: string;
  aditionalInfo?: {
    product_sku: string;
    comments: string;
  };
}

export interface IUpdateProviderStatus extends Pick<OrdenEntity, 'id'> {
  status: DeliveryProviderStatus;
  statusDate: Date;
}

export interface IUpdateBillingStatus extends Pick<OrdenEntity, 'id'> {
  status: IBillingStatus;
  statusDate: Date;
}

export interface IUpdateProvider extends Pick<OrdenEntity, 'id'> {
  providerName: string;
  serviceId?: string;
}

export interface IUpdateProvisionalStatusOrder extends Pick<OrdenEntity, 'id' | 'provisionalStatusOrder'> {}

export interface IUploadPrescription extends Pick<OrdenEntity, 'id'> {
  productOrder: IUploadPrescriptionProduct;
}

export interface IUploadPrescriptionProduct extends Pick<ProductOrder, 'sku' | 'batchId'> {
  prescription: Pick<ProductOrder['prescription'], 'file' | 'validation'>;
}

export interface IUpdatePrescriptionState extends Pick<OrdenEntity, 'id'> {
  productOrder: IUpdatePrescriptionStateProduct;
}

export interface IUpdatePrescriptionStateProduct extends Pick<ProductOrder, 'sku' | 'batchId'> {
  prescription: Pick<ProductOrder['prescription'], 'state' | 'validation'>;
  previousState: StatePrescription;
}

export interface INotificarCambioOrden {
  orden: {
    id: string;
  };
  type: INotificarCambioOrdenType;
  connectionId: string;
}

export type INotificarCambioOrdenType = 'ORDEN_ACTUALIZADA';

export interface IAddObservation {
  id: string;
  observation: {
    observation: string;
    responsible: string;
    name: string;
    date: Date;
  };
}

export interface ICancelOrder {
  id: string;
  responsible: string;
  reason: string;
}
