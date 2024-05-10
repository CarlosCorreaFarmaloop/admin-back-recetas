import { EcommerceOrderEntity } from 'src/interface/ecommerceOrder.entity';
import { OrdenEntity, Payment, ProductOrder, StatusOrder, Wallet, Status } from '../domain/order.entity';
import { validateNumberType, validateStringType } from '../domain/utils/validate';
import { IAddObservation, ICrearOrden, ICrearPartialOrden, IUpdatePaymentOrden } from './interface';
import { GenerarBoletaPayload } from '../domain/documentos_tributarios.interface';
import { TipoPago } from '../domain/utils/diccionario/tipoPago';
import { GenerarOrdenDeCourierPayload } from '../domain/courier.interface';
import { getTipoDelivery } from '../domain/utils/diccionario/tipoDelivery';
import { IAsignarCourier, IUpdateStatusOderObservation } from 'src/interface/event';
import {
  IGenerarSeguroComplementario,
  IGuardarSeguroComplementario,
} from 'src/interface/seguroComplementario.interface';
import { AdminOrderEntity } from 'src/interface/adminOrder.entity';
import { CreateCompleteOrderEntity } from 'src/interface/crearOrdenCompleta';
import { generateInitialStatusOrder } from '../domain/utils/generateInitialStatusOrder';

export class OrdenOValue {
  completeOrderFromEcommerce = (order: EcommerceOrderEntity): ICrearOrden => {
    const createdDate = new Date();

    const nuevo_pago: Payment = {
      amount: validateNumberType(order?.payment?.payment.amount),
      method: validateStringType(order?.payment?.payment.method),
      originCode: validateStringType(order?.payment?.payment.originCode),
      status: validateStringType(order?.payment?.payment.status) as Status,
      wallet: validateStringType(order?.payment?.payment.wallet) as Wallet,
      paymentDate: order?.payment?.payment.paymentDate,
    };

    const ordenCompleta: ICrearOrden = {
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
      payments: [nuevo_pago],
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
          note: '',
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
          liquid: product?.liquid ?? false,
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
        clasification: order?.resumeOrder?.clasification ?? '',
        nroProducts: order.productsOrder.length,
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

    return ordenCompleta;
  };

  completeOrderFromAdmin = (order: AdminOrderEntity): ICrearOrden => {
    const createdDate = new Date();

    const products: ProductOrder[] = order.productsOrder.map((product) => {
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
        liquid: product?.liquid ?? false,
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
    });

    const ordenCompleta: ICrearOrden = {
      id: order.id,
      billing: {
        emitter: '',
        number: '',
        type: order.billing?.type ?? '',
        status: '',
        urlBilling: '',
      },
      customer: order.customer,
      extras: order.extras,
      payments: order.payments.map((payment) => {
        return {
          amount: payment.amount,
          method: payment.method,
          originCode: payment.originCode,
          status: payment.status,
          wallet: payment.wallet,
          paymentDate: payment.paymentDate,
        };
      }),
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
          note: '',
        },
        deliveryTracking: [],
        discount: order.delivery.discount,
        pricePaid: order.delivery.pricePaid,
      },
      productsOrder: products,
      resumeOrder: {
        ...order.resumeOrder,
        clasification: order?.resumeOrder?.clasification ?? '',
        nroProducts: order.productsOrder.length,
        convenio: order.resumeOrder.convenio,
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
      statusOrder: generateInitialStatusOrder(products),
      provisionalStatusOrder: '',
      createdAt: createdDate,
    };

    return ordenCompleta;
  };

  createCompleteOrder = (order: CreateCompleteOrderEntity): ICrearOrden => {
    const createdDate = new Date();

    const products: ProductOrder[] = order.productsOrder.map((product) => {
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
        liquid: product?.liquid ?? false,
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
    });

    const ordenCompleta: ICrearOrden = {
      id: order.id,
      billing: {
        emitter: '',
        number: '',
        type: order.billing?.type ?? '',
        status: '',
        urlBilling: '',
      },
      customer: order.customer,
      extras: order.extras,
      payments: order.payments.map((payment) => {
        return {
          amount: payment.amount,
          method: payment.method,
          originCode: payment.originCode,
          status: payment.status,
          wallet: payment.wallet,
          paymentDate: payment.paymentDate,
        };
      }),
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
          note: '',
        },
        deliveryTracking: [],
        discount: order.delivery.discount,
        pricePaid: order.delivery.pricePaid,
      },
      productsOrder: products,
      resumeOrder: {
        ...order.resumeOrder,
        clasification: order?.resumeOrder?.clasification ?? '',
        nroProducts: order.productsOrder.length,
        convenio: order.resumeOrder.convenio,
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
      statusOrder: generateInitialStatusOrder(products),
      provisionalStatusOrder: '',
      createdAt: createdDate,
    };

    return ordenCompleta;
  };

  createPartialOrder = (order: EcommerceOrderEntity): ICrearPartialOrden => {
    const createdDate = new Date();

    const ordenParcial: ICrearPartialOrden = {
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
      payments: [
        {
          amount: 0,
          method: '',
          originCode: '',
          paymentDate: 0,
          status: validateStringType(order?.payment?.payment.status) as Status,
          wallet: validateStringType(order?.payment?.payment.wallet) as Wallet,
        },
      ],
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
          liquid: product?.liquid ?? false,
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
        clasification: order?.resumeOrder?.clasification ?? '',
        convenio: order.resumeOrder.convenio ?? '',
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
          note: '',
        },
        deliveryTracking: [],
        discount: order.delivery.discount,
        pricePaid: order.delivery.pricePaid,
      },
      statusOrder: 'CREADO',
      createdAt: createdDate,
    };

    return ordenParcial;
  };

  updatePayment = (payload: IUpdatePaymentOrden): IUpdatePaymentVO => {
    return {
      id: payload.id,
      payment: {
        amount: payload.payment.payment.amount ?? 0,
        method: payload.payment.payment.method ?? '',
        originCode: payload.payment.payment.originCode ?? '',
        status: payload.payment.payment.status,
        wallet: payload.payment.payment.wallet,
        paymentDate: payload.payment.payment.paymentDate ?? 0,
      },
    };
  };

  regresarOrderToFlow = (order: OrdenEntity): OrdenEntity | null => {
    console.log('---- Orden a revisar ----', JSON.stringify(order, null, 2));

    // Verificar si algun Producto requirePrescription y no tiene prescription.file
    const requiereRecetaPeroNoEstaCargada = order.productsOrder.some(
      (producto) => producto.requirePrescription && producto.prescription.file === ''
    );

    if (requiereRecetaPeroNoEstaCargada) {
      return {
        ...order,
        statusOrder: 'OBSERVACIONES_RECETAS',
      };
    }

    // Verificar si algun Producto requirePrescription y no tiene prescription.state aprobado

    const requiereRecetaPeroNoEstaAprobada = order.productsOrder.some(
      (producto) =>
        producto.requirePrescription &&
        producto.prescription.state !== 'Approved' &&
        producto.prescription.state !== 'Approved_With_Comments'
    );

    if (requiereRecetaPeroNoEstaAprobada) {
      return {
        ...order,
        statusOrder: 'VALIDANDO_RECETA',
      };
    }

    const ningunProductoRequiereReceta = order.productsOrder.every(
      (producto) =>
        !producto.requirePrescription ||
        (producto.requirePrescription &&
          (producto.prescription.state === 'Approved' || producto.prescription.state === 'Approved_With_Comments'))
    );

    if (ningunProductoRequiereReceta) {
      return {
        ...order,
        statusOrder: 'RECETA_VALIDADA',
      };
    }

    return null;
  };

  agregarObservacion = (payload: IUpdateStatusOderObservation): IAddObservation => {
    return {
      id: payload.id,
      observation: {
        observation: payload.observation,
        responsible: payload.responsible,
        name: payload.name,
        date: new Date(),
      },
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
          precio_unitario: product.pricePaidPerUnit,
          titulo: product.fullName,
        };
      }),
      proveedor: 'Bsale',
      tipo_documento: order.billing.type !== '' ? order.billing.type : 'Boleta',
      tipo_pago: TipoPago[order.payments.length > 0 ? order?.payments[0].method : 'Venta Débito'] ?? 'Debito',
    };

    if (order.delivery.pricePaid > 0) {
      payload.delivery = {
        precio_unitario: order.delivery.pricePaid,
        titulo: 'Envío',
      };
    }

    return payload;
  };

  generarCourier = (order: OrdenEntity): GenerarOrdenDeCourierPayload => {
    return {
      courier: order.delivery.provider.provider,
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
      notas: order.delivery.provider.note ?? '',
      tipo_delivery: getTipoDelivery(order.delivery.provider.service_id ?? ''),
      usuario: {
        apellido: '',
        correo_electronico: order.customer,
        nombre: order.delivery.delivery_address.firstName,
        telefono: order.delivery.delivery_address.phone,
      },
    };
  };

  guardarSeguroComplementario = (order: EcommerceOrderEntity): IGuardarSeguroComplementario => {
    return {
      orderId: order.id,
      nombreBeneficiario: order?.seguroComplementario?.nombreBeneficiario ?? '',
      id_externo: order?.seguroComplementario?.id_externo ?? 0,
      id: order.seguroComplementario?.id ?? '',
      estado_credencial: 'Pendiente',
      credencial_url: order?.seguroComplementario?.credencial_url ?? '',
      deducible_total: order?.seguroComplementario?.deducible_total ?? 0,
      descuento_total: order?.seguroComplementario?.descuento_total ?? 0,
      tipo_documento_emitir: order?.seguroComplementario?.tipo_documento_emitir ?? 'bill',
      fecha_creacion: order?.seguroComplementario?.fecha_creacion ?? 0,
      productos:
        order?.seguroComplementario?.productos.map((product) => {
          return {
            sku: product.sku,
            lote: product.lote,
            descuento_unitario: product.descuento_unitario,
            cantidad_afectada: product.cantidad_afectada,
            copago_unitario: product.copago_unitario,
            precio_pagado_por_unidad: product.precio_pagado_por_unidad,
            deducible_unitario: product.deducible_unitario,
            nombre: product.nombre,
            observacion: product.observacion,
          };
        }) ?? [],
      rut: order?.seguroComplementario?.rut ?? '',
      aseguradora_rut: order?.seguroComplementario?.aseguradora_rut ?? '',
      aseguradora_nombre: order?.seguroComplementario?.aseguradora_nombre ?? '',
    };
  };

  generarSeguroComplementario = (order: OrdenEntity): IGenerarSeguroComplementario => {
    return {
      cliente: {
        apellido: order?.seguroComplementario?.nombreBeneficiario ?? order.delivery.delivery_address.firstName,
        correo_electronico: order.customer,
        nombre: order.delivery.delivery_address.firstName,
        telefono: order.delivery.delivery_address.phone,
      },
      cotizacion: {
        id: String(order?.seguroComplementario?.id_externo) ?? '',
        productos:
          order?.seguroComplementario?.productos.map((product) => {
            return {
              cantidad: product.cantidad_afectada,
              copago_unitario: product.copago_unitario,
              deducible_unitario: product.deducible_unitario,
              descuento_unitario: product.descuento_unitario,
              lote: product.lote,
              nombre: product.nombre,
              precio_unitario: product.precio_pagado_por_unidad,
              sku: product.sku,
            };
          }) ?? [],
        tipo_documento: order.seguroComplementario?.tipo_documento_emitir ?? '',
      },
      id_interno: order.id,
      orden: {
        precio_delivery: order.delivery.pricePaid,
        productos: order.productsOrder.map((product) => {
          return {
            cantidad: product.qty,
            lote: product.batchId,
            nombre: product.fullName,
            precio_unitario: product.pricePaidPerUnit,
            sku: product.sku,
          };
        }),
      },
      proveedor: 'Yapp',
    };
  };

  generarCourierManual = (order: OrdenEntity): IAsignarCourier => {
    return {
      orderId: order.id,
      provider: order.delivery.provider.provider,
      trackingNumber: order.delivery.provider.trackingNumber,
      deliveryTracking: {
        estado: 'Creado',
        fecha: new Date().getTime(),
        comentario: '',
        evidencias: [],
      },
      urlLabel: 'label_manual.pdf',
      emissionDate: new Date().getTime(),
    };
  };
}

export interface ITrackingPayload {
  responsible: string;
  toStatus: StatusOrder;
}

export interface IUpdatePaymentVO {
  id: string;
  payment: Payment;
}
