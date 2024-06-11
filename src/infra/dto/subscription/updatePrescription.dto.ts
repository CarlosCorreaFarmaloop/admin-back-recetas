import Joi from 'joi';

const updatePrescriptionSchema = Joi.object({
  id: Joi.string().required(),
  sku: Joi.string().required(),
  prescription: Joi.object({
    file: Joi.string().required(),
    maxNumberOfUses: Joi.number().required(),
    numberOfUses: Joi.number().required(),
    state: Joi.string().required(),
    validation: Joi.object({
      comments: Joi.string().required().allow(''),
      rut: Joi.string().required(),
      responsible: Joi.string().required(),
    }).required(),
  }).required(),
});

export function UpdatePrescription_Subscription_Dto(record: any) {
  const { error } = updatePrescriptionSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
