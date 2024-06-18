import { HttpCodes } from './api.response';
import { PreOrderRepository } from '../domain/preOrder.repository';
import { PreOrderVO } from '../domain/preOrder.vo';
import { IPreOrderUseCase } from './preorder.usecase.interface';
import { PreOrderEntity } from '../domain/preOrder.entity';
import { IStockUseCase } from '../../stock/application/stock.usecase.interface';
import { IEmailNotificationService } from '../../../../infra/services/emailNotificationService/interface';
import { IEventEmitter } from '../../../../infra/services/eventEmitter/interface';
import { Attempt, SubscriptionEntity } from '../../subscription/domain/subscription.entity';

export class PreOrderUseCase implements IPreOrderUseCase {
  constructor(
    private readonly preOrderRepository: PreOrderRepository,
    private readonly stockUseCase: IStockUseCase,
    private readonly emailNotificationService: IEmailNotificationService,
    private readonly eventEmitter: IEventEmitter
  ) {}

  async createManyPreOrders(subscription: SubscriptionEntity) {
    console.log('Enters createManyPreOrders(): ', JSON.stringify(subscription, null, 2));

    const newPreorders = new PreOrderVO().createMany(subscription);
    const newPreordersDb = await this.preOrderRepository.createMany(newPreorders);

    console.log('Preorders created: ', JSON.stringify(newPreordersDb, null, 2));
    return { data: true, message: 'Preorders successfully created.', status: HttpCodes.OK };
  }

  async approvePreorderPayment(id: string, successAttempt: Attempt) {
    console.log('Enters approvePreorderPayment(): ', JSON.stringify({ id, successAttempt }, null, 2));

    const preOrderDb = await this.preOrderRepository.get(id);
    const stocksDb = await this.stockUseCase.searchStock(preOrderDb.productsOrder.map((el) => el.sku));

    const orderVo = new PreOrderVO().generateOrder(preOrderDb, successAttempt, stocksDb.data);

    await this.preOrderRepository.update(preOrderDb.id, {
      productsOrder: orderVo.productsOrder,
      status: orderVo.status,
      tracking: orderVo.tracking,
    });

    const outOfStock = orderVo.status === 'Pending';
    if (outOfStock) {
      await this.emailNotificationService.sendHTMLNotification({
        html: this.generatePurchaseHTMLNotification(orderVo),
        recipients: ['matias.martinez@farmaloop.cl'],
        source: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
        subject: 'Falta de stock para emisión de Orden',
      });

      console.log(`Lack of stock to create administrator order: ${id}`);
      return { data: true, message: 'Preorder payment successfully approved.', status: HttpCodes.OK };
    }

    await this.eventEmitter.generateAdministratorOrder(orderVo);

    console.log(`Administrator order created: ${id}`);
    return { data: true, message: 'Preorder payment successfully approved.', status: HttpCodes.OK };
  }

  private generatePurchaseHTMLNotification(preOrder: PreOrderEntity): string {
    const { id, delivery, productsOrder } = preOrder;

    const deliveryDate = new Date(delivery.compromiso_entrega.date).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const productsOutOfStock = productsOrder.filter((product) => product.batchId === '');

    const html = `
      <html lang="en">
        <body>
          <h2 style="text-align: center; color: #333;">No disponemos de stock suficiente para los siguientes productos de una suscripción.</h2>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2;">Suscripción</th>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${id}</td>
            </tr>
            <tr>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2;">Compromiso de entrega</th>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${deliveryDate}</td>
            </tr>
          </table>

          <h3 h3 style="color: #333;">Productos</h3>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2;">SKU</th>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2;">Producto</th>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2;">Laboratorio</th>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2;">Cantidad</th>
            </tr>
            ${productsOutOfStock
              .map(
                (product) => `
              <tr>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${product.sku}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${product.fullName}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${product.laboratoryName}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${product.qty}</td>
              </tr>
            `
              )
              .join('')}
          </table>

        </body>
      </html>`;

    return html;
  }
}
