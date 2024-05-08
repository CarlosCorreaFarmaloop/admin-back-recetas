import {
  IGenerarSeguroComplementario,
  IGuardarSeguroComplementario,
} from 'src/interface/seguroComplementario.interface';
import { EcommerceOrderEntity } from '../../../../interface/ecommerceOrder.entity';
import {
  IActualizarOrderStatusWebhook,
  IAddOrderObservation,
  IAsignarCourier,
  IAsignarDocumentosTributarios,
  IAsignarSeguroComplementario,
  ICancelarOrder,
  IOrderBackToFlow,
  IOrigin,
  IUpdateCanalConvenio,
  IUpdateEstadoCedulaIdentidad,
  IUpdatePreparandoToDelivery,
  IUpdatePreparandoToRetiro,
  IUpdateStatusOderObservation,
  IUpdateStatusSeguroComplementario,
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
import { AdminOrderEntity } from 'src/interface/adminOrder.entity';
import { CreateCompleteOrderEntity } from 'src/interface/crearOrdenCompleta';
import { APIGatewayProxyResult } from 'aws-lambda';

export interface IOrdenUseCase {
  createOrderFromEcommerce: (order: EcommerceOrderEntity, origin: IOrigin) => Promise<void>;
  createOrderFromAdmin: (order: AdminOrderEntity, origin: IOrigin) => Promise<APIGatewayProxyResult>;
  createCompleteOrder: (order: CreateCompleteOrderEntity, origin: IOrigin) => Promise<void>;
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
  cancelarOrden: (payload: ICancelarOrder) => Promise<void>;
  updateEstadoCedulaIdentidad: (payload: IUpdateEstadoCedulaIdentidad) => Promise<void>;
  updatePreparandoToDelivery: (payload: IUpdatePreparandoToDelivery) => Promise<void>;
  preparandoToDelivery: (payload: IUpdatePreparandoToDelivery) => Promise<void>;
  preparandoToDeliverySeguroComplementario: (payload: IUpdatePreparandoToDelivery) => Promise<void>;
  updatePreparandoToRetiro: (payload: IUpdatePreparandoToRetiro) => Promise<void>;
  preparandoToRetiro: (payload: IUpdatePreparandoToRetiro) => Promise<void>;
  preparandoToRetiroSeguroComplementario: (payload: IUpdatePreparandoToRetiro) => Promise<void>;
  updateStatusSeguroComplementario: (payload: IUpdateStatusSeguroComplementario) => Promise<void>;
  addObservationToOrder: (payload: IAddOrderObservation) => Promise<void>;
  updateCanalConvenio: (payload: IUpdateCanalConvenio) => Promise<void>;
  orderSeguroComplementario: (order: OrdenEntity) => Promise<void>;

  // Documentos Tributarios
  generarDocumentosTributarios: (payload: IDocumentoTributarioEventInput) => Promise<void>;
  asignarDocumentosTributarios: (payload: IAsignarDocumentosTributarios) => Promise<void>;

  // Courier
  updateStatusCourier: (payload: IUpdateProviderStatus) => Promise<void>;
  generarCourier: (payload: ICourierEventInput) => Promise<void>;
  asignarCourier: (payload: IAsignarCourier) => Promise<void>;
  actualizarOrderStatusWebhook: (payload: IActualizarOrderStatusWebhook) => Promise<void>;

  // Seguro Complemetario
  guardarSeguroComplementario: (payload: IGuardarSeguroComplementario) => Promise<void>;
  generarSeguroComplementario: (payload: IGenerarSeguroComplementario) => Promise<void>;
  confirmarSeguroComplementario: (payload: IAsignarSeguroComplementario) => Promise<void>;
}

export interface IRespuesta {
  statusCode: number;
  body: string;
}
