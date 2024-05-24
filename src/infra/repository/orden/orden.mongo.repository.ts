import { IOrdenRepository } from '../../../core/modules/order/domain/order.repository';
import OrderModel from '../../models/orden.model';
import {
  ICrearOrden,
  ICrearPartialOrden,
  IUpdateBillingStatus,
  IUpdatePrescriptionState,
  IUpdateProvider,
  IUpdateProviderStatus,
  IUploadPrescription,
} from '../../../core/modules/order/application/interface';
import { IOrderHistory, StatusOrder, Tracking } from '../../../core/modules/order/domain/order.entity';
import {
  IActualizarOrderStatusWebhookPayload,
  IAddOrderdObservation,
  IAsignarCourierPayload,
  IAsignarDocumentosTributariosPayload,
  IAsignarSeguroComplementarioPayload,
  IUpdateEstadoCedulaIdentidadPayload,
  IUpdateProvisionalStatusOrder,
  IUpdateStatusSeguroComplementarioPayload,
  IUpdateCanalConvenio,
  IUpdatePaymentRepository,
  IUpdateTrackingNumber,
} from '../../../core/modules/order/domain/order.respository.interface';
import { IGuardarSeguroComplementario } from 'src/interface/seguroComplementario.interface';

export class OrdenMongoRepository implements IOrdenRepository {
  createOrderFromEcommerce = async (payload: ICrearOrden) => {
    console.log('------Order To Create ----', JSON.stringify(payload, null, 2));
    return await OrderModel.create(payload);
  };

  createPartialOrder = async (payload: ICrearPartialOrden) => {
    console.log('------Order To Create ----', JSON.stringify(payload, null, 2));
    return await OrderModel.create(payload);
  };

  createCompleteOrder = async (payload: ICrearOrden) => {
    console.log('------Order To Create ----', JSON.stringify(payload, null, 2));
    return await OrderModel.create(payload);
  };

  updatePayment = async (payload: IUpdatePaymentRepository) => {
    console.log('------Order To Update ----', JSON.stringify(payload, null, 2));

    return await OrderModel.findOneAndUpdate(
      { id: payload.id },
      { $set: { payments: payload.payment } },
      { new: true, upsert: true }
    )
      .then((res) => res?.toObject())
      .catch((err) => err);
  };

  findOrderById = async (id: string) => {
    console.log('------Order To Find ----', id);
    const result = await OrderModel.findOne({ id }).then((res) => res?.toObject());

    console.log('-----Order:', result);

    return result;
  };

  updateOrderStatus = async (id: string, status: StatusOrder) => {
    console.log('------Order To Update Status ----', id, status);
    return await OrderModel.findOneAndUpdate({ id }, { $set: { statusOrder: status } }, { new: true, upsert: true });
  };

  updateOrderHistory = async (id: string, payload: IOrderHistory) => {
    console.log('------Order To Update History ----', JSON.stringify(payload, null, 2));

    return await OrderModel.findOneAndUpdate({ id }, { $push: { history: payload } }, { new: true, upsert: true });
  };

  updateOrderTracking = async (id: string, payload: Tracking) => {
    console.log('------Order To Update Tracking ----', JSON.stringify(payload, null, 2));

    return await OrderModel.findOneAndUpdate({ id }, { $push: { tracking: payload } }, { new: true, upsert: true });
  };

  updateOrderProviderStatus = async (id: string, payload: IUpdateProviderStatus) => {
    console.log('------Order To Update Provider Status ---- ', JSON.stringify(payload, null, 2));

    return await OrderModel.findOneAndUpdate(
      { id },
      { $set: { 'delivery.provider.status': payload.status, 'delivery.provider.statusDate': payload.statusDate } },
      { new: true }
    );
  };

  updateOrderBillingStatus = async (id: string, payload: IUpdateBillingStatus) => {
    console.log('------Order To Update Billing Status ---- ', JSON.stringify(payload, null, 2));

    return await OrderModel.findOneAndUpdate(
      { id },
      { $set: { 'billing.status': payload.status, 'billing.statusDate': payload.statusDate } },
      { new: true }
    );
  };

  updateOrderProvider = async (id: string, payload: IUpdateProvider) => {
    console.log('------Order To Update Provider Name ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id },
      {
        $set: {
          'delivery.provider.provider': payload.providerName,
          'delivery.provider.service_id': payload.serviceId,
          'delivery.provider.note': payload.note,
        },
      },
      { new: true }
    );
  };

  updateProvisionalStatusOrder = async (payload: IUpdateProvisionalStatusOrder) => {
    console.log('------Order To Update Provisional Status ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.id },
      {
        $set: {
          provisionalStatusOrder: payload.provisionalStatusOrder,
          provisionalStatusOrderDate: payload.provisionalStatusOrderDate,
        },
      },
      { new: true }
    );
  };

  uploadPrescriptionFile = async (payload: IUploadPrescription) => {
    console.log('------Order To Upload Prescription ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      {
        id: payload.id,
        'productsOrder.sku': payload.productOrder.sku,
        'productsOrder.batchId': payload.productOrder.batchId,
      },
      {
        $set: {
          'productsOrder.$[elem].prescription.file': payload.productOrder.prescription.file,
          'productsOrder.$[elem].prescription.state': 'Pending',
          'productsOrder.$[elem].prescription.stateDate': new Date().getTime(),
          'productsOrder.$[elem].prescription.validation.comments': '',
          'productsOrder.$[elem].prescription.validation.responsible': '',
          'productsOrder.$[elem].prescription.validation.rut': '',
        },
      },
      {
        new: true,
        arrayFilters: [{ 'elem.sku': payload.productOrder.sku, 'elem.batchId': payload.productOrder.batchId }],
      }
    );
  };

  updatePrescriptionState = async (payload: IUpdatePrescriptionState) => {
    console.log('------Order To Update Prescription State ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      {
        id: payload.id,
        'productsOrder.sku': payload.productOrder.sku,
        'productsOrder.batchId': payload.productOrder.batchId,
      },
      {
        $set: {
          'productsOrder.$[elem].prescription.state': payload.productOrder.prescription.state,
          'productsOrder.$[elem].prescription.validation': payload.productOrder.prescription.validation,
        },
      },
      {
        new: true,
        arrayFilters: [
          {
            'elem.sku': payload.productOrder.sku,
            'elem.batchId': payload.productOrder.batchId,
          },
        ],
      }
    );
  };

  updateCanalConvenio = async (payload: IUpdateCanalConvenio) => {
    console.log('------Order To Update Canal Convenio ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.id },
      {
        $set: {
          'resumeOrder.convenio': payload.convenio,
          'resumeOrder.canal': payload.canal,
        },
      },
      { new: true, upsert: true }
    );
  };

  updateEstadoCedulaIdentidad = async (payload: IUpdateEstadoCedulaIdentidadPayload) => {
    console.log('------Order To Update Estado Cedula Identidad ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.orderId },
      {
        $set: {
          'seguroComplementario.estado_credencial': payload.estado,
        },
      },
      { new: true, upsert: true }
    );
  };

  asignarDocumentosTributarios = async (payload: IAsignarDocumentosTributariosPayload) => {
    console.log('------Order To Asignar Documento Tributario ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.orderId },
      {
        $set: {
          'billing.emitter': payload.emitter,
          'billing.number': payload.number,
          'billing.type': payload.type,
          'billing.urlBilling': payload.urlBilling,
          'billing.urlTimbre': payload.urlTimbre,
          'billing.emissionDate': payload.emissionDate,
          'billing.referenceDocumentId': payload.referenceDocumentId,
          'billing.status': payload.status,
          'billing.delivery': payload.billingDelivery,
          productsOrder: payload.productsOrder,
        },
      },
      { new: true, upsert: true }
    );
  };

  asignarCourier = async (payload: IAsignarCourierPayload) => {
    console.log('------Order To Asignar Courier ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.orderId },
      {
        $set: {
          'delivery.provider.provider': payload.provider,
          'delivery.provider.urlLabel': payload.urlLabel,
          'delivery.provider.trackingNumber': payload.trackingNumber,
          'delivery.provider.emissionDate': payload.emissionDate,
        },
        $push: {
          'delivery.deliveryTracking': payload.deliveryTracking,
        },
      },
      { new: true, upsert: true }
    );
  };

  actualizarOrderDeliveryTracking = async (payload: IActualizarOrderStatusWebhookPayload) => {
    console.log('------Order To Actualizar Status Webhook ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.orderId },
      {
        $push: {
          'delivery.deliveryTracking': payload.deliveryTracking,
        },
      },
      { new: true }
    );
  };

  addOrderObservation = async (payload: IAddOrderdObservation) => {
    console.log('------Order To Add Observation ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.id },
      {
        $push: {
          observations: payload.observation,
        },
      },
      { new: true, upsert: true }
    );
  };

  updateTrackingNumber = async (payload: IUpdateTrackingNumber) => {
    console.log('------Order To Update Tracking Number ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.id },
      {
        $set: {
          'delivery.provider.trackingNumber': payload.trackingNumber,
        },
      },
      { new: true }
    );
  };

  // -------------------------------- Seguro Complemetario  --------------------------------

  guardarSeguroComplementario = async (payload: IGuardarSeguroComplementario) => {
    console.log('------Order To Guardar Seguro Complemenatrio ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.orderId },
      {
        $set: {
          seguroComplementario: {
            nombreBeneficiario: payload.nombreBeneficiario,
            id_externo: payload.id_externo,
            estado_credencial: payload.estado_credencial,
            credencial_url: payload.credencial_url,
            deducible_total: payload.deducible_total,
            descuento_total: payload.descuento_total,
            tipo_documento_emitir: payload.tipo_documento_emitir,
            fecha_creacion: payload.fecha_creacion,
            id: payload.id,
            productos: payload.productos,
            rut: payload.rut,
            aseguradora_rut: payload.aseguradora_rut,
            aseguradora_nombre: payload.aseguradora_nombre,
          },
        },
      },
      { new: true }
    );
  };

  confirmarSeguroComplementario = async (payload: IAsignarSeguroComplementarioPayload) => {
    console.log('------Order To Confirmar Seguro Complemenatrio ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.internal_id },
      {
        $set: {
          'seguroComplementario.vouchers_url': payload.vouchers_url,
          'seguroComplementario.billing': payload.documents,
        },
      },
      { new: true }
    );
  };

  updateStatusSeguroComplementario = async (payload: IUpdateStatusSeguroComplementarioPayload) => {
    console.log('------Order To Update Status Seguro Complemenatrio ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id: payload.id },
      {
        $set: {
          'seguroComplementario.status': payload.status,
          'seguroComplementario.statusDate': new Date().getTime(),
        },
      },
      { new: true }
    );
  };
}
