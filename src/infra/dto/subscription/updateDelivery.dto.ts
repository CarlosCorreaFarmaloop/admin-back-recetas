import Joi from 'joi';

const updateDeliverySchema = Joi.object({
  id: Joi.string().required(),
  delivery: Joi.object({
    comuna: Joi.string().required(),
    fullName: Joi.string().required(),
    homeNumber: Joi.string().required().allow(''),
    homeType: Joi.string().required(),
    isExactAddress: Joi.boolean().required(),
    latitude: Joi.string().required(),
    longitude: Joi.string().required(),
    phone: Joi.string().required(),
    placeId: Joi.string().required(),
    region: Joi.string().required(),
    streetName: Joi.string().required(),
    streetNumber: Joi.string().required(),
  }).required(),
});

export function UpdateDelivery_Subscription_Dto(record: any) {
  const { error } = updateDeliverySchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
