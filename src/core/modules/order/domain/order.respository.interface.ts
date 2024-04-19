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
  emmissionDate: number;
  deliveryTracking: DeliveryTracking;
}

export interface IActualizarOrderStatusWebhookPayload {
  orderId: string;
  status: string;
  deliveryTracking: DeliveryTracking;
}
