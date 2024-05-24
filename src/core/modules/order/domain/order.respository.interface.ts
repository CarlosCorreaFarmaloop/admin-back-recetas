import { IAsignarDocumentosTributarios } from '../../../../interface/event';
import {
  Billing,
  DeliveryTracking,
  EstadoCredencial,
  IBillingStatus,
  IBillingType,
  ISeguroComplementarioStatus,
  OrdenEntity,
  Payment,
} from './order.entity';

export interface IUpdateProvisionalStatusOrder
  extends Pick<OrdenEntity, 'id' | 'provisionalStatusOrder' | 'provisionalStatusOrderDate'> {}

export interface IAsignarDocumentosTributariosPayload extends IAsignarDocumentosTributarios {
  status: IBillingStatus;
}

export interface IUpdatePaymentRepository {
  id: string;
  payment: Payment;
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
  observation: {
    name: string;
    observation: string;
    responsible: string;
    date: Date;
  };
}

export interface ISeguroComplementarioPayload {
  nombreBeneficiario: string;
  id_externo: number;
  credencial_url: string;
  deducible_total: number;
  descuento_total: number;
  tipo_documento_emitir: ISeguroDocumento;
  fecha_creacion: number;
  id: string;
  productos: Producto[];
  rut: string;
  aseguradora_rut: string;
  aseguradora_nombre: string;

  billing: Billing;
  vouchers_url: string[];
}
export interface Producto {
  sku: string;
  lote: string;
  descuento_unitario: number;
  cantidad_afectada: number;
  copago_unitario: number;
  precio_pagado_por_unidad: number;
  deducible_unitario: number;
  nombre: string;
  observacion: string;
}

export type ISeguroDocumento = 'bill' | 'dispatch_note';

export interface IAsignarSeguroComplementarioPayload {
  internal_id: string;
  vouchers_url: string[];
  documents: IDocumentoSeguroComplementario[];
}

export interface IDocumentoSeguroComplementario {
  emitter: string;
  number: string;
  type: IBillingType;
  urlBilling: string;
  urlTimbre: string;
  emissionDate: Date;
  referenceDocumentId: string;
  destinatario: string;
}

export interface IUpdateEstadoCedulaIdentidadPayload {
  orderId: string;
  estado: EstadoCredencial;
  responsible: string;
}

export interface IUpdateStatusSeguroComplementarioPayload {
  id: string;
  status: ISeguroComplementarioStatus;
}

export interface IUpdateCanalConvenio {
  id: string;
  convenio: string;
  canal: string;
}

export interface IUpdateTrackingNumber {
  id: string;
  trackingNumber: string;
  responsible: string;
}
