import { ICotizacionRespository } from '../../cotizacion/domain/cotizacion.repository';
import { IOrdenRepository } from '../domain/order.repository';
import { IOrdenUseCase } from './orden.usecase.interface';
import { OrdenOValue } from './orden.vo';
import {
  IActualizarOrderStatusWebhook,
  IAddOrderObservation,
  IAsignarCourier,
  IAsignarDocumentosTributarios,
  IAsignarSeguroComplementario,
  ICancelarOrder,
  IOrderBackToFlow,
  IOrigin,
  IUpdateCanalConvenio,
  IUpdateEstadoCedulaIdentidad,
  IUpdatePreparandoToDelivery,
  IUpdatePreparandoToRetiro,
  IUpdateStatusOderObservation,
  IUpdateStatusSeguroComplementario,
  IUpdateTrackingNumber,
} from '.././../../../interface/event';
import { MovementRepository } from '../../../modules/movements/domain/movements.repositoy';
import { EcommerceOrderEntity } from '../../../../interface/ecommerceOrder.entity';
import Joi from 'joi';
import { ApiResponse, HttpCodes } from './api.response';
import {
  INotificarCambioOrden,
  IUpdateBillingStatus,
  IUpdateOrderHistory,
  IUpdateOrderTracking,
  IUpdatePaymentOrden,
  IUpdatePrescriptionState,
  IUpdateProvider,
  IUpdateProviderStatus,
  IUpdateProvisionalStatusOrder,
  IUploadPrescription,
} from './interface';
import { OrdenEntity, StatusOrder } from '../domain/order.entity';
import { ordenStateMachine } from '../domain/utils/ordenStateMachine';
import {
  actualizarOrdenEccomerce,
  emitirDocumentoTributario,
  generarCourierEvent,
  generarSeguroComplementarioEvent,
  notificarEstadoDeOrden,
} from '../domain/eventos';
import { notificarCambioOrdenSQS } from '../domain/sqs';
import { IDocumentoTributarioEventInput } from '../domain/documentos_tributarios.interface';
import { ICourierEventInput } from '../domain/courier.interface';
import { diccionarioStatusCourier } from '../domain/utils/diccionario/tipoStatusCourier';
import {
  IGenerarSeguroComplementario,
  IGuardarSeguroComplementario,
} from '../../../../interface/seguroComplementario.interface';
import { AdminOrderEntity } from '../../../../interface/adminOrder.entity';
import { CreateCompleteOrderEntity } from '../../../../interface/crearOrdenCompleta';

export class OrdenUseCase implements IOrdenUseCase {
  constructor(
    private readonly ordenRepository: IOrdenRepository,
    private readonly cotizacionRespository: ICotizacionRespository,
    private readonly movements: MovementRepository
  ) {}

  async createOrderFromEcommerce(order: EcommerceOrderEntity, origin: IOrigin) {
    // Pasar a Value Object
    // const new_order = await this.formatOrderEcommerce(order);

    // Create Order From Ecommerce POS
    const isOrdenCompleta =
      order.payment &&
      order?.payment?.payment?.originCode &&
      order?.payment?.payment?.amount &&
      order.payment.payment.method;

    if (isOrdenCompleta) {
      const Documento = Joi.string().valid('bill', 'dispatch_note');

      const Producto = Joi.object({
        sku: Joi.string().required(),
        lote: Joi.string().required(),
        descuento_unitario: Joi.number().required(),
        cantidad_afectada: Joi.number().required(),
        copago_unitario: Joi.number().required(),
        precio_pagado_por_unidad: Joi.number().required(),
        deducible_unitario: Joi.number().required(),
        nombre: Joi.string().required(),
        observacion: Joi.string().required().allow(''),
      });

      const ISeguroComplementario = Joi.object({
        nombreBeneficiario: Joi.string().required(),
        id_externo: Joi.number().required(),
        id: Joi.string().required(),
        credencial_url: Joi.string().required(),
        deducible_total: Joi.number().required(),
        descuento_total: Joi.number().required(),
        tipo_documento_emitir: Documento.required(),
        fecha_creacion: Joi.number().required(),
        productos: Joi.array().items(Producto).required(),
        rut: Joi.string().required(),
        aseguradora_rut: Joi.string().required(),
        aseguradora_nombre: Joi.string().required(),
      });

      const IReferrer = Joi.object({
        referrer: Joi.string().required().allow(''),
      });

      const Details = Joi.object({
        discount: Joi.number().required(),
        promotionCode: Joi.string().required(),
        reference: Joi.string().required(),
        type: Joi.string().required(),
      });

      const Discount = Joi.object({
        details: Joi.array().items(Details).required(),
        total: Joi.number().required(),
      });

      const ResumeOrder = Joi.object({
        canal: Joi.string().required(),
        deliveryPrice: Joi.number().required(),
        discount: Discount.required(),
        subtotal: Joi.number().required(),
        totalPrice: Joi.number().required(),
        nroProducts: Joi.number().required(),
      });

      const Prescription = Joi.object({
        file: Joi.string().required().allow(''),
      });

      const PrescriptionType = Joi.string().valid(
        'Presentación receta médica',
        'Venta directa (Sin receta)',
        'Venta bajo receta cheque',
        'Receta médica retenida'
      );

      const ProductOrder = Joi.object({
        batchId: Joi.string().required(),
        bioequivalent: Joi.boolean().required(),
        cooled: Joi.boolean().required(),
        ean: Joi.string().required().allow(''),
        expiration: Joi.number().required(),
        fullName: Joi.string().required(),
        laboratoryName: Joi.string().required().allow(''),
        liquid: Joi.boolean().optional().allow(null),
        normalUnitPrice: Joi.number().required(),
        pharmaceuticalForm: Joi.string().required().allow(''),
        photoURL: Joi.string().required().allow(''),
        prescription: Prescription.required(),
        prescriptionType: PrescriptionType.required(),
        presentation: Joi.string().required().allow(''),
        price: Joi.number().required(),
        productCategory: Joi.string().required().allow(''),
        productSubCategory: Joi.array().items(Joi.string()).required(),
        qty: Joi.number().required(),
        quantityPerContainer: Joi.string().required().allow(''),
        recommendations: Joi.string().required().allow(''),
        requirePrescription: Joi.boolean().required(),
        shortName: Joi.string().required(),
        sku: Joi.string().required(),
        pricePaidPerUnit: Joi.number().optional(),
        discountPerUnit: Joi.number().optional(),
        referenceId: Joi.number().optional().allow(null),
        lineNumber: Joi.number().optional().allow(null),
      });

      const DeliveryAddress = Joi.object({
        comuna: Joi.string().required().allow(''),
        dpto: Joi.string().required().allow(''),
        firstName: Joi.string().required().allow(''),
        homeType: Joi.string().required().allow(''),
        lastName: Joi.string().required().allow(''),
        phone: Joi.string().required().allow(''),
        region: Joi.string().required().allow(''),
        streetName: Joi.string().required().allow(''),
        streetNumber: Joi.string().required().allow(''),
      });

      const DeliveryMethod = Joi.string().valid('DELIVERY', 'STORE');

      const DeliveryType = Joi.string().valid(
        '',
        'Envío Estándar (48 horas hábiles)',
        'Envío Express (4 horas hábiles)',
        'Envío en el día (24 horas hábiles)',
        'Envío 24 horas hábiles'
      );

      const ICompromisoEntrega = Joi.object({
        dateText: Joi.string().required().allow(''),
        date: Joi.number().required(),
      });

      const Delivery = Joi.object({
        cost: Joi.number().required(),
        delivery_address: DeliveryAddress.required(),
        method: DeliveryMethod.required(),
        type: DeliveryType.required().allow(''),
        compromiso_entrega: ICompromisoEntrega.required(),
        discount: Joi.number().required(),
        pricePaid: Joi.number().required(),
      });

      const Payment = Joi.object({
        payment: Joi.object({
          originCode: Joi.string(),
          amount: Joi.number(),
          method: Joi.string(),
          status: Joi.string().required().valid('Aprobado'),
          wallet: Joi.string().required(),
          paymentDate: Joi.number(),
        }).required(),
      });

      const ecommerceOrderSchema = Joi.object({
        id: Joi.string().required(),
        customer: Joi.string().required(),
        delivery: Delivery.required(),
        payment: Payment.required(),
        productsOrder: Joi.array().items(ProductOrder).required(),
        resumeOrder: ResumeOrder.required(),
        extras: IReferrer.required(),
        seguroComplementario: ISeguroComplementario.optional(),
      });

      const { error } = ecommerceOrderSchema.validate(order);

      if (error) {
        throw new ApiResponse(HttpCodes.BAD_REQUEST, order, error.message);
      }

      const ordenCompleta = new OrdenOValue().completeOrderFromEcommerce(order);

      const nuevaOrden = await this.ordenRepository.createOrderFromEcommerce(ordenCompleta);

      if (!nuevaOrden) {
        throw new ApiResponse(HttpCodes.BAD_REQUEST, nuevaOrden);
      }

      if (order.seguroComplementario) {
        const seguroComplementarioVO = new OrdenOValue().guardarSeguroComplementario(order);
        await this.guardarSeguroComplementario(seguroComplementarioVO);
      }

      if (
        nuevaOrden.productsOrder
          .filter(({ requirePrescription }) => requirePrescription)
          .filter(
            (product) =>
              product.prescription.file !== '' &&
              (product.prescription.state === '' || product.prescription.state === 'Pending')
          ).length !== 0
      )
        await this.updateStatusOrder(nuevaOrden, nuevaOrden.statusOrder, 'VALIDANDO_RECETA', 'SISTEMA'); // Llamas Actualiza Estado Usecase (orden, CREADO, VALIDANDO_RECETA)

      if (
        nuevaOrden.productsOrder.filter((producto) => producto.requirePrescription && producto.prescription.file === '')
          .length !== 0
      )
        await this.updateStatusOrder(nuevaOrden, nuevaOrden.statusOrder, 'OBSERVACIONES_RECETAS', 'SISTEMA'); // Llamas Actualiza Estado Usecase (orden, CREADO, OBSERVACIONES_RECETAS)

      if (
        !nuevaOrden.productsOrder.some(
          (producto) =>
            (producto.requirePrescription && producto.prescription.file === '') ||
            (producto.requirePrescription &&
              producto.prescription.state !== 'Approved' &&
              producto.prescription.state !== 'Approved_With_Comments')
        )
      )
        await this.updateStatusOrder(nuevaOrden, nuevaOrden.statusOrder, 'RECETA_VALIDADA', 'SISTEMA'); // Llamas Actualiza Estado Usecase (orden, CREADO, APROBADA)
    }

    // Create Partial Order
    if (!isOrdenCompleta) {
      const Documento = Joi.string().valid('bill', 'dispatch_note');
      const Producto = Joi.object({
        sku: Joi.string().required(),
        lote: Joi.string().required(),
        descuento_unitario: Joi.number().required(),
        cantidad_afectada: Joi.number().required(),
        copago_unitario: Joi.number().required(),
        precio_pagado_por_unidad: Joi.number().required(),
        deducible_unitario: Joi.number().required(),
        nombre: Joi.string().required(),
        observacion: Joi.string().required().allow(''),
      });

      const ISeguroComplementario = Joi.object({
        nombreBeneficiario: Joi.string().required(),
        id_externo: Joi.number().required(),
        id: Joi.string().required(),
        credencial_url: Joi.string().required(),
        deducible_total: Joi.number().required(),
        descuento_total: Joi.number().required(),
        tipo_documento_emitir: Documento.required(),
        fecha_creacion: Joi.number().required(),
        productos: Joi.array().items(Producto).required(),
        rut: Joi.string().required(),
        aseguradora_rut: Joi.string().required(),
        aseguradora_nombre: Joi.string().required(),
      });

      const IReferrer = Joi.object({
        referrer: Joi.string().required().allow(''),
      });

      const Details = Joi.object({
        discount: Joi.number().required(),
        promotionCode: Joi.string().required(),
        reference: Joi.string().required(),
        type: Joi.string().required(),
      });

      const Discount = Joi.object({
        details: Joi.array().items(Details).required(),
        total: Joi.number().required(),
      });

      const ResumeOrder = Joi.object({
        canal: Joi.string().required(),
        deliveryPrice: Joi.number().required(),
        discount: Discount.required(),
        subtotal: Joi.number().required(),
        totalPrice: Joi.number().required(),
        nroProducts: Joi.number().required(),
      });

      const Prescription = Joi.object({
        file: Joi.string().required().allow(''),
      });

      const PrescriptionType = Joi.string().valid(
        'Presentación receta médica',
        'Venta directa (Sin receta)',
        'Venta bajo receta cheque',
        'Receta médica retenida'
      );

      const ProductOrder = Joi.object({
        batchId: Joi.string().required(),
        bioequivalent: Joi.boolean().required(),
        cooled: Joi.boolean().required(),
        ean: Joi.string().required().allow(''),
        expiration: Joi.number().required(),
        fullName: Joi.string().required(),
        laboratoryName: Joi.string().required().allow(''),
        liquid: Joi.boolean().optional().allow(null),
        normalUnitPrice: Joi.number().required(),
        pharmaceuticalForm: Joi.string().required().allow(''),
        photoURL: Joi.string().required().allow(''),
        prescription: Prescription.required(),
        prescriptionType: PrescriptionType.required(),
        presentation: Joi.string().required().allow(''),
        price: Joi.number().required(),
        productCategory: Joi.string().required().allow(''),
        productSubCategory: Joi.array().items(Joi.string()).required(),
        qty: Joi.number().required(),
        quantityPerContainer: Joi.string().required().allow(''),
        recommendations: Joi.string().required().allow(''),
        requirePrescription: Joi.boolean().required(),
        shortName: Joi.string().required(),
        sku: Joi.string().required(),
        pricePaidPerUnit: Joi.number().optional(),
        discountPerUnit: Joi.number().optional(),
        referenceId: Joi.number().optional().allow(null),
        lineNumber: Joi.number().optional().allow(null),
      });

      const DeliveryAddress = Joi.object({
        comuna: Joi.string().required().allow(''),
        dpto: Joi.string().required().allow(''),
        firstName: Joi.string().required().allow(''),
        homeType: Joi.string().required().allow(''),
        lastName: Joi.string().required().allow(''),
        phone: Joi.string().required().allow(''),
        region: Joi.string().required().allow(''),
        streetName: Joi.string().required().allow(''),
        streetNumber: Joi.string().required().allow(''),
      });

      const DeliveryMethod = Joi.string().valid('DELIVERY', 'STORE');

      const DeliveryType = Joi.string().valid(
        '',
        'Envío Estándar (48 horas hábiles)',
        'Envío Express (4 horas hábiles)',
        'Envío en el día (24 horas hábiles)',
        'Envío 24 horas hábiles'
      );

      const ICompromisoEntrega = Joi.object({
        dateText: Joi.string().required().allow(''),
        date: Joi.number().required(),
      });

      const Delivery = Joi.object({
        cost: Joi.number().required(),
        delivery_address: DeliveryAddress.required(),
        method: DeliveryMethod.required(),
        type: DeliveryType.required().allow(''),
        compromiso_entrega: ICompromisoEntrega.required(),
        discount: Joi.number().required(),
        pricePaid: Joi.number().required(),
      });

      const Payment = Joi.object({
        payment: Joi.object({
          originCode: Joi.string(),
          amount: Joi.number(),
          method: Joi.string(),
          status: Joi.string().required(),
          wallet: Joi.string().required(),
          paymentDate: Joi.number(),
        }).required(),
      });

      const createPartialOrderSchema = Joi.object({
        id: Joi.string().required(),
        customer: Joi.string().required(),
        delivery: Delivery.required(),
        payment: Payment.required(),
        productsOrder: Joi.array().items(ProductOrder).required(),
        resumeOrder: ResumeOrder.required(),
        extras: IReferrer.required(),
        seguroComplementario: ISeguroComplementario.optional(),
      });

      const { error } = createPartialOrderSchema.validate(order);

      if (error) {
        throw new ApiResponse(HttpCodes.BAD_REQUEST, error.message);
      }

      const ordenParcial = new OrdenOValue().createPartialOrder(order);

      const nuevaOrden = await this.ordenRepository.createPartialOrder(ordenParcial);

      if (!nuevaOrden) {
        throw new ApiResponse(HttpCodes.BAD_REQUEST, nuevaOrden);
      }

      if (order.seguroComplementario) {
        const seguroComplementarioVO = new OrdenOValue().guardarSeguroComplementario(order);
        await this.guardarSeguroComplementario(seguroComplementarioVO);
      }
    }
  }

  async createOrderFromAdmin(order: AdminOrderEntity, origin: IOrigin) {
    const Documento = Joi.string().valid('bill', 'dispatch_note');
    const Producto = Joi.object({
      sku: Joi.string().required(),
      lote: Joi.string().required(),
      descuento_unitario: Joi.number().required(),
      cantidad_afectada: Joi.number().required(),
      copago_unitario: Joi.number().required(),
      precio_pagado_por_unidad: Joi.number().required(),
      deducible_unitario: Joi.number().required(),
      nombre: Joi.string().required(),
      observacion: Joi.string().required().allow(''),
    });

    const ISeguroComplementario = Joi.object({
      nombreBeneficiario: Joi.string().required(),
      id_externo: Joi.number().required(),
      id: Joi.string().required(),
      credencial_url: Joi.string().required(),
      deducible_total: Joi.number().required(),
      descuento_total: Joi.number().required(),
      tipo_documento_emitir: Documento.required(),
      fecha_creacion: Joi.number().required(),
      productos: Joi.array().items(Producto).required(),
      rut: Joi.string().required(),
      aseguradora_rut: Joi.string().required(),
      aseguradora_nombre: Joi.string().required(),
    });

    const IReferrer = Joi.object({
      referrer: Joi.string().required().allow(''),
    });

    const Details = Joi.object({
      discount: Joi.number().required(),
      promotionCode: Joi.string().required(),
      reference: Joi.string().required(),
      type: Joi.string().required(),
    });

    const Discount = Joi.object({
      details: Joi.array().items(Details).required(),
      total: Joi.number().required(),
    });

    const ResumeOrder = Joi.object({
      canal: Joi.string().required(),
      convenio: Joi.string().required(),
      deliveryPrice: Joi.number().required(),
      discount: Discount.required(),
      subtotal: Joi.number().required(),
      totalPrice: Joi.number().required(),
      nroProducts: Joi.number().required(),
    });

    const Prescription = Joi.object({
      file: Joi.string().required().allow(''),
    });

    const PrescriptionType = Joi.string().valid(
      'Presentación receta médica',
      'Venta directa (Sin receta)',
      'Venta bajo receta cheque',
      'Receta médica retenida'
    );

    const ProductOrder = Joi.object({
      batchId: Joi.string().required(),
      bioequivalent: Joi.boolean().required(),
      cooled: Joi.boolean().required(),
      ean: Joi.string().required().allow(''),
      expiration: Joi.number().required(),
      fullName: Joi.string().required(),
      laboratoryName: Joi.string().required().allow(''),
      liquid: Joi.boolean().optional().allow(null),
      normalUnitPrice: Joi.number().required(),
      pharmaceuticalForm: Joi.string().required().allow(''),
      photoURL: Joi.string().required().allow(''),
      prescription: Prescription.required(),
      prescriptionType: PrescriptionType.required(),
      presentation: Joi.string().required().allow(''),
      price: Joi.number().required(),
      productCategory: Joi.string().required().allow(''),
      productSubCategory: Joi.array().items(Joi.string()).required(),
      qty: Joi.number().required(),
      quantityPerContainer: Joi.string().required().allow(''),
      recommendations: Joi.string().required().allow(''),
      requirePrescription: Joi.boolean().required(),
      shortName: Joi.string().required(),
      sku: Joi.string().required(),
      pricePaidPerUnit: Joi.number().optional(),
      discountPerUnit: Joi.number().optional(),
      referenceId: Joi.number().optional().allow(null),
      lineNumber: Joi.number().optional().allow(null),
    });

    const DeliveryAddress = Joi.object({
      comuna: Joi.string().required().allow(''),
      dpto: Joi.string().required().allow(''),
      firstName: Joi.string().required().allow(''),
      homeType: Joi.string().required().allow(''),
      lastName: Joi.string().required().allow(''),
      phone: Joi.string().required().allow(''),
      region: Joi.string().required().allow(''),
      streetName: Joi.string().required().allow(''),
      streetNumber: Joi.string().required().allow(''),
    });

    const DeliveryMethod = Joi.string().valid('DELIVERY', 'STORE');

    const DeliveryType = Joi.string().valid(
      '',
      'Envío Estándar (48 horas hábiles)',
      'Envío Express (4 horas hábiles)',
      'Envío en el día (24 horas hábiles)',
      'Envío 24 horas hábiles'
    );

    const ICompromisoEntrega = Joi.object({
      dateText: Joi.string().required().allow(''),
      date: Joi.number().required(),
    });

    const Delivery = Joi.object({
      cost: Joi.number().required(),
      delivery_address: DeliveryAddress.required(),
      method: DeliveryMethod.required(),
      type: DeliveryType.required().allow(''),
      compromiso_entrega: ICompromisoEntrega.required(),
      discount: Joi.number().required(),
      pricePaid: Joi.number().required(),
    });

    const Payment = Joi.object({
      originCode: Joi.string(),
      amount: Joi.number(),
      method: Joi.string(),
      status: Joi.string().required().valid('Aprobado'),
      wallet: Joi.string().required(),
      paymentDate: Joi.number(),
    });

    const createCompleteOrderSchema = Joi.object({
      id: Joi.string().required(),
      customer: Joi.string().required().allow(''),
      delivery: Delivery.required(),
      payments: Joi.array().items(Payment).required(),
      productsOrder: Joi.array().items(ProductOrder).required(),
      resumeOrder: ResumeOrder.required(),
      extras: IReferrer.required(),
      seguroComplementario: ISeguroComplementario.optional(),
      billing: Joi.object({
        type: Joi.string().optional().allow(''),
      }).optional(),
    });

    const { error } = createCompleteOrderSchema.validate(order);

    if (error) {
      throw new Error(error.message);

      // const response = new ApiResponse(HttpCodes.BAD_REQUEST, error.message);

      // return {
      //   statusCode: response.status,
      //   body: JSON.stringify(response),
      // };
    }

    const ordenParcial = new OrdenOValue().completeOrderFromAdmin(order);

    const nuevaOrden = await this.ordenRepository.createOrderFromEcommerce(ordenParcial);

    if (!nuevaOrden) {
      throw new Error(`Error al crear la orden`);

      // const response = new ApiResponse(HttpCodes.BAD_REQUEST, nuevaOrden);

      // return {
      //   statusCode: response.status,
      //   body: JSON.stringify(response),
      // };
    }

    console.log('------ Order Created ------', nuevaOrden);

    await this.notificarCambioOrden(nuevaOrden.id);

    // Notificar Cliente Email
    await notificarEstadoDeOrden(nuevaOrden, false);

    await actualizarOrdenEccomerce(nuevaOrden);
  }

  async createCompleteOrder(order: CreateCompleteOrderEntity, origin: IOrigin) {
    const Documento = Joi.string().valid('bill', 'dispatch_note');
    const Producto = Joi.object({
      sku: Joi.string().required(),
      lote: Joi.string().required(),
      descuento_unitario: Joi.number().required(),
      cantidad_afectada: Joi.number().required(),
      copago_unitario: Joi.number().required(),
      precio_pagado_por_unidad: Joi.number().required(),
      deducible_unitario: Joi.number().required(),
      nombre: Joi.string().required(),
      observacion: Joi.string().required().allow(''),
    });

    const ISeguroComplementario = Joi.object({
      nombreBeneficiario: Joi.string().required(),
      id_externo: Joi.number().required(),
      id: Joi.string().required(),
      credencial_url: Joi.string().required(),
      deducible_total: Joi.number().required(),
      descuento_total: Joi.number().required(),
      tipo_documento_emitir: Documento.required(),
      fecha_creacion: Joi.number().required(),
      productos: Joi.array().items(Producto).required(),
      rut: Joi.string().required(),
      aseguradora_rut: Joi.string().required(),
      aseguradora_nombre: Joi.string().required(),
    });

    const IReferrer = Joi.object({
      referrer: Joi.string().required().allow(''),
    });

    const Details = Joi.object({
      discount: Joi.number().required(),
      promotionCode: Joi.string().required(),
      reference: Joi.string().required(),
      type: Joi.string().required(),
    });

    const Discount = Joi.object({
      details: Joi.array().items(Details).required(),
      total: Joi.number().required(),
    });

    const ResumeOrder = Joi.object({
      canal: Joi.string().required(),
      convenio: Joi.string().required(),
      deliveryPrice: Joi.number().required(),
      discount: Discount.required(),
      subtotal: Joi.number().required(),
      totalPrice: Joi.number().required(),
      nroProducts: Joi.number().required(),
      clasification: Joi.string().required().allow(''),
    });

    const Prescription = Joi.object({
      file: Joi.string().required().allow(''),
    });

    const PrescriptionType = Joi.string().valid(
      'Presentación receta médica',
      'Venta directa (Sin receta)',
      'Venta bajo receta cheque',
      'Receta médica retenida'
    );

    const ProductOrder = Joi.object({
      batchId: Joi.string().required(),
      bioequivalent: Joi.boolean().required(),
      cooled: Joi.boolean().required(),
      ean: Joi.string().required().allow(''),
      expiration: Joi.number().required(),
      fullName: Joi.string().required(),
      laboratoryName: Joi.string().required().allow(''),
      liquid: Joi.boolean().optional().allow(null),
      normalUnitPrice: Joi.number().required(),
      pharmaceuticalForm: Joi.string().required().allow(''),
      photoURL: Joi.string().required().allow(''),
      prescription: Prescription.required(),
      prescriptionType: PrescriptionType.required(),
      presentation: Joi.string().required().allow(''),
      price: Joi.number().required(),
      productCategory: Joi.string().required().allow(''),
      productSubCategory: Joi.array().items(Joi.string()).required(),
      qty: Joi.number().required(),
      quantityPerContainer: Joi.string().required().allow(''),
      recommendations: Joi.string().required().allow(''),
      requirePrescription: Joi.boolean().required(),
      shortName: Joi.string().required(),
      sku: Joi.string().required(),
      pricePaidPerUnit: Joi.number().optional(),
      discountPerUnit: Joi.number().optional(),
      referenceId: Joi.number().optional().allow(null),
      lineNumber: Joi.number().optional().allow(null),
    });

    const DeliveryAddress = Joi.object({
      comuna: Joi.string().required().allow(''),
      dpto: Joi.string().required().allow(''),
      firstName: Joi.string().required().allow(''),
      homeType: Joi.string().required().allow(''),
      lastName: Joi.string().required().allow(''),
      phone: Joi.string().required().allow(''),
      region: Joi.string().required().allow(''),
      streetName: Joi.string().required().allow(''),
      streetNumber: Joi.string().required().allow(''),
    });

    const DeliveryMethod = Joi.string().valid('DELIVERY', 'STORE');

    const DeliveryType = Joi.string().valid(
      '',
      'Envío Estándar (48 horas hábiles)',
      'Envío Express (4 horas hábiles)',
      'Envío en el día (24 horas hábiles)',
      'Envío 24 horas hábiles'
    );

    const ICompromisoEntrega = Joi.object({
      dateText: Joi.string().required().allow(''),
      date: Joi.number().required(),
    });

    const Delivery = Joi.object({
      cost: Joi.number().required(),
      delivery_address: DeliveryAddress.required(),
      method: DeliveryMethod.required(),
      type: DeliveryType.required().allow(''),
      compromiso_entrega: ICompromisoEntrega.required(),
      discount: Joi.number().required(),
      pricePaid: Joi.number().required(),
    });

    const Payment = Joi.object({
      originCode: Joi.string(),
      amount: Joi.number(),
      method: Joi.string(),
      status: Joi.string().required().valid('Aprobado'),
      wallet: Joi.string().required(),
      paymentDate: Joi.number(),
    });

    const createCompleteOrderSchema = Joi.object({
      id: Joi.string().required(),
      customer: Joi.string().required(),
      delivery: Delivery.required(),
      payments: Joi.array().items(Payment).required(),
      productsOrder: Joi.array().items(ProductOrder).required(),
      resumeOrder: ResumeOrder.required(),
      extras: IReferrer.required(),
      seguroComplementario: ISeguroComplementario.optional(),
      billing: Joi.object({
        type: Joi.string().optional().allow(''),
      }).optional(),
    });

    const { error } = createCompleteOrderSchema.validate(order);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, error.message);
    }

    const completeOrder = new OrdenOValue().createCompleteOrder(order);

    const nuevaOrden = await this.ordenRepository.createCompleteOrder(completeOrder);

    if (!nuevaOrden) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, nuevaOrden);
    }

    console.log('------ Order Created ------', nuevaOrden);

    await this.notificarCambioOrden(nuevaOrden.id);

    // Notificar Cliente Email
    await notificarEstadoDeOrden(nuevaOrden, false);

    await actualizarOrdenEccomerce(nuevaOrden);
  }

  async updatePayment(payload: IUpdatePaymentOrden, origin: IOrigin) {
    const updatePaymentSchema = Joi.object({
      id: Joi.string().required(),
      payment: Joi.object({
        payment: Joi.object({
          amount: Joi.number().required(),
          method: Joi.string().required(),
          paymentDate: Joi.number().required(),
          originCode: Joi.string().required(),
          status: Joi.string().required(),
          wallet: Joi.string().required(),
        }),
      }).required(),
    });

    const { error } = updatePaymentSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updatePaymentSchema, error.message);
    }

    const updatePaymentVO = new OrdenOValue().updatePayment(payload);

    const ordenActualizada = await this.ordenRepository.updatePayment(updatePaymentVO);

    if (!ordenActualizada) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar la orden.');
    }

    if (ordenActualizada.payments[0].status !== 'Aprobado') {
      console.log('----- Orden Cancelada por estado del Pago Cancelado: ', JSON.stringify(ordenActualizada));

      return;
    }

    if (ordenActualizada.payments[0].status === 'Aprobado') {
      if (
        ordenActualizada.productsOrder
          .filter(({ requirePrescription }) => requirePrescription)
          .filter(
            (product) =>
              product.prescription.file !== '' &&
              (product.prescription.state === '' || product.prescription.state === 'Pending')
          ).length !== 0
      )
        await this.updateStatusOrder(ordenActualizada, ordenActualizada.statusOrder, 'VALIDANDO_RECETA', 'SISTEMA'); // Llamas Actualiza Estado Usecase (orden, CREADO, VALIDANDO_RECETA)

      if (
        ordenActualizada.productsOrder.filter(
          (producto) => producto.requirePrescription && producto.prescription.file === ''
        ).length !== 0
      )
        await this.updateStatusOrder(
          ordenActualizada,
          ordenActualizada.statusOrder,
          'OBSERVACIONES_RECETAS',
          'SISTEMA'
        ); // Llamas Actualiza Estado Usecase (orden, CREADO, OBSERVACIONES_RECETAS)

      if (
        !ordenActualizada.productsOrder.some(
          (producto) =>
            (producto.requirePrescription && producto.prescription.file === '') ||
            (producto.requirePrescription &&
              producto.prescription.state !== 'Approved' &&
              producto.prescription.state !== 'Approved_With_Comments')
        )
      )
        await this.updateStatusOrder(ordenActualizada, ordenActualizada.statusOrder, 'RECETA_VALIDADA', 'SISTEMA'); // Llamas Actualiza Estado Usecase (orden, CREADO, APROBADA)
    }
  }

  updateStatusOrder = async (
    order: OrdenEntity,
    previousStatus: StatusOrder,
    newStatus: StatusOrder,
    responsible: string
  ) => {
    try {
      console.log('----- Intentando Actualizar Orden: ', order.id, ' de ', previousStatus, ' a ', newStatus);

      // Check if previous status is the same as the new status
      if (previousStatus === newStatus) {
        console.log(`----- Orden con el mismo estado: ${previousStatus}`);
        return;
      }

      await this.notificarCambioOrden(order.id);

      if (!ordenStateMachine(previousStatus, newStatus, order))
        throw new ApiResponse(HttpCodes.BAD_REQUEST, order, 'Error en la maquina de estados.');

      console.log('----- Orden Pasa Maquina de Estados: ', order.id, ' de ', previousStatus, ' a ', newStatus);

      const ordenStatusActualizada = await this.ordenRepository.updateOrderStatus(order.id, newStatus);

      if (!ordenStatusActualizada)
        throw new ApiResponse(
          HttpCodes.BAD_REQUEST,
          ordenStatusActualizada,
          'Error al actualizar el estado de la orden.'
        );

      await this.updateOrderTracking({
        id: order.id,
        responsible,
        statusOrder: newStatus,
        reason: 'SISTEMA',
      });

      await this.updateOrderHistory({
        id: order.id,
        type: 'status',
        responsible,
        changeFrom: previousStatus,
        changeTo: newStatus,
        aditionalInfo: {
          product_sku: '',
          comments: '',
        },
      });

      // Notificar Cliente Email
      await notificarEstadoDeOrden(ordenStatusActualizada, false);

      await actualizarOrdenEccomerce(ordenStatusActualizada);

      // Cambiar Provisional Status Order
      await this.updateProvisionalStatusOrder({
        id: order.id,
        provisionalStatusOrder: 'Aprobado',
      });

      // Notificar Cambio de Orden a SQS
      await this.notificarCambioOrden(order.id);

      console.log('----- Orden Actualizada: ', ordenStatusActualizada);
    } catch (error) {
      console.log('Error en el Usecase Update Status Order: ', error);
      throw new ApiResponse(HttpCodes.BAD_REQUEST, order, 'Error al actualizar el estado de la orden.');
    }
  };

  updatePreparandoToDelivery = async (payload: IUpdatePreparandoToDelivery) => {
    // Actualizar Provisional Status Order a Pendiente
    await this.updateProvisionalStatusOrder({
      id: payload.order.id,
      provisionalStatusOrder: 'Pendiente',
    });

    if (!payload.order.seguroComplementario) {
      await this.preparandoToDelivery(payload);
      return;
    }

    const isSeguroConfirmado =
      payload.order.seguroComplementario.vouchers_url.length > 0 &&
      payload.order.seguroComplementario.billing.length > 0;

    if (!isSeguroConfirmado) {
      await this.preparandoToDeliverySeguroComplementario(payload);
    }

    // await this.updateStatusOrder(payload.order, payload.order.statusOrder, 'ASIGNAR_A_DELIVERY', payload.responsible);
  };

  preparandoToDelivery = async (payload: IUpdatePreparandoToDelivery) => {
    await this.updateOrderProvider({
      id: payload.order.id,
      providerName: payload.order?.delivery?.provider.provider,
      serviceId: payload.order?.delivery?.provider.service_id,
      note: payload.order.delivery.provider.note,
    });

    const isDocumentoTributarioAsignado =
      payload.order.billing.urlBilling.length > 0 && payload.order.billing.number.length > 0;

    if (!isDocumentoTributarioAsignado) {
      await this.updateStatusBilling({
        id: payload.order.id,
        status: 'Pendiente',
        statusDate: new Date(),
      });

      // Emitir Documentos Tributarios
      const documentoVO = new OrdenOValue().generarDocumentosTributarios(payload.order);

      console.log('----- Generar Documento Tributario: ', documentoVO);

      await this.generarDocumentosTributarios({
        accion: 'generar-documento-tributario',
        origen: 'SISTEMA ORDENES',
        payload: documentoVO,
      });
    }

    const isCourierAsignado =
      payload.order.delivery.provider.urlLabel.length > 0 && payload.order.delivery.provider.trackingNumber.length > 0;

    if (!isCourierAsignado) {
      await this.updateStatusCourier({
        id: payload.order.id,
        status: 'Pendiente',
        statusDate: new Date(),
      });

      if (
        payload.order.delivery.provider.provider === 'Chibra' ||
        payload.order.delivery.provider.provider === 'Cabify'
      ) {
        const courierManual = new OrdenOValue().generarCourierManual(payload.order);

        await this.asignarCourier(courierManual);
        return;
      }

      // Emitir Courier
      const courierVO = new OrdenOValue().generarCourier(payload.order);

      console.log('----- Generar Courier: ', courierVO);

      await this.generarCourier({
        accion: 'generar-orden-de-courier',
        origen: 'SISTEMA ORDENES',
        payload: courierVO,
      });
    }

    // await this.updateStatusOrder(payload.order, payload.order.statusOrder, 'ASIGNAR_A_DELIVERY', payload.responsible);
  };

  preparandoToDeliverySeguroComplementario = async (payload: IUpdatePreparandoToDelivery) => {
    await this.updateOrderProvider({
      id: payload.order.id,
      providerName: payload.order?.delivery?.provider.provider,
      serviceId: payload.order?.delivery?.provider.service_id,
      note: payload.order.delivery.provider.note,
    });

    await this.updateStatusBilling({
      id: payload.order.id,
      status: 'Pendiente',
      statusDate: new Date(),
    });

    const isCourierAsignado =
      payload.order.delivery.provider.urlLabel.length > 0 && payload.order.delivery.provider.trackingNumber.length > 0;

    if (!isCourierAsignado) {
      await this.updateStatusCourier({
        id: payload.order.id,
        status: 'Pendiente',
        statusDate: new Date(),
      });

      if (
        payload.order.delivery.provider.provider === 'Chibra' ||
        payload.order.delivery.provider.provider === 'Cabify'
      ) {
        const courierManual = new OrdenOValue().generarCourierManual(payload.order);

        await this.asignarCourier(courierManual);
      } else {
        // Emitir Courier
        const courierVO = new OrdenOValue().generarCourier(payload.order);

        console.log('----- Generar Courier: ', courierVO);

        await this.generarCourier({
          accion: 'generar-orden-de-courier',
          origen: 'SISTEMA ORDENES',
          payload: courierVO,
        });
      }
    }

    await this.orderSeguroComplementario(payload.order);
  };

  updatePreparandoToRetiro = async (payload: IUpdatePreparandoToRetiro) => {
    await this.updateProvisionalStatusOrder({
      id: payload.order.id,
      provisionalStatusOrder: 'Pendiente',
    });

    if (!payload.order.seguroComplementario) {
      await this.preparandoToRetiro(payload);
      return;
    }

    const isSeguroConfirmado =
      payload.order.seguroComplementario.vouchers_url.length > 0 &&
      payload.order.seguroComplementario.billing.length > 0;

    if (!isSeguroConfirmado) {
      await this.preparandoToRetiroSeguroComplementario(payload);
      return;
    }

    await this.updateStatusOrder(payload.order, payload.order.statusOrder, 'LISTO_PARA_RETIRO', payload.responsible);
  };

  preparandoToRetiro = async (payload: IUpdatePreparandoToRetiro) => {
    const isDocumentoTributarioAsignado =
      payload.order.billing.urlBilling.length > 0 && payload.order.billing.number.length > 0;

    if (!isDocumentoTributarioAsignado) {
      await this.updateStatusBilling({
        id: payload.order.id,
        status: 'Pendiente',
        statusDate: new Date(),
      });

      // Emitir Documentos Tributarios
      const documentoVO = new OrdenOValue().generarDocumentosTributarios(payload.order);

      console.log('----- Generar Documento Tributario: ', documentoVO);

      await this.generarDocumentosTributarios({
        accion: 'generar-documento-tributario',
        origen: 'SISTEMA ORDENES',
        payload: documentoVO,
      });
    }

    await this.updateStatusOrder(payload.order, payload.order.statusOrder, 'LISTO_PARA_RETIRO', payload.responsible);
  };

  preparandoToRetiroSeguroComplementario = async (payload: IUpdatePreparandoToRetiro) => {
    await this.updateStatusBilling({
      id: payload.order.id,
      status: 'Pendiente',
      statusDate: new Date(),
    });

    await this.orderSeguroComplementario(payload.order);
  };

  updateOrderTracking = async (payload: IUpdateOrderTracking) => {
    const ordenTrackingActualizado = await this.ordenRepository.updateOrderTracking(payload.id, {
      date: new Date(),
      responsible: payload.responsible,
      toStatus: payload.statusOrder,
      reason: payload.reason,
    });

    if (!ordenTrackingActualizado)
      throw new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ordenTrackingActualizado,
        'Error al actualizar el tracking de la orden.'
      );
  };

  updateOrderHistory = async (payload: IUpdateOrderHistory) => {
    const ordenHistoryActualizado = await this.ordenRepository.updateOrderHistory(payload.id, {
      type: payload.type,
      changeDate: new Date(),
      responsible: payload.responsible,
      changeFrom: payload.changeFrom,
      changeTo: payload.changeTo,
      aditionalInfo: {
        product_sku: payload?.aditionalInfo?.product_sku ?? '',
        comments: payload?.aditionalInfo?.comments ?? '',
      },
    });

    if (!ordenHistoryActualizado)
      throw new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ordenHistoryActualizado,
        'Error al actualizar el historial de la orden.'
      );
  };

  updateStatusCourier = async (payload: IUpdateProviderStatus) => {
    const ordenActualizada = await this.ordenRepository.updateOrderProviderStatus(payload.id, payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el estado del proveedor.');
  };

  updateStatusBilling = async (payload: IUpdateBillingStatus) => {
    const ordenActualizada = await this.ordenRepository.updateOrderBillingStatus(payload.id, payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el estado de facturación.');
  };

  updateOrderProvider = async (payload: IUpdateProvider) => {
    const ordenActualizada = await this.ordenRepository.updateOrderProvider(payload.id, payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el proveedor.');
  };

  updateProvisionalStatusOrder = async (payload: IUpdateProvisionalStatusOrder) => {
    const updateProvisionalStatusOrderSchema = Joi.object({
      id: Joi.string().required(),
      provisionalStatusOrder: Joi.string().required().allow(''),
    });

    const { error } = updateProvisionalStatusOrderSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updateProvisionalStatusOrderSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.updateProvisionalStatusOrder({
      ...payload,
      provisionalStatusOrderDate: new Date().getTime(),
    });

    console.log('----- Estado Provisional Actualizado: ', ordenActualizada);

    if (!ordenActualizada)
      throw new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ordenActualizada,
        'Error al actualizar el estado provisional de la orden.'
      );
  };

  uploadPrescriptionFile = async (payload: IUploadPrescription) => {
    const uploadPrescriptionSchema = Joi.object({
      id: Joi.string().required(),
      productOrder: Joi.object({
        sku: Joi.string().required(),
        batchId: Joi.string().required(),
        prescription: Joi.object({
          file: Joi.string().required(),
          validation: Joi.object({
            comments: Joi.string().required().allow(''),
            responsible: Joi.string().required(),
            rut: Joi.string().required().allow(''),
          }),
        }).required(),
      }).required(),
    });

    const { error } = uploadPrescriptionSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, uploadPrescriptionSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.uploadPrescriptionFile(payload);

    if (!ordenActualizada) throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al subir la receta.');

    await this.updateOrderHistory({
      id: payload.id,
      type: 'receta-cargada',
      responsible: payload.productOrder.prescription.validation.responsible,
      changeFrom: '',
      changeTo: payload.productOrder.prescription.file,
      aditionalInfo: {
        product_sku: payload.productOrder.sku,
        comments: '',
      },
    });

    await this.notificarCambioOrden(payload.id);
  };

  updatePrescriptionState = async (payload: IUpdatePrescriptionState) => {
    const updatePrescriptionStateSchema = Joi.object({
      id: Joi.string().required(),
      productOrder: Joi.object({
        sku: Joi.string().required(),
        batchId: Joi.string().required(),
        prescription: Joi.object({
          state: Joi.string().required(),
          validation: Joi.object({
            comments: Joi.string().required().allow(''),
            responsible: Joi.string().required(),
            rut: Joi.string().required().allow(''),
          }).required(),
        }).required(),
        previousState: Joi.string().required().allow(''),
      }).required(),
    });

    const { error } = updatePrescriptionStateSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updatePrescriptionStateSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.updatePrescriptionState(payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el estado de la receta.');

    await this.updateOrderHistory({
      id: payload.id,
      type: 'receta-estado',
      responsible: payload.productOrder.prescription.validation.responsible,
      changeFrom: payload.productOrder.previousState,
      changeTo: payload.productOrder.prescription.state,
      aditionalInfo: {
        product_sku: payload.productOrder.sku,
        comments: payload.productOrder.prescription.validation.comments,
      },
    });

    await this.notificarCambioOrden(ordenActualizada.id);
  };

  notificarCambioOrden = async (orderId: string) => {
    const detailBody: INotificarCambioOrden = {
      orden: {
        id: orderId,
      },
      type: 'ORDEN_ACTUALIZADA',
      connectionId: '',
    };

    await notificarCambioOrdenSQS(detailBody);
  };

  addObservationToOrder = async (payload: IAddOrderObservation) => {
    const addOrderObservationSchema = Joi.object({
      id: Joi.string().required(),
      observation: Joi.string().required(),
      responsible: Joi.string().required(),
      name: Joi.string().required(),
    });

    const { error } = addOrderObservationSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, addOrderObservationSchema, error.message);
    }

    const observationVO = new OrdenOValue().agregarObservacion(payload);

    const ordenActualizadaConObservacion = await this.ordenRepository.addOrderObservation(observationVO);

    if (!ordenActualizadaConObservacion)
      throw new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ordenActualizadaConObservacion,
        'Error al agregar la observación a la orden.'
      );

    await this.updateOrderHistory({
      id: payload.id,
      type: 'observacion',
      responsible: payload.responsible,
      changeFrom: '',
      changeTo: 'Observación agregada',
      aditionalInfo: {
        product_sku: '',
        comments: payload.observation,
      },
    });

    await this.notificarCambioOrden(payload.id);
  };

  updateOrderStatusObservation = async (payload: IUpdateStatusOderObservation) => {
    const updateStatusOderObservationSchema = Joi.object({
      id: Joi.string().required(),
      observation: Joi.string().required(),
      responsible: Joi.string().required(),
      name: Joi.string().required(),
    });

    const { error } = updateStatusOderObservationSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updateStatusOderObservationSchema, error.message);
    }

    const observationVO = new OrdenOValue().agregarObservacion(payload);

    const ordenActualizadaConObservacion = await this.ordenRepository.addOrderObservation(observationVO);

    if (!ordenActualizadaConObservacion)
      throw new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ordenActualizadaConObservacion,
        'Error al actualizar la observación de la orden.'
      );

    await this.updateOrderHistory({
      id: payload.id,
      type: 'observacion',
      responsible: payload.responsible,
      changeFrom: '',
      changeTo: 'Observación agregada',
      aditionalInfo: {
        product_sku: '',
        comments: payload.observation,
      },
    });

    await this.updateProvisionalStatusOrder({
      id: payload.id,
      provisionalStatusOrder: 'Pendiente',
    });

    await this.updateStatusOrder(
      ordenActualizadaConObservacion,
      ordenActualizadaConObservacion.statusOrder,
      'EN_OBSERVACION',
      payload.responsible
    );
  };

  updateCanalConvenio = async (payload: IUpdateCanalConvenio) => {
    const updateCanalConvenioSchema = Joi.object({
      id: Joi.string().required(),
      canal: Joi.string().required(),
      convenio: Joi.string().required(),
    });

    const { error } = updateCanalConvenioSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updateCanalConvenioSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.updateCanalConvenio(payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el canal de la orden.');

    await this.notificarCambioOrden(payload.id);
  };

  regresarOrderAlFlujo = async (payload: IOrderBackToFlow) => {
    console.log('----- Regresando Orden al Flujo: ', payload.order.id, ' con estado: ', payload.order.statusOrder);

    const Prescription = Joi.object({
      file: Joi.string().required().allow(''),
      state: Joi.string().required().allow(''),
      validation: Joi.object({
        comments: Joi.string().required().allow(''),
        responsible: Joi.string().optional().allow(''), // Resolver el lunes y pasarlo a requerido y allow ''
        rut: Joi.string().required().allow(''),
        _id: Joi.string().optional().allow(''),
      }).required(),
    });

    const PrescriptionType = Joi.string().valid(
      'Presentación receta médica',
      'Venta directa (Sin receta)',
      'Venta bajo receta cheque',
      'Receta médica retenida'
    );

    const ProductOrder = Joi.object({
      batchId: Joi.string().required(),
      bioequivalent: Joi.boolean().required(),
      cooled: Joi.boolean().required(),
      ean: Joi.string().required().allow(''),
      expiration: Joi.number().required(),
      fullName: Joi.string().required(),
      laboratoryName: Joi.string().required().allow(''),
      liquid: Joi.boolean().optional().allow(null),
      normalUnitPrice: Joi.number().required(),
      pharmaceuticalForm: Joi.string().required().allow(''),
      photoURL: Joi.string().required().allow(''),
      prescription: Prescription.required(),
      prescriptionType: PrescriptionType.required(),
      presentation: Joi.string().required().allow(''),
      price: Joi.number().required(),
      productCategory: Joi.string().required().allow(''),
      productSubCategory: Joi.array().items(Joi.string()).required(),
      qty: Joi.number().required(),
      quantityPerContainer: Joi.string().required().allow(''),
      recommendations: Joi.string().required().allow(''),
      requirePrescription: Joi.boolean().required(),
      shortName: Joi.string().required().allow(''),
      sku: Joi.string().required(),
      pricePaidPerUnit: Joi.number().optional(),
      discountPerUnit: Joi.number().optional(),
      referenceId: Joi.number().optional().allow(null),
      lineNumber: Joi.number().optional().allow(null),
    });

    const Billing = Joi.object({}).optional();

    const orderBackToFlowSchema = Joi.object({
      order: Joi.object({
        id: Joi.string().required(),
        billing: Billing,
        statusOrder: Joi.string().required(),
        productsOrder: Joi.array().items(ProductOrder).required(),
        createdAt: Joi.date().optional(),
        customer: Joi.string().optional(),
        delivery: Joi.object({}).optional(),
        documentos: Joi.object({}).optional(),
        inPharmacy: Joi.string().optional(),
        modifiedPrice: Joi.boolean().optional(),
        note: Joi.string().optional(),
        payment: Joi.object({}).optional(),
        responsible: Joi.string().optional(),
        resumeOrder: Joi.object({}).optional(),
        provisionalStatusOrder: Joi.string().optional(),
        provisionalStatusOrderDate: Joi.date().optional(),
        tracking: Joi.array().items(Joi.object({}).optional()).optional(),
        seguroComplementario: Joi.object({}).optional(),
        observations: Joi.array().items(Joi.object({}).optional()).optional(),
        history: Joi.array().items(Joi.object({}).optional()).optional(),
        extras: Joi.object({}).optional(),
      }).required(),
      responsible: Joi.string().required(),
    });

    const { error } = orderBackToFlowSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, orderBackToFlowSchema, error.message);
    }

    const orderVo = new OrdenOValue().regresarOrderToFlow(payload.order);

    if (!orderVo) throw new ApiResponse(HttpCodes.BAD_REQUEST, orderVo, 'Error al regresar la orden al flujo.');

    await this.updateProvisionalStatusOrder({
      id: payload.order.id,
      provisionalStatusOrder: 'Pendiente',
    });

    await this.updateStatusOrder(orderVo, payload.order.statusOrder, orderVo.statusOrder, payload.responsible);
  };

  cancelarOrden = async (payload: ICancelarOrder) => {
    const cancelarOrdenSchema = Joi.object({
      id: Joi.string().required(),
      responsible: Joi.string().required(),
      reason: Joi.string().required(),
      toPos: Joi.boolean().required(),
    });

    const { error } = cancelarOrdenSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, cancelarOrdenSchema, error.message);
    }

    // Actualizar Provisional Status Order a Pendiente
    await this.updateProvisionalStatusOrder({
      id: payload.id,
      provisionalStatusOrder: 'Pendiente',
    });

    await this.notificarCambioOrden(payload.id);

    const ordenACancelar = await this.ordenRepository.findOrderById(payload.id);

    if (!ordenACancelar)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenACancelar, 'Error al buscar la orden a cancelar.');

    console.log('----- Orden a Cancelar: ', ordenACancelar.id, ' con estado: ', ordenACancelar.statusOrder);

    if (!ordenStateMachine(ordenACancelar.statusOrder, 'CANCELADO', ordenACancelar))
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenACancelar, 'Error en la maquina de estados.');

    const ordenCancelada = await this.ordenRepository.updateOrderStatus(payload.id, 'CANCELADO');

    if (!ordenCancelada) throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenCancelada, 'Error al cancelar la orden.');

    console.log('----- Orden Cancelada: ', ordenCancelada.id, ' con estado: ', ordenCancelada.statusOrder);

    await this.updateOrderTracking({
      id: payload.id,
      responsible: payload.responsible,
      statusOrder: 'CANCELADO',
      reason: payload.reason,
    });

    await this.updateOrderHistory({
      id: payload.id,
      type: 'status',
      responsible: payload.responsible,
      changeFrom: ordenACancelar.statusOrder,
      changeTo: 'CANCELADO',
      aditionalInfo: {
        product_sku: '',
        comments: payload.reason,
      },
    });

    await notificarEstadoDeOrden(ordenCancelada, payload.toPos);

    await actualizarOrdenEccomerce(ordenCancelada);

    await this.updateProvisionalStatusOrder({
      id: payload.id,
      provisionalStatusOrder: '',
    });

    await this.notificarCambioOrden(payload.id);
  };

  updateTrackingNumber = async (payload: IUpdateTrackingNumber) => {
    const updateTrackingNumberSchema = Joi.object({
      id: Joi.string().required(),
      trackingNumber: Joi.string().required(),
      responsible: Joi.string().required(),
    });

    const { error } = updateTrackingNumberSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updateTrackingNumberSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.updateTrackingNumber(payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el tracking de la orden.');

    console.log('----- Tracking Number Actualizado: ', ordenActualizada.id, ' con numero: ', ordenActualizada.delivery.provider.trackingNumber);

    await this.updateOrderHistory({
      id: payload.id,
      type: 'numero-seguimiento',
      responsible: payload.responsible,
      changeFrom: '',
      changeTo: payload.trackingNumber,
      aditionalInfo: {
        product_sku: '',
        comments: '',
      },
    });

    await this.notificarCambioOrden(payload.id);
  };

  orderSeguroComplementario = async (order: OrdenEntity) => {
    await this.updateStatusSeguroComplementario({
      id: order.id,
      status: 'Pendiente',
    });

    const seguroComplementarioVO = new OrdenOValue().generarSeguroComplementario(order);

    console.log('----- Generar Seguro Complementario: ', seguroComplementarioVO);

    await this.generarSeguroComplementario(seguroComplementarioVO);
  };

  updateStatusSeguroComplementario = async (payload: IUpdateStatusSeguroComplementario) => {
    const updateStatusSeguroComplementarioSchema = Joi.object({
      id: Joi.string().required(),
      status: Joi.string().required(),
    });

    const { error } = updateStatusSeguroComplementarioSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updateStatusSeguroComplementarioSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.updateStatusSeguroComplementario(payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el estado del seguro.');
  };

  updateEstadoCedulaIdentidad = async (payload: IUpdateEstadoCedulaIdentidad) => {
    const updateEstadoCedulaIdentidadSchema = Joi.object({
      orderId: Joi.string().required(),
      estado: Joi.string().required(),
      responsible: Joi.string().required(),
    });

    const { error } = updateEstadoCedulaIdentidadSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updateEstadoCedulaIdentidadSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.updateEstadoCedulaIdentidad(payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el estado de la cédula.');
  };

  // ------------ Casos de Usos para Documentos Tributarios ------------

  generarDocumentosTributarios = async (payload: IDocumentoTributarioEventInput) => {
    const generarDocumentosTributariosSchema = Joi.object({
      accion: Joi.string().required(),
      origen: Joi.string().required(),
      payload: Joi.object({
        comentario: Joi.string().required(),
        delivery: Joi.object({
          precio_unitario: Joi.number().required(),
          titulo: Joi.string().required(),
        }).optional(),
        id_interno: Joi.string().required(),
        productos: Joi.array()
          .items(
            Joi.object({
              cantidad: Joi.number().required(),
              descuento: Joi.number().required(),
              precio_unitario: Joi.number().required(),
              titulo: Joi.string().required(),
            })
          )
          .required(),
        proveedor: Joi.string().required(),
        tipo_documento: Joi.string().required(),
        tipo_pago: Joi.string().required(),
      }).required(),
    });

    const { error } = generarDocumentosTributariosSchema.validate(payload);

    if (error) {
      console.log('Error en el Schema Generar Documento Tributario: ', error.message);
      throw new ApiResponse(HttpCodes.BAD_REQUEST, generarDocumentosTributariosSchema, error.message);
    }

    // Check if the order has already a billing
    const ordenConBilling = await this.ordenRepository.findOrderById(payload.payload.id_interno);

    if (!ordenConBilling)
      throw new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ordenConBilling,
        'Error al buscar la orden para generar documentos.'
      );

    if (ordenConBilling.billing.urlBilling.length > 0 && ordenConBilling.billing.number.length > 0) {
      console.log(
        '----- Orden ya se encuentra con Documentos Tributarios no se volvera a emitir otro documento: ',
        ordenConBilling
      );
      return;
    }

    await emitirDocumentoTributario(payload);
  };

  asignarDocumentosTributarios = async (payload: IAsignarDocumentosTributarios) => {
    const asignarDocumentosTributariosSchema = Joi.object({
      orderId: Joi.string().required(),
      emitter: Joi.string().required(),
      number: Joi.string().required(),
      type: Joi.string().required(),
      urlBilling: Joi.string().required(),
      urlTimbre: Joi.string().required().allow(''),
      emissionDate: Joi.date().required(),
      referenceDocumentId: Joi.string().required(),
    });

    const { error } = asignarDocumentosTributariosSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, asignarDocumentosTributariosSchema, error.message);
    }

    const ordenConBilling = await this.ordenRepository.asignarDocumentosTributarios({
      ...payload,
      status: 'Aprobado',
    });

    if (!ordenConBilling)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenConBilling, 'Error al asignar documentos tributarios.');

    console.log('-------- Documentos Tributarios Asignados: ', ordenConBilling);

    const isOrderDelivery = ordenConBilling.delivery.method === 'DELIVERY' && ordenConBilling.delivery.type !== '';

    await this.notificarCambioOrden(ordenConBilling.id);

    await this.updateStatusOrder(
      ordenConBilling,
      ordenConBilling.statusOrder,
      isOrderDelivery ? 'ASIGNAR_A_DELIVERY' : 'LISTO_PARA_RETIRO',
      'SISTEMA'
    );
  };

  generarCourier = async (payload: ICourierEventInput) => {
    const generarCourierSchema = Joi.object({
      accion: Joi.string().required(),
      origen: Joi.string().required(),
      payload: Joi.object({
        courier: Joi.string().required(),
        direccion_origen: Joi.object({
          calle: Joi.string().required(),
          comuna: Joi.string().required(),
          numero_calle: Joi.string().required().allow(''),
          pais: Joi.string().required(),
          referencias: Joi.string().required().allow(''),
          region: Joi.string().required(),
        }).required(),
        direccion: Joi.object({
          calle: Joi.string().required(),
          comuna: Joi.string().required(),
          numero_calle: Joi.string().required().allow(''),
          pais: Joi.string().required(),
          referencias: Joi.string().required().allow(''),
          region: Joi.string().required(),
        }).required(),
        id_interno: Joi.string().required(),
        notas: Joi.string().required().allow(''),
        tipo_delivery: Joi.string().required(),
        usuario: Joi.object({
          apellido: Joi.string().required().allow(''),
          correo_electronico: Joi.string().required(),
          nombre: Joi.string().required(),
          telefono: Joi.string().required(),
        }).required(),
      }).required(),
    });

    const { error } = generarCourierSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, generarCourierSchema, error.message);
    }

    // Check if the order has already a courier
    const ordenConCourier = await this.ordenRepository.findOrderById(payload.payload.id_interno);

    if (!ordenConCourier)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenConCourier, 'Error al buscar la orden para generar courier.');

    if (
      ordenConCourier.delivery.provider.urlLabel.length > 0 &&
      ordenConCourier.delivery.provider.trackingNumber.length > 0
    ) {
      console.log('----- Orden ya se encuentra con Courier no se volvera a emitir otro courier: ', ordenConCourier);
      return;
    }

    await generarCourierEvent(payload);
  };

  asignarCourier = async (payload: IAsignarCourier) => {
    const asignarCourierSchema = Joi.object({
      orderId: Joi.string().required(),
      provider: Joi.string().required(),
      urlLabel: Joi.string().required(),
      trackingNumber: Joi.string().required(),
      emissionDate: Joi.number().required(),
      deliveryTracking: Joi.object({
        fecha: Joi.number().required(),
        estado: Joi.string().required(),
        comentario: Joi.string().required().allow(''),
        evidencias: Joi.array().items(Joi.string()).required(),
      }).required(),
    });

    const { error } = asignarCourierSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, asignarCourierSchema, error.message);
    }

    const ordenConCourier = await this.ordenRepository.asignarCourier(payload);

    if (!ordenConCourier) throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenConCourier, 'Error al asignar courier.');

    await this.updateStatusCourier({
      id: payload.orderId,
      status: 'Asignado',
      statusDate: new Date(),
    });

    console.log('-------- Courier Asignado: ', ordenConCourier);

    await this.updateStatusOrder(ordenConCourier, ordenConCourier.statusOrder, 'ASIGNAR_A_DELIVERY', 'SISTEMA');
  };

  actualizarOrderStatusWebhook = async (payload: IActualizarOrderStatusWebhook) => {
    const actualizarOrderStatusWebhookSchema = Joi.object({
      orderId: Joi.string().required(),
      deliveryTracking: Joi.object({
        fecha: Joi.date().required(),
        estado: Joi.string().required(),
        comentario: Joi.string().required().allow(''),
        evidencias: Joi.array().items(Joi.string()).required(),
      }).required(),
    });

    const { error } = actualizarOrderStatusWebhookSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, actualizarOrderStatusWebhookSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.actualizarOrderDeliveryTracking(payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el estado de la orden.');

    const statusCourier = diccionarioStatusCourier[payload.deliveryTracking.estado];

    if (statusCourier) {
      await this.updateStatusOrder(ordenActualizada, ordenActualizada.statusOrder, statusCourier, 'SISTEMA');
    }
  };

  guardarSeguroComplementario = async (payload: IGuardarSeguroComplementario) => {
    const guardarSeguroComplementarioSchema = Joi.object({
      orderId: Joi.string().required(),
      nombreBeneficiario: Joi.string().required(),
      id_externo: Joi.number().required(),
      estado_credencial: Joi.string().required(),
      credencial_url: Joi.string().required(),
      deducible_total: Joi.number().required(),
      descuento_total: Joi.number().required(),
      tipo_documento_emitir: Joi.string().valid('bill', 'dispatch_note').required(),
      fecha_creacion: Joi.number().required(),
      id: Joi.string().required(),
      productos: Joi.array()
        .items(
          Joi.object({
            sku: Joi.string().required(),
            lote: Joi.string().required(),
            descuento_unitario: Joi.number().required(),
            cantidad_afectada: Joi.number().required(),
            copago_unitario: Joi.number().required(),
            precio_pagado_por_unidad: Joi.number().required(),
            deducible_unitario: Joi.number().required(),
            nombre: Joi.string().required(),
            observacion: Joi.string().required().allow(''),
          })
        )
        .required(),
      rut: Joi.string().required(),
      aseguradora_rut: Joi.string().required(),
      aseguradora_nombre: Joi.string().required(),
    });

    const { error } = guardarSeguroComplementarioSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, guardarSeguroComplementarioSchema, error.message);
    }

    const ordenConSeguroComplementario = await this.ordenRepository.guardarSeguroComplementario(payload);

    if (!ordenConSeguroComplementario)
      throw new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ordenConSeguroComplementario,
        'Error al guardar el seguro complementario.'
      );

    console.log('-------- Seguro Complementario Guardado: ', ordenConSeguroComplementario);
  };

  generarSeguroComplementario = async (payload: IGenerarSeguroComplementario) => {
    const generarSeguroComplementarioSchema = Joi.object({
      cliente: Joi.object({
        apellido: Joi.string().required(),
        correo_electronico: Joi.string().required(),
        nombre: Joi.string().required(),
        telefono: Joi.string().required(),
      }).required(),
      cotizacion: Joi.object({
        id: Joi.string().required(),
        productos: Joi.array()
          .items(
            Joi.object({
              cantidad: Joi.number().required(),
              copago_unitario: Joi.number().required(),
              deducible_unitario: Joi.number().required(),
              descuento_unitario: Joi.number().required(),
              lote: Joi.string().required(),
              nombre: Joi.string().required(),
              precio_unitario: Joi.number().required(),
              sku: Joi.string().required(),
            })
          )
          .required(),
        tipo_documento: Joi.string().required(),
      }).required(),
      id_interno: Joi.string().required(),
      orden: Joi.object({
        precio_delivery: Joi.number().required(),
        productos: Joi.array()
          .items(
            Joi.object({
              cantidad: Joi.number().required(),
              lote: Joi.string().required(),
              nombre: Joi.string().required(),
              precio_unitario: Joi.number().required(),
              sku: Joi.string().required(),
            })
          )
          .required(),
      }).required(),
      proveedor: Joi.string().required(),
    });

    const { error } = generarSeguroComplementarioSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, generarSeguroComplementarioSchema, error.message);
    }

    await generarSeguroComplementarioEvent({
      accion: 'confirmar-seguro-complementario',
      origen: 'SISTEMA ORDENES',
      payload,
    });
  };

  confirmarSeguroComplementario = async (payload: IAsignarSeguroComplementario) => {
    const asignarSeguroComplementarioSchema = Joi.object({
      internal_id: Joi.string().required(),
      vouchers_url: Joi.array().items(Joi.string()).required(),
      documents: Joi.array()
        .items(
          Joi.object({
            emitter: Joi.string().required(),
            number: Joi.string().required(),
            type: Joi.string().required(),
            urlBilling: Joi.string().required(),
            urlTimbre: Joi.string().required(),
            emissionDate: Joi.date().required(),
            referenceDocumentId: Joi.string().required(),
            destinatario: Joi.string().required(),
          })
        )
        .required(),
    });

    const { error } = asignarSeguroComplementarioSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, asignarSeguroComplementarioSchema, error.message);
    }

    const ordenConSeguroComplementario = await this.ordenRepository.confirmarSeguroComplementario(payload);

    if (!ordenConSeguroComplementario)
      throw new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ordenConSeguroComplementario,
        'Error al confirmar el seguro complementario.'
      );

    console.log('-------- Seguro Complementario Confirmado: ', ordenConSeguroComplementario);

    await this.updateStatusSeguroComplementario({
      id: ordenConSeguroComplementario.id,
      status: 'Aprobado',
    });

    const isOrderDelivery =
      ordenConSeguroComplementario.delivery.method === 'DELIVERY' && ordenConSeguroComplementario.delivery.type !== '';

    await this.updateStatusOrder(
      ordenConSeguroComplementario,
      ordenConSeguroComplementario.statusOrder,
      isOrderDelivery ? 'ASIGNAR_A_DELIVERY' : 'LISTO_PARA_RETIRO',
      'SISTEMA'
    );
  };
}
