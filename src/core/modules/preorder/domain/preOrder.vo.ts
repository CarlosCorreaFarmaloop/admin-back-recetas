import { StockEntity } from '../../stock/domain/stock.entity';
import { Attempt, SubscriptionEntity } from '../../subscription/domain/subscription.entity';
import { PreOrderEntity, ProductOrder } from './preOrder.entity';

export class PreOrderVO {
  createMany(subscription: SubscriptionEntity): PreOrderEntity[] {
    const { customer, delivery, discount, id, products, shipment, resume } = subscription;

    const currentTime = new Date().getTime();
    const formattedProducts: ProductOrder[] = products.map(({ quantity, requiresPrescription, ...rest }) => ({
      ...rest,
      batchId: '',
      expiration: 0,
      normalUnitPrice: 0,
      requirePrescription: requiresPrescription,
      qty: quantity,
    }));

    const preOrders: PreOrderEntity[] = shipment.shipmentSchedule.map((el) => {
      return {
        id: el.orderId,
        createdAt: currentTime,
        customer,
        delivery: {
          compromiso_entrega: {
            date: el.shipmentDate,
            dateText: '',
          },
          cost: delivery.price,
          delivery_address: {
            comuna: delivery.comuna,
            dpto: delivery.homeNumber,
            firstName: delivery.fullName,
            homeType: delivery.homeType,
            isExactAddress: delivery.isExactAddress,
            lastName: '',
            latitude: delivery.latitude,
            longitude: delivery.longitude,
            phone: delivery.phone,
            placeId: delivery.placeId,
            region: delivery.region,
            streetName: delivery.streetName,
            streetNumber: delivery.streetNumber,
          },
          discount: delivery.discount,
          method: 'DELIVERY',
          pricePaid: delivery.pricePaid,
          type: 'Envío Estándar (48 horas hábiles)',
        },
        extras: {
          referrer: '',
        },
        productsOrder: formattedProducts,
        resumeOrder: {
          canal: 'WEB',
          cartId: '',
          clasification: '',
          convenio: '',
          deliveryPrice: delivery.pricePaid,
          discount,
          nroProducts: resume.numberOfProducts,
          seller: '',
          subtotal: resume.subtotal,
          totalPrice: resume.total,
        },
        status: 'Created',
        tracking: [{ date: currentTime, observation: '', responsible: 'Sistemas', status: 'Created' }],
        subscriptionId: id,
      };
    });

    return preOrders;
  }

  generateOrder(preOrder: PreOrderEntity, successAttempt: Attempt, stocks: StockEntity[]): PreOrderEntity {
    const { productsOrder, tracking } = preOrder;

    const newArr = productsOrder.map((product) => {
      const stock = stocks.find((stock) => stock.sku === product.sku);

      if (!stock) return product;

      const availableBatch = stock.batchs.find((batch) => batch.stock >= product.qty);
      if (!availableBatch) return product;

      return {
        ...product,
        batchId: availableBatch.id,
        expiration: availableBatch.expireDate,
        normalUnitPrice: availableBatch.normalPrice,
      };
    });

    const newStatus = newArr.some((product) => product.batchId === '') ? 'Pending' : 'Completed';

    return {
      ...preOrder,
      payment: {
        payment: {
          amount: successAttempt.amount,
          method: successAttempt.paymentMethod,
          originCode: successAttempt.externalCode,
          paymentDate: successAttempt.transactionDate,
          status: 'Aprobado',
          wallet: 'Transbank',
        },
      },
      productsOrder: newArr,
      status: newStatus,
      tracking: [...tracking, { date: new Date().getTime(), observation: '', responsible: 'Sistemas', status: newStatus }],
    };
  }
}
