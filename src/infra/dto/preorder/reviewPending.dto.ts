import Joi from 'joi';

const reviewPendingSchema = Joi.object({
  skus: Joi.array().items(Joi.string().required()).required(),
});

export function ReviewPending_PreOrder_Dto(record: any) {
  const { error } = reviewPendingSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
