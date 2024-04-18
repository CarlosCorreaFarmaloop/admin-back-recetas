import { EcommerceOrderEntity } from '../../../../interface/ecommerceOrder.entity';
import { IAsignarDocumentosTributarios, IOrigin } from '.././../../../interface/event';
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
  updateAsignarCourier: (payload: IUpdateProviderStatus) => Promise<void>;
  updateStatusBilling: (payload: IUpdateBillingStatus) => Promise<void>;
  updateOrderProvider: (payload: IUpdateProvider) => Promise<void>;
  updateProvisionalStatusOrder: (payload: IUpdateProvisionalStatusOrder) => Promise<void>;
  uploadPrescriptionFile: (payload: IUploadPrescription) => Promise<void>;
  updatePrescriptionState: (payload: IUpdatePrescriptionState) => Promise<void>;
  notificarCambioOrden: (orderId: string) => Promise<void>;
  generarDocumentosTributarios: (payload: IDocumentoTributarioEventInput) => Promise<void>;
  asignarDocumentosTributarios: (payload: IAsignarDocumentosTributarios) => Promise<void>;
}

export interface IRespuesta {
  statusCode: number;
  body: string;
}
