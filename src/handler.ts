import { SQSEvent, EventBridgeEvent, Context, Callback, APIGatewayProxyEvent } from 'aws-lambda';

import { EventInput } from './interfaces/event';
import { SQSEventInput } from './interfaces/sqs';
import { connectoToMongoDB } from './infra/db/mongo';
import { SQSController } from './infra/controller/sqs.controller';
import { APIController } from './infra/controller/api.controller';

export const handler = async (event: SQSEvent, _context: Context, _callback: Callback) => {
  try {
    console.log('Event: ', JSON.stringify(event, null, 2));

    const { body, trigger } = validateLambdaEvent(event);
    console.log('Parsed Event: ', JSON.stringify(event, null, 2));

    await connectoToMongoDB();

    if (trigger === 'SQS') {
      return await SQSController(body);
    }

    if (trigger === 'APIGateway') {
      return await APIController(body);
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

const validateLambdaEvent = (event: SQSEvent | APIGatewayProxyEvent): EventInput => {
  if ('Records' in event && event.Records.length > 0) {
    try {
      const parsedEventBody = JSON.parse(event.Records[0].body) as EventBridgeEvent<string, SQSEventInput>;

      return { body: parsedEventBody.detail, trigger: 'SQS' };
    } catch (error) {
      console.error('Error parsing the SQS event body: ', error);
      throw new Error('Error parsing the SQS event body.');
    }
  }

  if ('body' in event && event.body) {
    try {
      const parsedEventBody = JSON.parse(event.body);

      return {
        body: {
          body: parsedEventBody,
          method: event.httpMethod,
          path: event.path,
        },
        trigger: 'APIGateway',
      };
    } catch (error) {
      console.error('Error parsing the API Gateway event body: ', error);
      throw new Error('Error parsing the API Gateway event body.');
    }
  }

  console.error('Event does not contain valid records or a proper body: ', JSON.stringify(event, null, 2));
  throw new Error('Event does not contain valid records or a proper body.');
};
