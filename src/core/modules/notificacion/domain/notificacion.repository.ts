import { NotificacionEntity, Tipo } from './notificacion.entity';

export interface NotificacionRepository {
  crearNotificacion: (notificacion: NotificacionEntity) => Promise<void>;
  obtenerNotificacionesPorRangoYTipo: (desde: number, hasta: number, tipo: Tipo) => Promise<NotificacionEntity[]>;
  actualizarNotificacion: (notificacion: NotificacionEntity) => Promise<NotificacionEntity>;
}
