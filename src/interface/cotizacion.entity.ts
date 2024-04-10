export interface CotizacionEntity {
  beneficiario: string;
  correo_electronico: string;
  cotizacion_id: number;
  credencial: string;
  deducible_total: number;
  descuento_total: number;
  documento: Documento;
  estado_crendencial: Estado_Crendencial;
  estado: Estado;
  fecha_creacion: number;
  id: string;
  productos: Producto[];
  rut: string;
  seguro_id: string;
  seguro_nombre: string;
  tracking: Tracking[];
}

export interface Producto {
  beneficio_unitario: number;
  cantidad: number;
  copago_unitario: number;
  deducible_unitario: number;
  lote: string;
  nombre: string;
  observacion: string;
  precio_unitario: number;
  sku: string;
}

export interface Tracking {
  estado: Estado;
  fecha: Date;
  responsable: string;
}

export type Documento = 'bill' | 'dispatch_note';
export type Estado_Crendencial = 'Pendiente' | 'Aprobado' | 'Rechazado';
export type Estado = 'Creado' | 'Credencial_Aprobada' | 'Credencial_Rechazada' | 'Confirmado';
