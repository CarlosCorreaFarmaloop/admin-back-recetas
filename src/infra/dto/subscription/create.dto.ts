import Joi from 'joi';

const createSchema = Joi.object({
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
        discountPerUnit: Joi.number().required(),
        prescription: Joi.string().required().allow(''),
        price: Joi.number().required(),
        pricePaidPerUnit: Joi.number().required(),
        quantity: Joi.number().required(),
        sku: Joi.string().required(),

        bioequivalent: Joi.boolean().required(),
        cooled: Joi.boolean().required(),
        ean: Joi.string().required().allow(''),
        fullName: Joi.string().required(),
        laboratoryName: Joi.string().required().allow(''),
        liquid: Joi.boolean().required(),
        pharmaceuticalForm: Joi.string().required().allow(''),
        photoURL: Joi.string().required().allow(''),
        prescriptionType: Joi.string().required(),
        presentation: Joi.string().required().allow(''),
        productCategory: Joi.string().required().allow(''),
        productSubCategory: Joi.array().items(Joi.string()).required(),
        quantityPerContainer: Joi.string().required().allow(''),
        recommendations: Joi.string().required().allow(''),
        requiresPrescription: Joi.boolean().required(),
        shortName: Joi.string().required(),
      }).unknown()
    )
    .required(),
  shipment: Joi.object({
    intervalMonth: Joi.number().required(),
    dayOfMonth: Joi.number().required(),
    numberOfShipments: Joi.number().required(),
  }),
});

export function Create_Subscription_Dto(record: any) {
  const { error } = createSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
