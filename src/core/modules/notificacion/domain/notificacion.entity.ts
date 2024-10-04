export interface NotificacionEntity {
  cantidad_notificaciones: number;
  carrito_id: string;
  correo_electronico: string;
  created_at: number;
  nombre: string;
  notificaciones: Notificacion[];
  telefono: string;
  tipo: Tipo;
  updated_at: number;
}

export interface Notificacion {
  fecha_emision: number;
  medio: Medio;
}

export type Medio = 'WhatsApp' | 'Correo';
export type Tipo = 'Recompra';
