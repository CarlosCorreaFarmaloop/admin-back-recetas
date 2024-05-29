import { DeliveryAddress } from '../order.entity';

export const generateFullAdress = (delivery_address: DeliveryAddress) => {
  const hasDpto = delivery_address.dpto ? `${delivery_address.homeType}: ${delivery_address.dpto} ` : '';

  const streetNumber = ` ${delivery_address.streetNumber}` ?? '';

  return (
    `${delivery_address.streetName}${streetNumber}, ${hasDpto}${delivery_address.comuna}, ${delivery_address.region}` ??
    ''
  );
};
