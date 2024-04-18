import { EcommerceOrderEntity } from 'src/interface/ecommerceOrder.entity';
import { Payment, StatusOrder } from '../domain/order.entity';
import { validateNumberType, validateStringType } from '../domain/utils/validate';
import { ICrearOrden, ICrearPartialOrden } from './interface';

export class OrdenOValue {
  completeOrderFromEcommerce = (order: EcommerceOrderEntity): ICrearOrden => {
    const nuevo_pago: Payment = {
      payment: {
        amount: validateNumberType(order?.payment?.payment.amount),
        method: validateStringType(order?.payment?.payment.method),
        originCode: validateStringType(order?.payment?.payment.originCode),
        status: validateStringType(order?.payment?.payment.status),
        wallet: validateStringType(order?.payment?.payment.wallet),
      },
    };

    return {
      id: order.id,
      billing: {
        emitter: '',
        number: '',
        type: '',
        status: '',
        urlBilling: '',
      },
      cotizacion: order.cotizacion,
      customer: order.customer,
      extras: order.extras,
      payment: nuevo_pago,
      delivery: {
        delivery_address: {
          comuna: order.delivery.delivery_address.comuna,
          dpto: order.delivery.delivery_address.dpto ?? '',
          firstName: order.delivery.delivery_address.firstName,
          homeType: order.delivery.delivery_address.homeType,
          phone: order.delivery.delivery_address.phone,
          region: order.delivery.delivery_address.region,
          streetName: order.delivery.delivery_address.streetName,
        },
        method: order.delivery.method,
        type: order.delivery.type ?? '',
        cost: order.delivery.cost,
        compromiso_entrega: order.delivery.compromiso_entrega,
        provider: {
          status: '',
          provider: '',
          orderTransport: '',
          urlLabel: '',
        },
      },
      productsOrder: order.productsOrder.map((product) => {
        return {
          batchId: product.batchId,
          modified: product.modified,
          bioequivalent: product.bioequivalent,
          cooled: product.cooled,
          ean: product.ean,
          fullName: product.fullName,
          price: product.price,
          qty: product.qty,
          sku: product.sku,
          total: product,
          expiration: product.expiration,
          shortName: '',
          laboratoryName: product.laboratoryName,
          normalUnitPrice: product.normalUnitPrice,
          originalPrice: product.originalPrice,
          prescription: {
            file: product?.prescription?.file ?? '',
            state: product.requirePrescription ? 'Pending' : '',
            stateDate: new Date().getTime(),
            validation: {
              comments: '',
              rut: '',
              responsible: '',
            },
          },
          requirePrescription: product.requirePrescription,
          liquid: product.liquid,
          pharmaceuticalForm: product.pharmaceuticalForm,
          photoURL: product.photoURL,
          prescriptionType: product.prescriptionType,
          presentation: product.presentation,
          productCategory: product.productCategory,
          productSubCategory: product.productSubCategory,
          quantityPerContainer: product.quantityPerContainer,
          recommendations: product.recommendations,
        };
      }),
      resumeOrder: {
        ...order.resumeOrder,
        convenio: '',
        discount: {
          details: order.resumeOrder.discount.details.map((detail) => {
            return {
              ...detail,
              discount: detail.discount ?? 0,
              promotionCode: detail.promotionCode ?? '',
              descuentos_unitarios: [],
              reference: detail.reference ?? '',
              type: detail.type ?? '',
            };
          }),
          total: order.resumeOrder.discount.total,
        },
      },
      statusOrder: order.statusOrder,
      provisionalStatusOrder: '',
    };
  };

  createPartialOrder = (order: EcommerceOrderEntity): ICrearPartialOrden => {
    return {
      id: order.id,
      billing: {
        emitter: '',
        number: '',
        type: '',
        status: '',
        urlBilling: '',
      },
      cotizacion: order.cotizacion,
      customer: order.customer,
      extras: order.extras,
      payment: {
        payment: {
          status: validateStringType(order?.payment?.payment.status),
          wallet: validateStringType(order?.payment?.payment.wallet),
        },
      },
      productsOrder: order.productsOrder.map((product) => {
        return {
          batchId: product.batchId,
          bioequivalent: product.bioequivalent,
          cooled: product.cooled,
          ean: product.ean,
          fullName: product.fullName,
          price: product.price,
          qty: product.qty,
          sku: product.sku,
          total: product,
          expiration: product.expiration,
          shortName: '',
          modified: product.modified,
          laboratoryName: product.laboratoryName,
          normalUnitPrice: product.normalUnitPrice,
          originalPrice: product.originalPrice,
          prescription: {
            file: product?.prescription?.file ?? '',
            state: product.requirePrescription ? 'Pending' : '',
            stateDate: new Date().getTime(),
            validation: {
              comments: '',
              rut: '',
              responsible: '',
            },
          },
          requirePrescription: product.requirePrescription,
          liquid: product.liquid,
          pharmaceuticalForm: product.pharmaceuticalForm,
          photoURL: product.photoURL,
          prescriptionType: product.prescriptionType,
          presentation: product.presentation,
          productCategory: product.productCategory,
          productSubCategory: product.productSubCategory,
          quantityPerContainer: product.quantityPerContainer,
          recommendations: product.recommendations,
        };
      }),
      resumeOrder: {
        ...order.resumeOrder,
        convenio: '',
        discount: {
          details: order.resumeOrder.discount.details.map((detail) => {
            return {
              ...detail,
              discount: detail.discount ?? 0,
              promotionCode: detail.promotionCode ?? '',
              descuentos_unitarios: [],
              reference: detail.reference ?? '',
              type: detail.type ?? '',
            };
          }),
          total: order.resumeOrder.discount.total,
        },
      },
      statusOrder: order.statusOrder,
      provisionalStatusOrder: '',
      delivery: {
        delivery_address: {
          comuna: order.delivery.delivery_address.comuna,
          dpto: order.delivery.delivery_address.dpto ?? '',
          firstName: order.delivery.delivery_address.firstName,
          homeType: order.delivery.delivery_address.homeType,
          phone: order.delivery.delivery_address.phone,
          region: order.delivery.delivery_address.region,
          streetName: order.delivery.delivery_address.streetName,
        },
        method: order.delivery.method,
        type: order.delivery.type ?? '',
        cost: order.delivery.cost,
        compromiso_entrega: order.delivery.compromiso_entrega,
        provider: {
          status: '',
          provider: '',
          orderTransport: '',
          urlLabel: '',
        },
      },
    };
  };
}

export interface ITrackingPayload {
  responsible: string;
  toStatus: StatusOrder;
}
