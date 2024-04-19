import { IAsignarDocumentosTributarios } from '../../../../interface/event';
import { IBillingStatus, OrdenEntity } from './order.entity';

export interface IUpdateProvisionalStatusOrder
  extends Pick<OrdenEntity, 'id' | 'provisionalStatusOrder' | 'provisionalStatusOrderDate'> {}

export interface IAsignarDocumentosTributariosPayload extends IAsignarDocumentosTributarios {
  status: IBillingStatus
}