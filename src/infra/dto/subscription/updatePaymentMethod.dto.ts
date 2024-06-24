import Joi from 'joi';

const updatePaymentMethodSchema = Joi.object({
  id: Joi.string().required(),
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
  currentPaymentId: Joi.string().required(),
}).unknown();

export function UpdatePaymentMethod_Subscription_Dto(record: any) {
  const { error } = updatePaymentMethodSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
