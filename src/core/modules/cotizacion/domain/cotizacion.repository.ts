import { CotizacionEntity } from './cotizacion.entity';

export interface ICotizacionRespository {
  findCotizacion: (id: string) => Promise<CotizacionEntity>;
}
