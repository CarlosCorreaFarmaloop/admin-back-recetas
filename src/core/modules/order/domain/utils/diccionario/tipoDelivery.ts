import { TipoDelivery } from '../../courier.interface';
import { DeliveryType } from '../../order.entity';

export const diccionarioTipoDelivery: Record<DeliveryType, TipoDelivery> = {
  '': 'SMD',
  'Envío 24 horas hábiles': 'SMD',
  'Envío Estándar (48 horas hábiles)': 'NXD',
  'Envío Express (4 horas hábiles)': 'EXP',
  'Envío en el día (24 horas hábiles)': 'SMD',
};
