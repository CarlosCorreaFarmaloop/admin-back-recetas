import {
  ISeguroDocumento,
  ISeguroComplementarioProducto,
  EstadoCredencial,
} from '../core/modules/order/domain/order.entity';

export interface IGenerarSeguroComplementarioEvent {
  accion: string;
  payload: IGenerarSeguroComplementario;
  origen: string;
}

export interface IGenerarSeguroComplementario {
  cliente: Cliente;
  cotizacion: Cotizacion;
  id_interno: string;
  orden: Orden;
  proveedor: string;
}

export interface Cliente {
  apellido: string;
  correo_electronico: string;
  nombre: string;
  telefono: string;
}

export interface Cotizacion {
  id: string;
  productos: CotizacionProducto[];
  tipo_documento: string;
}

export interface CotizacionProducto {
  cantidad: number;
  copago_unitario: number;
  deducible_unitario: number;
  descuento_unitario: number;
  lote: string;
  nombre: string;
  precio_unitario: number;
  sku: string;
}

export interface Orden {
  precio_delivery: number;
  productos: OrdenProducto[];
}

export interface OrdenProducto {
  cantidad: number;
  lote: string;
  nombre: string;
  precio_unitario: number;
  sku: string;
}

export interface IGuardarSeguroComplementario {
  orderId: string;
  nombreBeneficiario: string;
  id_externo: number;
  id: string;
  credencial_url: string;
  deducible_total: number;
  descuento_total: number;
  tipo_documento_emitir: ISeguroDocumento;
  fecha_creacion: number;
  productos: ISeguroComplementarioProducto[];
  rut: string;
  aseguradora_rut: string;
  aseguradora_nombre: string;
  estado_credencial: EstadoCredencial;
}
