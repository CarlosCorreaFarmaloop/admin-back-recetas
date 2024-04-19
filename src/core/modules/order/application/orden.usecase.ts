import { ICotizacionRespository } from '../../cotizacion/domain/cotizacion.repository';
import { IOrdenRepository } from '../domain/order.repository';
import { IOrdenUseCase } from './orden.usecase.interface';
import { OrdenOValue } from './orden.vo';
import { IAsignarDocumentosTributarios, IOrigin } from '.././../../../interface/event';
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
import { emitirDocumentoTributario, notificarEstadoDeOrden } from '../domain/eventos';
import { notificarCambioOrdenSQS } from '../domain/sqs';
import { IDocumentoTributarioEventInput } from '../domain/documentos_tributarios.interface';

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
      // Joi Schema ICreateOrder
      const createCompleteOrderSchema = Joi.object({
        id: Joi.string().required(),
        cotizacion: Joi.string().optional(),
        payment: Joi.object({
          payment: Joi.object({
            amount: Joi.number().required(),
            method: Joi.string().required(),
            originCode: Joi.string().required(),
            status: Joi.string().required(),
            wallet: Joi.string().required(),
          }).required(),
        }).required(),
        customer: Joi.string().required(),
        extras: Joi.object({
          referrer: Joi.string().required().allow(''),
        }).required(),
        // Array ProductOrder
        productsOrder: Joi.array()
          .items(
            Joi.object({
              batchId: Joi.string().required(),
              bioequivalent: Joi.boolean().required(),
              cooled: Joi.boolean().required(),
              ean: Joi.string().required(),
              modified: Joi.boolean().required(),
              expiration: Joi.number().required(),
              laboratoryName: Joi.string().required(),
              lineNumber: Joi.number().optional(),
              liquid: Joi.boolean().required(),
              fullName: Joi.string().required(),
              normalUnitPrice: Joi.number().required(),
              originalPrice: Joi.number().required(),
              pharmaceuticalForm: Joi.string().required().allow(''),
              photoURL: Joi.string().required(),
              prescription: Joi.object({
                file: Joi.string().required().allow(''),
                state: Joi.string().required().allow(''),
                validation: Joi.object({
                  comments: Joi.string().required().allow(''),
                  rut: Joi.string().required().allow(''),
                  responsible: Joi.string().required().allow(''),
                }).required(),
              }).optional(),
              prescriptionType: Joi.string().required(),
              presentation: Joi.string().required(),
              price: Joi.number().required(),
              productCategory: Joi.string().required(),
              productSubCategory: Joi.array().items(Joi.string()).required(),
              qty: Joi.number().required(),
              quantityPerContainer: Joi.string().required().allow(''),
              recommendations: Joi.string().required().allow(''),
              referenceId: Joi.number().optional(),
              refundedQuantity: Joi.number().optional(),
              requirePrescription: Joi.boolean().required(),
              shortName: Joi.string().optional().allow(''),
              sku: Joi.string().required(),
            })
          )
          .required(),
        resumeOrder: Joi.object({
          canal: Joi.string().optional().allow(''),
          convenio: Joi.string().optional(),
          deliveryPrice: Joi.number().required(),
          discount: Joi.object({
            details: Joi.array()
              .items(
                Joi.object({
                  descuentos_unitarios: Joi.array()
                    .items(
                      Joi.object({
                        cantidad: Joi.number().required(),
                        descuento_unitario: Joi.number().required(),
                        expireDate: Joi.string().required(),
                        lote_id: Joi.string().required(),
                        mg: Joi.number().required(),
                        price: Joi.number().required(),
                        sku: Joi.string().required(),
                      })
                    )
                    .required(),
                  discount: Joi.number().required(),
                  promotionCode: Joi.string().required(),
                  reference: Joi.string().required(),
                  type: Joi.string().required(),
                })
              )
              .required(),
            total: Joi.number().required(),
          }).required(),
          nroProducts: Joi.number().required(),
          subtotal: Joi.number().required(),
          totalPrice: Joi.number().required(),
        }).required(),
        statusOrder: Joi.string().required(),
        delivery: Joi.object({
          delivery_address: Joi.object({
            comuna: Joi.string().required(),
            dpto: Joi.string().optional().allow(''),
            firstName: Joi.string().required(),
            lastName: Joi.string().optional().allow(''),
            fullAddress: Joi.string().optional().allow(''),
            homeType: Joi.string().optional().allow(''),
            phone: Joi.string().required(),
            region: Joi.string().required(),
            streetName: Joi.string().optional().allow(''),
            streetNumber: Joi.string().optional().allow(''),
          }).required(),
          method: Joi.string().required(),
          type: Joi.string().required(),
          cost: Joi.number().required(),
          compromiso_entrega: Joi.string().required(),
        }).required(),
      });

      const { error } = createCompleteOrderSchema.validate(order);

      if (error) {
        throw new ApiResponse(HttpCodes.BAD_REQUEST, order, error.message);
      }

      const ordenCompleta = new OrdenOValue().completeOrderFromEcommerce(order);

      // const nuevaOrdenCompleta = await this.createOrder(new_order, origin);
      const nuevaOrden = await this.ordenRepository.createOrderFromEcommerce(ordenCompleta);

      if (!nuevaOrden) {
        throw new ApiResponse(HttpCodes.BAD_REQUEST, nuevaOrden);
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
      const createPartialOrderSchema = Joi.object({
        id: Joi.string().required(),
        cotizacion: Joi.string().optional(),
        customer: Joi.string().required(),
        extras: Joi.object({
          referrer: Joi.string().required().allow(''),
        }).required(),
        payment: Joi.object({
          payment: Joi.object({
            amount: Joi.number().optional(),
            method: Joi.string().optional(),
            originCode: Joi.string().optional(),
            status: Joi.string().required(),
            wallet: Joi.string().required(),
          }).required(),
        }).optional(),
        // Array ProductOrder
        productsOrder: Joi.array()
          .items(
            Joi.object({
              batchId: Joi.string().required(),
              bioequivalent: Joi.boolean().required(),
              cooled: Joi.boolean().required(),
              ean: Joi.string().required(),
              expiration: Joi.number().required(),
              laboratoryName: Joi.string().required(),
              lineNumber: Joi.number().optional(),
              liquid: Joi.boolean().required(),
              modified: Joi.boolean().required(),
              fullName: Joi.string().required(),
              normalUnitPrice: Joi.number().required(),
              originalPrice: Joi.number().required(),
              pharmaceuticalForm: Joi.string().required().allow(''),
              photoURL: Joi.string().required(),
              prescription: Joi.object({
                file: Joi.string().required().allow(''),
                state: Joi.string().required().allow(''),
                validation: Joi.object({
                  comments: Joi.string().required().allow(''),
                  rut: Joi.string().required().allow(''),
                  responsible: Joi.string().required().allow(''),
                }).required(),
              }).optional(),
              prescriptionType: Joi.string().required(),
              presentation: Joi.string().required(),
              price: Joi.number().required(),
              productCategory: Joi.string().required(),
              productSubCategory: Joi.array().items(Joi.string()).required(),
              qty: Joi.number().required(),
              quantityPerContainer: Joi.string().required().allow(''),
              recommendations: Joi.string().required().allow(''),
              referenceId: Joi.number().optional(),
              refundedQuantity: Joi.number().optional(),
              requirePrescription: Joi.boolean().required(),
              shortName: Joi.string().optional().allow(''),
              sku: Joi.string().required(),
            })
          )
          .required(),
        resumeOrder: Joi.object({
          canal: Joi.string().optional().allow(''),
          convenio: Joi.string().optional(),
          deliveryPrice: Joi.number().required(),
          discount: Joi.object({
            details: Joi.array()
              .items(
                Joi.object({
                  descuentos_unitarios: Joi.array()
                    .items(
                      Joi.object({
                        cantidad: Joi.number().required(),
                        descuento_unitario: Joi.number().required(),
                        expireDate: Joi.string().required(),
                        lote_id: Joi.string().required(),
                        mg: Joi.number().required(),
                        price: Joi.number().required(),
                        sku: Joi.string().required(),
                      })
                    )
                    .required(),
                  discount: Joi.number().required(),
                  promotionCode: Joi.string().required(),
                  reference: Joi.string().required(),
                  type: Joi.string().required(),
                })
              )
              .required(),
            total: Joi.number().required(),
          }).required(),
          nroProducts: Joi.number().required(),
          subtotal: Joi.number().required(),
          totalPrice: Joi.number().required(),
        }).required(),
        statusOrder: Joi.string().required(),
        delivery: Joi.object({
          delivery_address: Joi.object({
            comuna: Joi.string().required(),
            dpto: Joi.string().optional().allow(''),
            firstName: Joi.string().required(),
            lastName: Joi.string().optional().allow(''),
            fullAddress: Joi.string().optional().allow(''),
            homeType: Joi.string().optional().allow(''),
            phone: Joi.string().required(),
            region: Joi.string().required(),
            streetName: Joi.string().optional().allow(''),
            streetNumber: Joi.string().optional().allow(''),
          }).required(),
          method: Joi.string().required(),
          type: Joi.string().required(),
          cost: Joi.number().required(),
          compromiso_entrega: Joi.string().required(),
        }).required(),
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
    }
  }

  async updatePayment(payload: IUpdatePaymentOrden, origin: IOrigin) {
    const updatePaymentSchema = Joi.object({
      id: Joi.string().required(),
      payment: Joi.object({
        payment: Joi.object({
          amount: Joi.number().required(),
          method: Joi.string().required(),
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

    const ordenActualizada = await this.ordenRepository.updatePayment(payload);

    if (!ordenActualizada) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar la orden.');
    }

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
      await this.updateStatusOrder(ordenActualizada, ordenActualizada.statusOrder, 'OBSERVACIONES_RECETAS', 'SISTEMA'); // Llamas Actualiza Estado Usecase (orden, CREADO, OBSERVACIONES_RECETAS)

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

  updateStatusOrder = async (
    order: OrdenEntity,
    previousStatus: StatusOrder,
    newStatus: StatusOrder,
    responsible: string
  ) => {
    try {
      // Actualizar Provisional Status Order a Pendiente
      await this.updateProvisionalStatusOrder({
        id: order.id,
        provisionalStatusOrder: 'Pendiente',
      });

      await this.notificarCambioOrden(order.id);

      if (!ordenStateMachine(previousStatus, newStatus, order))
        throw new ApiResponse(HttpCodes.BAD_REQUEST, order, 'Error en la maquina de estados.');

      console.log('----- Actualizando Orden: ', order.id, ' de ', previousStatus, ' a ', newStatus);

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

      if (previousStatus === 'PREPARANDO') {
        await this.updateOrderProvider({
          id: order.id,
          providerName: order?.delivery?.provider.provider,
          serviceId: order?.delivery?.provider.service_id,
        });
      }

      if (previousStatus === 'PREPARANDO' && newStatus === 'ASIGNAR_A_DELIVERY') {
        await this.updateAsignarCourier({
          id: order.id,
          status: 'Pendiente',
          statusDate: new Date(),
        });

        await this.updateStatusBilling({
          id: order.id,
          status: 'Pendiente',
          statusDate: new Date(),
        });

        // Emitir Documentos Tributarios
        // Emitir Courier

        // Emitir Documentos Tributarios
        const documentoVO = new OrdenOValue().generarDocumentosTributarios(order);

        console.log('----- DocumentoVO: ', documentoVO);

        // TODO: Preguntar Documentos

        await this.generarDocumentosTributarios({
          accion: 'generar-documento-tributario',
          origen: 'SISTEMA ORDENES',
          payload: documentoVO,
        });
      }

      if (previousStatus === 'PREPARANDO' && newStatus === 'LISTO_PARA_RETIRO') {
        await this.updateStatusBilling({
          id: order.id,
          status: 'Pendiente',
          statusDate: new Date(),
        });

        // Emitir Documentos Tributarios
        const documentoVO = new OrdenOValue().generarDocumentosTributarios(order);

        // TODO: Preguntar Documentos

        await this.generarDocumentosTributarios({
          accion: 'generar-documento-tributario',
          origen: 'SISTEMA ORDENES',
          payload: documentoVO,
        });
      }

      // Notificar Cliente
      await notificarEstadoDeOrden(order);

      // Cambiar Provisional Status Order
      await this.updateProvisionalStatusOrder({
        id: order.id,
        provisionalStatusOrder: '',
      });

      // Notificar Cambio de Orden a SQS
      await this.notificarCambioOrden(order.id);
    } catch (error) {
      console.log('Error en el Usecase Update Status Order: ', error);

      await this.updateProvisionalStatusOrder({
        id: order.id,
        provisionalStatusOrder: 'Error',
      });

      await this.notificarCambioOrden(order.id);
    }
  };

  updateOrderTracking = async (payload: IUpdateOrderTracking) => {
    const ordenTrackingActualizado = await this.ordenRepository.updateOrderTracking(payload.id, {
      date: new Date(),
      responsible: payload.responsible,
      toStatus: payload.statusOrder,
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

  updateAsignarCourier = async (payload: IUpdateProviderStatus) => {
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
        }).required(),
      }).required(),
    });

    const { error } = uploadPrescriptionSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, uploadPrescriptionSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.uploadPrescriptionFile(payload);

    if (!ordenActualizada) throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al subir la receta.');

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
      }).required(),
    });

    const { error } = updatePrescriptionStateSchema.validate(payload);

    if (error) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updatePrescriptionStateSchema, error.message);
    }

    const ordenActualizada = await this.ordenRepository.updatePrescriptionState(payload);

    if (!ordenActualizada)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenActualizada, 'Error al actualizar el estado de la receta.');

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

    const ordenConBilling = await this.ordenRepository.asignarDocumentosTributarios(payload);

    if (!ordenConBilling)
      throw new ApiResponse(HttpCodes.BAD_REQUEST, ordenConBilling, 'Error al asignar documentos tributarios.');

    console.log('-------- Documentos Tributarios Asignados: ', ordenConBilling);
  };
}
