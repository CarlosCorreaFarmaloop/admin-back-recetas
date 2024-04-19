export interface ICourierEventInput {
  accion: Accion;
  payload: GenerarOrdenDeCourierPayload;
  origen: string;
}

export interface GenerarOrdenDeCourierPayload {
  courier: Couriers;
  direccion_origen: Direccion;
  direccion: Direccion;
  id_interno: string;
  notas: string;
  tipo_delivery: TipoDelivery;
  usuario: Usuario;
}
export interface Direccion {
  calle: string;
  comuna: string;
  numero_calle: string;
  pais: string;
  referencias: string;
  region: string;
}
export interface Usuario {
  apellido: string;
  correo_electronico: string;
  nombre: string;
  telefono: string;
}
export type Couriers = 'propio3';

export type TipoDelivery = 'EXP' | 'SMD' | 'NXD';

export interface OrdenDeCourierResponse {
  courier: Couriers;
  etiqueta: string;
  id_interno: string;
  numero_seguimiento: string;
}

export type Accion = 'generar-orden-de-courier';

export type EstadoCourierTracking =
  | 'Creado'
  | 'Confirmado'
  | 'Recogido'
  | 'En delivery'
  | 'Entregado'
  | 'Cancelado'
  | 'Observación';
