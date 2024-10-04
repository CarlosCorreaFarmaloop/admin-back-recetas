export interface ICourierService {
  obtenerEnvios: (params: ObtenerEnviosParams) => Promise<Envio[]>;
}

export interface ObtenerEnviosParams {
  comuna: string;
  region: string;
  email: string;
}

export interface Envio {
  aplicar_descuento: number;
  fecha_entrega: number;
  precio: number;
  tipo: Tipo;
}

export type Tipo = 'Envío Estándar (48 horas hábiles)' | 'Envío Express (4 horas hábiles)' | 'Envío 24 horas hábiles';
