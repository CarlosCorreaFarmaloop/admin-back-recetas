import { DeliveryType, OrdenEntity } from '../domain/order.entity';

export class CourierValueObject {
  crearCourier = (order: OrdenEntity): CourierEventPayload => {
    return {
      courier: order.delivery.provider.provider,
      direccion: {
        calle: order.delivery.delivery_address.streetName,
        comuna: order.delivery.delivery_address.comuna,
        numero_calle: order.delivery.delivery_address.streetNumber,
        numero_domicilio: order.delivery.delivery_address.dpto,
        pais: 'Chile',
        referencias: '',
        region: order.delivery.delivery_address.region,
        tipo_domicilio: order.delivery.delivery_address.homeType,
      },
      id_interno: order.id,
      tipo_delivery: this.getTipoDelivery(order.delivery.type),
      usuario: {
        correo_electronico: order.billing.invoiceCustomer?.email ?? '',
        telefono: order.billing.invoiceCustomer?.phone ?? '',
        nombre: order.billing.invoiceCustomer?.name ?? '',
        apellido: '',
      },
      notas: '',
    };
  };

  private readonly getTipoDelivery = (orderDeliveryType: DeliveryType): TipoDelivery => {
    switch (orderDeliveryType) {
      case 'Envío Express (4 horas hábiles)':
        return 'EXP';
      case 'Envío en el día (24 horas hábiles)':
        return 'SMD';

      case 'Envío 24 horas hábiles':
        return 'SMD';

      case 'Envío Estándar (48 horas hábiles)':
        return 'NXD';
    }
  };
}

export interface CourierEventPayload {
  courier: string;
  direccion: Direccion;
  id_interno: string;
  tipo_delivery: TipoDelivery;
  usuario: Usuario;
  notas: string;
}

export interface Direccion {
  calle: string;
  comuna: string;
  numero_calle: string;
  numero_domicilio: string;
  pais: string;
  referencias: string;
  region: string;
  tipo_domicilio: string;
}

export interface Usuario {
  correo_electronico: string;
  telefono: string;
  nombre: string;
  apellido: string;
}

export type TipoDelivery = 'EXP' | 'SMD' | 'NXD';
