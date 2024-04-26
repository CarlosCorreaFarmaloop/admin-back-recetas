import { TipoDelivery } from '../../courier.interface';

export const diccionarioTipoDelivery: Record<string, TipoDelivery> = {
  'Envío 24 horas hábiles': 'SMD',
  'Envío Estándar (48 horas hábiles)': 'NXD',
  'Envío Express (4 horas hábiles)': 'EXP',
  'Envío en el día (24 horas hábiles)': 'SMD',
};

export const getTipoDelivery = (tipoDelivery: string): TipoDelivery => {
  if (tipoDelivery === '') throw new Error('Tipo de delivery no puede ser vacío');

  return diccionarioTipoDelivery[tipoDelivery];
};
