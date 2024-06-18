import mongoose, { model } from 'mongoose';

import { PreOrderEntity } from '../../core/modules/preorder/domain/preOrder.entity';

const DeliverySchema = new mongoose.Schema(
  {
    compromiso_entrega: new mongoose.Schema(
      {
        date: Number,
        dateText: String,
      },
      { _id: false }
    ),
    cost: Number,
    delivery_address: new mongoose.Schema(
      {
        comuna: String,
        dpto: String,
        firstName: String,
        homeType: String,
        isExactAddress: Boolean,
        lastName: String,
        latitude: String,
        longitude: String,
        phone: String,
        placeId: String,
        region: String,
        streetName: String,
        streetNumber: String,
      },
      { _id: false }
    ),
    discount: Number,
    method: String,
    pricePaid: Number,
    type: String,
  },
  { _id: false }
);

const ExtrasSchema = new mongoose.Schema(
  {
    referrer: String,
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    payment: new mongoose.Schema(
      {
        amount: Number,
        method: String,
        originCode: String,
        paymentDate: Number,
        status: String,
        wallet: String,
      },
      { _id: false }
    ),
  },
  { _id: false }
);

const ProductOrderSchema = new mongoose.Schema(
  {
    batchId: String,
    bioequivalent: Boolean,
    cooled: Boolean,
    discountPerUnit: Number,
    ean: String,
    expiration: Number,
    fullName: String,
    laboratoryName: String,
    liquid: Boolean,
    normalUnitPrice: Number,
    pharmaceuticalForm: String,
    photoURL: String,
    prescription: new mongoose.Schema(
      {
        file: String,
        state: String,
        validation: new mongoose.Schema({ comments: String, rut: String, responsible: String }, { _id: false }),
      },
      { _id: false }
    ),
    prescriptionType: String,
    presentation: String,
    price: Number,
    pricePaidPerUnit: Number,
    productCategory: String,
    productSubCategory: [String],
    qty: Number,
    quantityPerContainer: String,
    recommendations: String,
    requirePrescription: Boolean,
    shortName: String,
    sku: String,
  },
  { _id: false }
);

const DiscountSchema = new mongoose.Schema(
  {
    details: [new mongoose.Schema({ discount: Number, promotionCode: String, reference: String, type: String }, { _id: false })],
    total: Number,
  },
  { _id: false }
);

const ResumeOrderSchema = new mongoose.Schema(
  {
    canal: String,
    cartId: String,
    clasification: String,
    convenio: String,
    deliveryPrice: Number,
    discount: DiscountSchema,
    nroProducts: Number,
    seller: String,
    subtotal: Number,
    totalPrice: Number,
  },
  { _id: false }
);

const TrackingSchema = new mongoose.Schema({ date: Number, responsible: String, observation: String, status: String }, { _id: false });

const PreOrderSchema = new mongoose.Schema({
  id: String,
  createdAt: Number,
  customer: String,
  delivery: DeliverySchema,
  extras: ExtrasSchema,
  payment: PaymentSchema,
  productsOrder: [ProductOrderSchema],
  resumeOrder: ResumeOrderSchema,
  status: String,
  subscriptionId: String,
  tracking: [TrackingSchema],
});

export const PreOrderModel = model<PreOrderEntity>('preorders', PreOrderSchema);
