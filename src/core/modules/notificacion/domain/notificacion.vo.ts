import { Medio, NotificacionEntity } from './notificacion.entity';

export class NotificacionVO {
  crear(params: CrearNotificacionParams, medio: Medio): NotificacionEntity {
    const fecha_hoy = new Date().getTime();

    return {
      ...params,
      created_at: fecha_hoy,
      updated_at: fecha_hoy,
      notificaciones: [{ fecha_emision: fecha_hoy, medio }],
    };
  }

  agregarNotificacion(notificacion: NotificacionEntity, medio: Medio): NotificacionEntity {
    const fecha_hoy = new Date().getTime();

    return {
      ...notificacion,
      cantidad_notificaciones: notificacion.cantidad_notificaciones + 1,
      notificaciones: [...notificacion.notificaciones, { fecha_emision: fecha_hoy, medio }],
      updated_at: fecha_hoy,
    };
  }
}

export type CrearNotificacionParams = Omit<NotificacionEntity, 'created_at' | 'updated_at' | 'notificaciones'>;
