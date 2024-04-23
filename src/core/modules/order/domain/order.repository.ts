import { IGuardarSeguroComplementario } from 'src/interface/seguroComplementario.interface';
import {
  ICrearOrden,
  ICrearPartialOrden,
  IUpdateBillingStatus,
  IUpdatePaymentOrden,
  IUpdatePrescriptionState,
  IUpdateProvider,
  IUpdateProviderStatus,
  IUploadPrescription,
} from '../application/interface';
import { IOrderHistory, OrdenEntity, StatusOrder, Tracking } from './order.entity';
import {
  IActualizarOrderStatusWebhookPayload,
  IAddOrderdObservation,
  IAsignarCourierPayload,
  IAsignarDocumentosTributariosPayload,
  IAsignarSeguroComplementarioPayload,
  IUpdateEstadoCedulaIdentidadPayload,
  IUpdateProvisionalStatusOrder,
} from './order.respository.interface';

export interface IOrdenRepository {
  createOrderFromEcommerce: (payload: ICrearOrden) => Promise<OrdenEntity>;
  createPartialOrder: (payload: ICrearPartialOrden) => Promise<OrdenEntity>;
  updatePayment: (payload: IUpdatePaymentOrden) => Promise<OrdenEntity>;
  findOrderById: (id: string) => Promise<OrdenEntity | null | undefined>;
  updateOrderStatus: (id: string, status: StatusOrder) => Promise<OrdenEntity>;
  updateOrderTracking: (id: string, payload: Tracking) => Promise<OrdenEntity>;
  updateOrderHistory: (id: string, payload: IOrderHistory) => Promise<OrdenEntity>;
  updateOrderProviderStatus: (id: string, providerStatus: IUpdateProviderStatus) => Promise<OrdenEntity | null>;
  updateOrderBillingStatus: (id: string, payload: IUpdateBillingStatus) => Promise<OrdenEntity | null>;
  updateOrderProvider: (id: string, payload: IUpdateProvider) => Promise<OrdenEntity>;
  updateProvisionalStatusOrder: (payload: IUpdateProvisionalStatusOrder) => Promise<OrdenEntity | null>;
  uploadPrescriptionFile: (payload: IUploadPrescription) => Promise<OrdenEntity>;
  updatePrescriptionState: (payload: IUpdatePrescriptionState) => Promise<OrdenEntity>;
  updateEstadoCedulaIdentidad: (payload: IUpdateEstadoCedulaIdentidadPayload) => Promise<OrdenEntity>;
  addOrderObservation: (payload: IAddOrderdObservation) => Promise<OrdenEntity>;

  asignarDocumentosTributarios: (payload: IAsignarDocumentosTributariosPayload) => Promise<OrdenEntity>;

  asignarCourier: (payload: IAsignarCourierPayload) => Promise<OrdenEntity>;
  actualizarOrderDeliveryTracking: (payload: IActualizarOrderStatusWebhookPayload) => Promise<OrdenEntity>;

  guardarSeguroComplementario: (payload: IGuardarSeguroComplementario) => Promise<OrdenEntity | null>;
  confirmarSeguroComplementario: (payload: IAsignarSeguroComplementarioPayload) => Promise<OrdenEntity | null>;
}
