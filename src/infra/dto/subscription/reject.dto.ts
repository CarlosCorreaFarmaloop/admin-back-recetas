import Joi from 'joi';

const rejectSubscriptionSchema = Joi.object({
  id: Joi.string().required(),
  observation: Joi.string().required(),
  responsible: Joi.string().required(),
});

export function Reject_Subscription_Dto(record: any) {
  const { error } = rejectSubscriptionSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
