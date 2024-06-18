import { StockEntity } from '../domain/stock.entity';
import { Respuesta } from './api.response';

export interface IStockUseCase {
  searchStock: (skus: string[]) => Promise<Respuesta<StockEntity[]>>;
}
