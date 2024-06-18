import { StockModel } from '../../models/stock.model';
import { StockRepository } from '../../../core/modules/stock/domain/stock.repository';

export class StockMongoRepository implements StockRepository {
  async getAllBySku(skus: string[]) {
    try {
      return await StockModel.find({ sku: { $in: skus } }).lean();
    } catch (error) {
      const err = error as Error;
      console.log('General error when obtaining stocks by sku from MongoDB: ', JSON.stringify(err.message, null, 2));
      throw new Error('General error when obtaining stocks by sku from MongoDB.');
    }
  }
}
