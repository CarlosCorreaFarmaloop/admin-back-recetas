import * as dynamoose from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';

import { NotificacionEntity, Tipo, Notificacion } from '../../core/modules/notificacion/domain/notificacion.entity';

class NotificacionClass extends Item implements NotificacionEntity {
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

export const NotificacionModel = dynamoose.model<NotificacionClass>(
  `CL_FARMALOOP_ADMINISTRADOR_NOTIFICACIONES_${process.env.ENV as string}`,
  new dynamoose.Schema({
    cantidad_notificaciones: Number,
    carrito_id: String,
    correo_electronico: { type: String, hashKey: true },
    created_at: { type: Number, rangeKey: true },
    nombre: String,
    notificaciones: { type: Array, schema: [{ type: Object, schema: { fecha_emision: Number, medio: String } }] },
    telefono: String,
    tipo: { type: String, index: { name: 'tipoGSIndex', rangeKey: 'created_at' } },
    updated_at: Number,
  }),
  { throughput: 'ON_DEMAND' }
);
