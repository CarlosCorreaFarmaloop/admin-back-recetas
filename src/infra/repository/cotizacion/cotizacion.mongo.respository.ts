import CotizacionModel from '../../models/cotizacion.model';
import { ICotizacionRespository } from '../../../core/modules/cotizacion/domain/cotizacion.repository';

export class CotizacionRepository implements ICotizacionRespository {
  findCotizacion = async (id: string) => {
    return await CotizacionModel.findOne({
      id,
    })
      .then((res) => res?.toObject())
      .catch((err) => err);
  };
}
