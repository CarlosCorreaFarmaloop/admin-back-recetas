import { SQSEvent, EventBridgeEvent, Context, Callback, APIGatewayProxyEvent } from 'aws-lambda';

import { connectoToMongoDB } from './infra/db/mongo';
import { EventInput } from './interfaces/event';
import { SubscriptionUseCase } from './core/modules/subscription/application/subscription.usecase';
import { SubscriptionMongoRepository } from './infra/repository/subscription/subscription.mongo.repository';
import { Create_Subscription_Dto } from './infra/dto/subscription/create.dto';

export const handler = async (event: SQSEvent, _context: Context, _callback: Callback) => {
  try {
    console.log('Evento: ', JSON.stringify(event, null, 2));

    const bodyEvent = validateLambdaEvent(event);
    if (!bodyEvent) {
      throw new Error('Datos del evento no válidos.');
    }

    await connectoToMongoDB();

    const { accion, payload } = bodyEvent;

    const subscriptionRepository = new SubscriptionMongoRepository();
    const subscriptionUseCase = new SubscriptionUseCase(subscriptionRepository);

    if (accion === 'generar-suscripcion') {
      const { message, status } = Create_Subscription_Dto(payload);
      if (!status) {
        console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
        throw new Error(message);
      }

      const response = await subscriptionUseCase.createSubscription(payload);
      return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
    }

    return { statusCode: 200, body: JSON.stringify(event) };
  } catch (error) {
    const err = error as Error;
    console.error('Error: ', JSON.stringify(err, null, 2));

    const isApiGateway = 'httpMethod' in event;
    if (isApiGateway) {
      return { statusCode: 400, body: JSON.stringify({ message: err.message, data: error }) };
    }

    throw new Error(err.message);
  }
};

const validateLambdaEvent = (event: SQSEvent | APIGatewayProxyEvent): EventInput | null => {
  if ('Records' in event && event.Records.length > 0) {
    try {
      const parsedEventBody = JSON.parse(event.Records[0].body) as EventBridgeEvent<string, EventInput>;

      if (!parsedEventBody.detail) {
        console.error(
          'El cuerpo del evento SQS no contiene los campos esperados: ',
          JSON.stringify(parsedEventBody, null, 2)
        );
        return null;
      }

      return parsedEventBody.detail;
    } catch (error) {
      console.error('Error al parsear el cuerpo del evento SQS: ', error);
      return null;
    }
  }

  if ('body' in event && event.body) {
    try {
      return JSON.parse(event.body) as EventInput;
    } catch (error) {
      console.error('Error al parsear el cuerpo del evento API Gateway: ', error);
      return null;
    }
  }

  console.error('El evento no contiene registros válidos ni un cuerpo adecuado: ', JSON.stringify(event, null, 2));
  return null;
};
