import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import { connectoToMongoDB } from '../db/mongo';
import { SQSController } from '../controller/sqs.controller';

export const handler = async (event: APIGatewayProxyEventV2, context: Context) => {
  console.log('Event: ', JSON.stringify(event?.body, null, 2));

  await connectoToMongoDB();

  const parsedBody = JSON.parse(event.body as any);
  await SQSController(parsedBody);
};
