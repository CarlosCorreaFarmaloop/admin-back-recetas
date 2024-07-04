import Joi from 'joi';

const approvePaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  successAttempt: Joi.object({
    amount: Joi.number().required(),
    cardNumber: Joi.string().required(),
    externalCode: Joi.string().required(),
    externalMessage: Joi.string().required(),
    externalStatus: Joi.string().required(),
    paymentMethod: Joi.string().required(),
    responsible: Joi.string().required(),
    status: Joi.string().required(),
    transactionDate: Joi.number().required(),
  }).required(),
});

export function ApprovePayment_PreOrder_Dto(record: any) {
  const { error } = approvePaymentSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
