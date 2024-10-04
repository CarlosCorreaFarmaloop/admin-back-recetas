import { NotificacionEntity, Tipo } from '../../../core/modules/notificacion/domain/notificacion.entity';
import { NotificacionRepository } from '../../../core/modules/notificacion/domain/notificacion.repository';
import { NotificacionModel } from '../../models/notificacion.model';

export class NotificacionDynamoRepository implements NotificacionRepository {
  async crearNotificacion(notificacion: NotificacionEntity) {
    try {
      await NotificacionModel.create(notificacion);
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }

  async obtenerNotificacionesPorRangoYTipo(desde: number, hasta: number, tipo: Tipo) {
    try {
      const notificaciones = await NotificacionModel.query('tipo')
        .eq(tipo)
        .where('created_at')
        .between(desde, hasta)
        .filter('cantidad_notificaciones')
        .eq(1)
        .using('tipoGSIndex')
        .exec();

      if (notificaciones.length === 0) return [];

      return notificaciones.toJSON() as NotificacionEntity[];
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }

  async actualizarNotificacion(notificacion: NotificacionEntity) {
    try {
      const response = await NotificacionModel.update(notificacion);
      return response.toJSON() as NotificacionEntity;
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }
}
