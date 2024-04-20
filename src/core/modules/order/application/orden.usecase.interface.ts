import { EcommerceOrderEntity } from '../../../../interface/ecommerceOrder.entity';
import {
  IActualizarOrderStatusWebhook,
  IAsignarCourier,
  IAsignarDocumentosTributarios,
  IOrderBackToFlow,
  IOrigin,
  IUpdateStatusOderObservation,
} from '.././../../../interface/event';
import { ICourierEventInput } from '../domain/courier.interface';
import { IDocumentoTributarioEventInput } from '../domain/documentos_tributarios.interface';
import { OrdenEntity, StatusOrder } from '../domain/order.entity';
import {
  IUpdateBillingStatus,
  IUpdateOrderHistory,
  IUpdateOrderTracking,
  IUpdatePaymentOrden,
  IUpdatePrescriptionState,
  IUpdateProvider,
  IUpdateProviderStatus,
  IUpdateProvisionalStatusOrder,
  IUploadPrescription,
} from './interface';

export interface IOrdenUseCase {
  createOrderFromEcommerce: (order: EcommerceOrderEntity, origin: IOrigin) => Promise<void>;
  updatePayment: (order: IUpdatePaymentOrden, origin: IOrigin) => Promise<void>;
  updateStatusOrder: (
    order: OrdenEntity,
    previousStatus: StatusOrder,
    newStatus: StatusOrder,
    responsible: string
  ) => Promise<void>;
  updateOrderTracking: (payload: IUpdateOrderTracking) => Promise<void>;
  updateOrderHistory: (payload: IUpdateOrderHistory) => Promise<void>;
  updateStatusBilling: (payload: IUpdateBillingStatus) => Promise<void>;
  updateOrderProvider: (payload: IUpdateProvider) => Promise<void>;
  updateProvisionalStatusOrder: (payload: IUpdateProvisionalStatusOrder) => Promise<void>;
  uploadPrescriptionFile: (payload: IUploadPrescription) => Promise<void>;
  updatePrescriptionState: (payload: IUpdatePrescriptionState) => Promise<void>;
  notificarCambioOrden: (orderId: string) => Promise<void>;
  updateOrderStatusObservation: (payload: IUpdateStatusOderObservation) => Promise<void>;
  regresarOrderAlFlujo: (payload: IOrderBackToFlow) => Promise<void>;

  // Documentos Tributarios
  generarDocumentosTributarios: (payload: IDocumentoTributarioEventInput) => Promise<void>;
  asignarDocumentosTributarios: (payload: IAsignarDocumentosTributarios) => Promise<void>;

  // Courier
  updateStatusCourier: (payload: IUpdateProviderStatus) => Promise<void>;
  generarCourier: (payload: ICourierEventInput) => Promise<void>;
  asignarCourier: (payload: IAsignarCourier) => Promise<void>;
  actualizarOrderStatusWebhook: (payload: IActualizarOrderStatusWebhook) => Promise<void>;
}

export interface IRespuesta {
  statusCode: number;
  body: string;
}
