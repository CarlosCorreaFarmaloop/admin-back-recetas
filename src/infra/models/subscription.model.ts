import mongoose, { model } from 'mongoose';

import { SubscriptionEntity } from '../../core/modules/subscription/domain/subscription.entity';

const DeliverySchema = new mongoose.Schema(
  {
    comuna: String,
    discount: Number,
    fullName: String,
    homeNumber: String,
    homeType: String,
    isExactAddress: Boolean,
    latitude: String,
    longitude: String,
    phone: String,
    placeId: String,
    price: Number,
    pricePaid: Number,
    region: String,
    streetName: String,
    streetNumber: String,
  },
  { _id: false }
);

const DiscountSchema = new mongoose.Schema(
  {
    details: [new mongoose.Schema({ discount: Number, promotionCode: String, reference: String, type: String })],
    total: Number,
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    discountPerUnit: Number,
    prescription: new mongoose.Schema({
      file: String,
      state: String,
      stateDate: Number,
      validation: new mongoose.Schema({ comments: String, rut: String, responsible: String }),
    }),
    price: Number,
    pricePaidPerUnit: Number,
    quantity: Number,
    sku: String,

    bioequivalent: Boolean,
    cooled: Boolean,
    ean: String,
    fullName: String,
    laboratoryName: String,
    liquid: Boolean,
    pharmaceuticalForm: String,
    photoURL: String,
    prescriptionType: String,
    presentation: String,
    productCategory: String,
    productSubCategory: [String],
    quantityPerContainer: String,
    recommendations: String,
    requiresPrescription: Boolean,
    shortName: String,
  },
  { _id: false }
);

const PaymentMethodSchema = new mongoose.Schema(
  {
    cardNumber: String,
    cardType: String,
    externalStatus: String,
    recordDate: Number,
    secret: String,
    status: Number,
    token: String,
    transactionCode: String,
  },
  { _id: false }
);

const ShipmentScheduleSchema = new mongoose.Schema(
  {
    id: String,
    paymentDate: Number,
    nextPaymentDate: Number,
    shipmentDate: Number,
    paymentStatus: String,

    orderId: String,
    orderStatus: String,

    numberOfAttempts: Number,
    maxAttempts: Number,
    attempts: [
      new mongoose.Schema({
        cardNumber: String,
        externalCode: String,
        externalMessage: String,
        externalStatus: String,
        paymentMethod: String,
        status: String,
        transactionDate: Number,
      }),
    ],
  },
  { _id: false }
);

const ShipmentSchema = new mongoose.Schema(
  {
    intervalMonth: Number,
    dayOfMonth: Number,
    numberOfShipments: Number,

    startDate: Number,
    endDate: Number,

    quantityShipped: Number,

    shipmentSchedule: [ShipmentScheduleSchema],
  },
  { _id: false }
);

const TrackingSchema = new mongoose.Schema({ date: Number, responsible: String, observation: String, status: String });

const ObservationSchema = new mongoose.Schema(
  {
    date: Number,
    comment: String,
    responsible: String,
  },
  { _id: false }
);

const ResumeSchema = new mongoose.Schema(
  {
    deliveryPrice: Number,
    discount: Number,
    numberOfProducts: Number,
    subtotal: Number,
    total: Number,
    totalWithoutDiscount: Number,
  },
  { _id: false }
);

const SubscriptionSchema = new mongoose.Schema({
  id: String,
  createdAt: Number,
  updatedAt: Number,

  customer: String,
  delivery: DeliverySchema,
  discount: DiscountSchema,
  products: [ProductSchema],

  paymentMethods: [PaymentMethodSchema],
  shipment: ShipmentSchema,

  nextPaymentDate: Number,
  nextShipmentDate: Number,
  currentPaymentId: String,
  currentShipmentId: String,
  generalStatus: String,
  paymentStatus: String,
  progressStatus: String,

  trackingGeneralStatus: [TrackingSchema],
  trackingPaymentStatus: [TrackingSchema],
  trackingProgressStatus: [TrackingSchema],

  observations: [ObservationSchema],
  resume: ResumeSchema,
});

export const SubscriptionModel = model<SubscriptionEntity>('subscriptions', SubscriptionSchema);
