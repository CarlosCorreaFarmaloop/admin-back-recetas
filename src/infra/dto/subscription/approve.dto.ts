import Joi from 'joi';

const approveSubscriptionSchema = Joi.object({
  id: Joi.string().required(),
  responsible: Joi.string().required(),
});

export function Approve_Subscription_Dto(record: any) {
  const { error } = approveSubscriptionSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
