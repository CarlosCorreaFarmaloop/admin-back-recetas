import { DeliveryTracking, OrdenEntity, StatusOrder } from 'src/core/modules/order/domain/order.entity';

export interface IEventDetail {
  origin: IOrigin;
  body: any;
  action: IAction;
}

export type IOrigin = 'ecommerce' | 'admin' | 'courier' | 'documento-tributario';

export type IAction =
  | 'crear-order'
  | 'actualizar-estado'
  | 'actualizar-pago'
  | 'actualizar-provisional-status-order'
  | 'cargar-receta'
  | 'actualizar-estado-receta'
  | 'asignar-documento-tributario'
  | 'asignar-courier'
  | 'actualizar-order-status-webhook'
  | 'actualizar-order-observacion';

export interface IAsignacionCourier {
  id: string;
  provider: string;
  urlLabel: string;
  trackingNumber: string;
  status: 'Pendiente' | 'Cancelado' | 'Aprobado';
}

export interface ITrackingCourier {
  id: string;
  fecha: Date;
  estado: string;
  comentario: string;
  evidencias: string[];
}

export interface IRechazarOrden {
  id: string;
  responsible: string;
  reason: string;
  toPos: boolean;
}

export interface IUpdateStatusOrder {
  order: OrdenEntity;
  previousStatus: StatusOrder;
  newStatus: StatusOrder;
  responsible: string;
}

export interface IAsignarDocumentosTributarios {
  orderId: string;
  emitter: string;
  number: string;
  type: 'Boleta' | 'Factura' | 'Despacho';
  urlBilling: string;
  urlTimbre: string;
  emissionDate: Date;
  referenceDocumentId: string;
}

export interface IAsignarCourier {
  orderId: string;
  provider: string;
  urlLabel: string;
  trackingNumber: string;
  emmissionDate: number;
  deliveryTracking: DeliveryTracking;
}

export interface IActualizarOrderStatusWebhook {
  orderId: string;
  deliveryTracking: DeliveryTracking;
}
