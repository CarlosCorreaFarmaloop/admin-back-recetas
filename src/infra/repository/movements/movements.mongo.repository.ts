import MovementModel from '../../models/movement.model';
import { MovementEntity } from '../../../core/modules/movements/domain/movements.entity';
import { MovementRepository } from '../../../core/modules/movements/domain/movements.repositoy';

export class MovementMongoRepository implements MovementRepository {
  createMovements = async (payload: MovementEntity[]) => {
    return await MovementModel.insertMany(payload);
  };
}
