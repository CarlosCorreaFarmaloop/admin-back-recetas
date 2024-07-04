import { PreOrderEntity } from './preOrder.entity';

export interface PreOrderRepository {
  createMany: (preOrders: PreOrderEntity[]) => Promise<boolean>;
  get: (id: string) => Promise<PreOrderEntity>;
  getPendingPreOrdersBySku: (skus: string[]) => Promise<PreOrderEntity[]>;
  update: (id: string, toUpdate: Partial<PreOrderEntity>) => Promise<PreOrderEntity>;
}
