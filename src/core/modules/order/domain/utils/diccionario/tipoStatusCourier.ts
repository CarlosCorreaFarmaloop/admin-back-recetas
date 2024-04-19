import { EstadoCourierTracking } from '../../courier.interface';
import { StatusOrder } from '../../order.entity';

export const diccionarioStatusCourier: Record<EstadoCourierTracking, StatusOrder | null> = {
  Creado: 'ASIGNAR_A_DELIVERY',
  Confirmado: null,
  Recogido: null,
  'En delivery': 'EN_DELIVERY',
  Entregado: 'ENTREGADO',
  Cancelado: 'EN_OBSERVACION',
  Observación: 'EN_OBSERVACION',
};
