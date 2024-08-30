import { SQSEvent } from 'aws-lambda';

import { connectoToMongoDB } from '../db/mongo';
import { SQSController } from '../controller/sqs.controller';

export const handler = async (event: SQSEvent) => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  await connectoToMongoDB();

  if ('Records' in event && event.Records.length > 0) {
    const parsedEventBody = JSON.parse(event.Records[0].body).detail;
    return await SQSController(parsedEventBody);
  }

  return { statusCode: 200, body: JSON.stringify(event) };
};

// export const handler = async (event: APIGatewayProxyEventV2, context: Context) => {
//   console.log('Event: ', JSON.stringify(event?.body, null, 2));

//   await connectoToMongoDB();

//   const parsedBody = JSON.parse(event.body as any);
//   await SQSController(parsedBody);
// };
