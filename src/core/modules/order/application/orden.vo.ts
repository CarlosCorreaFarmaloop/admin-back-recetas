import { EcommerceOrderEntity } from 'src/interface/ecommerceOrder.entity';
import { OrdenEntity, Payment, StatusOrder } from '../domain/order.entity';
import { validateNumberType, validateStringType } from '../domain/utils/validate';
import { ICrearOrden, ICrearPartialOrden } from './interface';
import { GenerarBoletaPayload } from '../domain/documentos_tributarios.interface';
import { TipoPago } from '../domain/utils/diccionario/tipoPago';
import { GenerarOrdenDeCourierPayload } from '../domain/courier.interface';
import { diccionarioTipoDelivery } from '../domain/utils/diccionario/tipoDelivery';

export class OrdenOValue {
  completeOrderFromEcommerce = (order: EcommerceOrderEntity): ICrearOrden => {
    const createdDate = new Date();

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
        type: order.delivery.type,
        cost: order.delivery.cost,
        compromiso_entrega: order.delivery.compromiso_entrega,
        provider: {
          status: '',
          provider: '',
          urlLabel: '',
          trackingNumber: '',
        },
        deliveryTracking: [],
        discount: order.delivery.discount,
        pricePaid: order.delivery.pricePaid,
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
          expiration: product.expiration,
          shortName: '',
          laboratoryName: product.laboratoryName,
          normalUnitPrice: product.normalUnitPrice,
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
          discountPerUnit: product.discountPerUnit,
          pricePaidPerUnit: product.pricePaidPerUnit,
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
      statusOrder: 'CREADO',
      provisionalStatusOrder: '',
      createdAt: createdDate,
    };
  };

  createPartialOrder = (order: EcommerceOrderEntity): ICrearPartialOrden => {
    const createdDate = new Date();

    return {
      id: order.id,
      billing: {
        emitter: '',
        number: '',
        type: '',
        status: '',
        urlBilling: '',
      },
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
          expiration: product.expiration,
          shortName: '',
          laboratoryName: product.laboratoryName,
          normalUnitPrice: product.normalUnitPrice,
          prescription: {
            file: product?.prescription?.file ?? '',
            state: product.requirePrescription ? 'Pending' : '',
            stateDate: createdDate.getTime(),
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
          discountPerUnit: product.discountPerUnit,
          pricePaidPerUnit: product.pricePaidPerUnit,
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
        type: order.delivery.type,
        cost: order.delivery.cost,
        compromiso_entrega: order.delivery.compromiso_entrega,
        provider: {
          status: '',
          provider: '',
          urlLabel: '',
          trackingNumber: '',
        },
        deliveryTracking: [],
        discount: order.delivery.discount,
        pricePaid: order.delivery.discount,
      },
      statusOrder: 'CREADO',
      createdAt: createdDate,
    };
  };

  generarDocumentosTributarios = (order: OrdenEntity): GenerarBoletaPayload => {
    const payload: GenerarBoletaPayload = {
      comentario: `Orden: ${order.id} Cliente: ${order?.delivery?.delivery_address?.firstName}`,
      id_interno: order.id,
      productos: order.productsOrder.map((product) => {
        return {
          cantidad: product.qty,
          descuento: 0,
          precio_unitario: product.price,
          titulo: product.fullName,
        };
      }),
      proveedor: 'Bsale',
      tipo_documento: 'Boleta',
      tipo_pago: TipoPago[order?.payment?.payment.method ?? 'Venta Débito'] ?? 'Debito',
    };

    if (order.delivery) {
      payload.delivery = {
        precio_unitario: order.delivery.cost,
        titulo: 'Despacho',
      };
    }

    return payload;
  };

  generarCourier = (order: OrdenEntity): GenerarOrdenDeCourierPayload => {
    return {
      courier: 'propio3',
      direccion_origen: {
        calle: 'Av. Príncipe de Gales',
        comuna: 'La Reina',
        numero_calle: '6273',
        pais: 'Chile',
        referencias: '',
        region: 'Región Metropolitana',
      },
      direccion: {
        calle: order.delivery.delivery_address.streetName ?? '',
        comuna: order.delivery.delivery_address.comuna,
        numero_calle: '',
        pais: 'Chile',
        referencias: `${order.delivery.delivery_address.homeType} ${order.delivery.delivery_address.dpto}`,
        region: order.delivery.delivery_address.region,
      },
      id_interno: order.id,
      notas: '',
      tipo_delivery: diccionarioTipoDelivery[order.delivery.type] ?? 'SMD',
      usuario: {
        apellido: order.delivery.delivery_address.firstName,
        correo_electronico: order.customer,
        nombre: order.delivery.delivery_address.firstName,
        telefono: order.delivery.delivery_address.phone,
      },
    };
  };
}

export interface ITrackingPayload {
  responsible: string;
  toStatus: StatusOrder;
}
