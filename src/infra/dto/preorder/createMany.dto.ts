import Joi from 'joi';

const createManySchema = Joi.object({
  id: Joi.string().required(),
  createdAt: Joi.number().required(),
  updatedAt: Joi.number().required(),

  customer: Joi.string().required(),
  delivery: Joi.object({
    comuna: Joi.string().required(),
    discount: Joi.number().required(),
    fullName: Joi.string().required(),
    homeNumber: Joi.string().required().allow(''),
    homeType: Joi.string().required(),
    isExactAddress: Joi.boolean().required(),
    latitude: Joi.string().required().allow(''),
    longitude: Joi.string().required().allow(''),
    phone: Joi.string().required(),
    placeId: Joi.string().required().allow(''),
    price: Joi.number().required(),
    pricePaid: Joi.number().required(),
    region: Joi.string().required(),
    streetName: Joi.string().required(),
    streetNumber: Joi.string().required(),
  }).required(),
  discount: Joi.object({
    details: Joi.array().items({
      discount: Joi.number().required(),
      promotionCode: Joi.string().required(),
      reference: Joi.string().required(),
      type: Joi.string().required(),
    }),
    total: Joi.number().required(),
  }),
  products: Joi.array()
    .items(
      Joi.object({
        bioequivalent: Joi.boolean().required(),
        cooled: Joi.boolean().required(),
        discountPerUnit: Joi.number().required(),
        ean: Joi.string().required().allow(''),
        fullName: Joi.string().required(),
        laboratoryName: Joi.string().required().allow(''),
        liquid: Joi.boolean().required(),
        pharmaceuticalForm: Joi.string().required().allow(''),
        photoURL: Joi.string().required().allow(''),
        prescription: Joi.object({
          file: Joi.string().required().allow(''),
          state: Joi.string().required(),
          validation: Joi.object({
            comments: Joi.string().required().allow(''),
            rut: Joi.string().required().allow(''),
            responsible: Joi.string().required().allow(''),
          }).required(),
        }).required(),
        prescriptionType: Joi.string().required(),
        presentation: Joi.string().required().allow(''),
        price: Joi.number().required(),
        pricePaidPerUnit: Joi.number().required(),
        productCategory: Joi.string().required().allow(''),
        productSubCategory: Joi.array().items(Joi.string()).required(),
        quantity: Joi.number().required(),
        quantityPerContainer: Joi.string().required().allow(''),
        recommendations: Joi.string().required().allow(''),
        requiresPrescription: Joi.boolean().required(),
        shortName: Joi.string().required(),
        sku: Joi.string().required(),
      }).unknown()
    )
    .required(),
  paymentMethods: Joi.array()
    .items(
      Joi.object({
        cardNumber: Joi.string().required(),
        cardType: Joi.string().required(),
        externalStatus: Joi.string().required(),
        recordDate: Joi.number().required(),
        secret: Joi.string().required(),
        status: Joi.number().required(),
        token: Joi.string().required(),
        transactionCode: Joi.string().required(),
      })
    )
    .required(),
  shipment: Joi.object({
    intervalMonth: Joi.number().required(),
    dateOfFirstShipment: Joi.number().required(),
    numberOfShipments: Joi.number().required(),

    quantityShipped: Joi.number().required(),

    shipmentSchedule: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          paymentDate: Joi.number().required(),
          nextPaymentDate: Joi.number().required(),
          shipmentDate: Joi.number().required(),
          paymentStatus: Joi.string().required(),

          orderId: Joi.string().required().allow(''),
          orderStatus: Joi.string().required(),

          numberOfAttempts: Joi.number().required(),
          maxAttempts: Joi.number().required(),
          attempts: Joi.array()
            .items(
              Joi.object({
                amount: Joi.number().required(),
                cardNumber: Joi.string().required(),
                externalCode: Joi.string().required(),
                externalMessage: Joi.string().required(),
                externalStatus: Joi.string().required(),
                paymentMethod: Joi.string().required(),
                status: Joi.string().required(),
                transactionDate: Joi.number().required(),
              })
            )
            .required(),
        })
      )
      .required(),
  }),

  nextPaymentDate: Joi.number().required(),
  nextShipmentDate: Joi.number().required(),
  currentPaymentId: Joi.string().required(),
  currentShipmentId: Joi.string().required(),
  generalStatus: Joi.string().required(),
  paymentStatus: Joi.string().required(),
  progressStatus: Joi.string().required(),

  trackingGeneralStatus: Joi.array()
    .items(
      Joi.object({
        date: Joi.number().required(),
        responsible: Joi.string().required(),
        observation: Joi.string().required().allow(''),
        status: Joi.string().required(),
      })
    )
    .required(),
  trackingPaymentStatus: Joi.array()
    .items(
      Joi.object({
        date: Joi.number().required(),
        responsible: Joi.string().required(),
        observation: Joi.string().required().allow(''),
        status: Joi.string().required(),
      })
    )
    .required(),
  trackingProgressStatus: Joi.array()
    .items(
      Joi.object({
        date: Joi.number().required(),
        responsible: Joi.string().required(),
        observation: Joi.string().required().allow(''),
        status: Joi.string().required(),
      })
    )
    .required(),

  observations: Joi.array()
    .items(
      Joi.object({
        date: Joi.number().required(),
        comment: Joi.string().required(),
        responsible: Joi.string().required(),
      })
    )
    .required(),
  resume: Joi.object({
    deliveryPrice: Joi.number().required(),
    discount: Joi.number().required(),
    numberOfProducts: Joi.number().required(),
    subtotal: Joi.number().required(),
    total: Joi.number().required(),
    totalWithoutDiscount: Joi.number().required(),
  }).required(),
});

export function CreateMany_PreOrders_Dto(record: any) {
  const { error } = createManySchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
