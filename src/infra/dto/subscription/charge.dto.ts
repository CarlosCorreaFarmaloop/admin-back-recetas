import Joi from 'joi';

const chargeSchema = Joi.object({
  id: Joi.string().required(),
  responsible: Joi.string().valid('Usuario', 'Sistema').required(),
});

export function Charge_Subscription_Dto(record: any) {
  const { error } = chargeSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
