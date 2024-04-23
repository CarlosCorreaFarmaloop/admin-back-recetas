import { ISeguroDocumento, ISeguroComplementarioProducto } from '../core/modules/order/domain/order.entity';

export interface IGenerarSeguroComplementarioEvent {
  accion: string;
  payload: IGenerarSeguroComplementario;
  origen: string;
}

export interface IGenerarSeguroComplementario {
  cliente: Cliente;
  cotizacion: Cotizacion;
  idInterno: string;
  orden: Orden;
  proveedor: string;
}

export interface Cliente {
  apellido: string;
  correoElectronico: string;
  nombre: string;
  telefono: string;
}

export interface Cotizacion {
  id: string;
  productos: CotizacionProducto[];
  tipoDocumento: string;
}

export interface CotizacionProducto {
  cantidad: number;
  copagoUnitario: number;
  deducibleUnitario: number;
  descuentoUnitario: number;
  lote: string;
  nombre: string;
  precioUnitario: number;
  sku: string;
}

export interface Orden {
  precioDelivery: number;
  productos: OrdenProducto[];
}

export interface OrdenProducto {
  cantidad: number;
  lote: string;
  nombre: string;
  precioUnitario: number;
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
}
