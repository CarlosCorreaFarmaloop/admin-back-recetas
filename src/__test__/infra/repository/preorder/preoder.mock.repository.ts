import { PreOrderRepository } from '../../../../core/modules/preorder/domain/preOrder.repository';
import { PreOrderEntity } from '../../../../core/modules/preorder/domain/preOrder.entity';

export class PreOrderMockRepository implements PreOrderRepository {
  private preOrders: PreOrderEntity[] = [];

  async createMany(preOrders: PreOrderEntity[]) {
    const newArr = [...this.preOrders, ...preOrders];
    this.preOrders = newArr;
    return true;
  }

  async get(id: string) {
    const currentPreOrder = this.preOrders.find((el) => el.id === id);

    if (!currentPreOrder) {
      throw new Error('PreOrder not found.');
    }

    return currentPreOrder;
  }

  async update(id: string, toUpdate: Partial<PreOrderEntity>) {
    const index = this.preOrders.findIndex((el) => el.id === id);

    if (index === -1) {
      throw new Error('PreOrder not found.');
    }

    const newArr = this.preOrders;
    const currentPreOrder = { ...newArr[index], ...toUpdate };
    newArr[index] = currentPreOrder;
    this.preOrders = newArr;

    return true;
  }
}
