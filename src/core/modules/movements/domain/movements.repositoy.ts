import { MovementEntity } from './movements.entity';

export interface MovementRepository {
  createMovements: (payload: MovementEntity[]) => Promise<MovementEntity[]>;
}
