import { IAsignarDocumentosTributarios } from '../../../../interface/event';
import { DeliveryTracking, IBillingStatus, OrdenEntity } from './order.entity';

export interface IUpdateProvisionalStatusOrder
  extends Pick<OrdenEntity, 'id' | 'provisionalStatusOrder' | 'provisionalStatusOrderDate'> {}

export interface IAsignarDocumentosTributariosPayload extends IAsignarDocumentosTributarios {
  status: IBillingStatus;
}

export interface IAsignarCourierPayload {
  orderId: string;
  provider: string;
  urlLabel: string;
  trackingNumber: string;
  emissionDate: number;
  deliveryTracking: DeliveryTracking;
}

export interface IActualizarOrderStatusWebhookPayload {
  orderId: string;
  deliveryTracking: DeliveryTracking;
}

export interface IAddOrderdObservation {
  id: string;
  observation: string;
}
