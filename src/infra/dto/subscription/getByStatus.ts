import Joi from 'joi';

const getByStatusSchema = Joi.object({
  status: Joi.string().required(),
});

export function Get_Subscription_Dto(record: any) {
  const { error } = getByStatusSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
