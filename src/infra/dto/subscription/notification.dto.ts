import Joi from 'joi';

const notificationSubscriptionSchema = Joi.object({
  id: Joi.string().required(),
});

export function Notification_Subscription_Dto(record: any) {
  const { error } = notificationSubscriptionSchema.validate(record);

  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Ok' };
}
