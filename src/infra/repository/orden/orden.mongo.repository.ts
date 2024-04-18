import { IOrdenRepository } from '../../../core/modules/order/domain/order.repository';
import OrderModel from '../../models/orden.model';
import {
  ICrearOrden,
  ICrearPartialOrden,
  IUpdateBillingStatus,
  IUpdatePaymentOrden,
  IUpdatePrescriptionState,
  IUpdateProvider,
  IUpdateProviderStatus,
  IUploadPrescription,
} from '../../../core/modules/order/application/interface';
import { IOrderHistory, StatusOrder, Tracking } from '../../../core/modules/order/domain/order.entity';
import { IUpdateProvisionalStatusOrder } from '../../../core/modules/order/domain/order.respository.interface';

export class OrdenMongoRepository implements IOrdenRepository {
  createOrderFromEcommerce = async (payload: ICrearOrden) => {
    console.log('------Order To Create ----', JSON.stringify(payload, null, 2));
    return await OrderModel.create(payload);
  };

  createPartialOrder = async (payload: ICrearPartialOrden) => {
    console.log('------Order To Create ----', JSON.stringify(payload, null, 2));
    return await OrderModel.create(payload);
  };

  updatePayment = async (payload: IUpdatePaymentOrden) => {
    console.log('------Order To Update ----', JSON.stringify(payload, null, 2));
    return await OrderModel.findOneAndUpdate({ id: payload.id }, { $set: payload }, { new: true })
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
      { new: true, upsert: true }
    );
  };

  updateOrderBillingStatus = async (id: string, payload: IUpdateBillingStatus) => {
    console.log('------Order To Update Billing Status ---- ', JSON.stringify(payload, null, 2));

    return await OrderModel.findOneAndUpdate(
      { id },
      { $set: { 'billing.status': payload.status, 'billing.statusDate': payload.statusDate } },
      { new: true, upsert: true }
    );
  };

  updateOrderProvider = async (id: string, payload: IUpdateProvider) => {
    console.log('------Order To Update Provider Name ---- ', payload);

    return await OrderModel.findOneAndUpdate(
      { id },
      {
        $set: { 'delivery.provider.provider': payload.providerName, 'delivery.provider.service_id': payload.serviceId },
      },
      { new: true, upsert: true }
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
      { new: true, upsert: true }
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
          'productsOrder.$.prescription.file': payload.productOrder.prescription.file,
          'productsOrder.$.prescription.stateDate': new Date().getTime(),
        },
      },
      { new: true, upsert: true }
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
          'productsOrder.$.prescription.state': payload.productOrder.prescription.state,
          'productsOrder.$.prescription.validation': payload.productOrder.prescription.validation,
        },
      },
      { new: true, upsert: true }
    );
  };
}
