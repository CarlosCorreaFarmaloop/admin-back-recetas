import { APIGatewayEventInput } from './apigateway';
import { SQSEventInput } from './sqs';

export type EventInput =
  | {
      body: APIGatewayEventInput;
      trigger: 'APIGateway';
    }
  | {
      body: SQSEventInput;
      trigger: 'SQS';
    };
