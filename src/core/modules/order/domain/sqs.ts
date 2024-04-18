import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { INotificarCambioOrden } from '../application/interface';

export const notificarCambioOrdenSQS = async (payload: INotificarCambioOrden) => {
  const sqsClient = new SQSClient();

  return await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: process.env.SQS_URL_NOTIFICACION_ORDEN,
      MessageBody: JSON.stringify(payload),
      // MessageGroupId: 'notificacion-orden',
      // MessageDeduplicationId: payload.id,
    })
  );
};
