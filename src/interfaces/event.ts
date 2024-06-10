import { ApiGatewayEventInput } from './apigateway';
import { SQSEventInput } from './sqs';

export type EventInput =
  | {
      body: ApiGatewayEventInput;
      trigger: 'APIGateway';
    }
  | {
      body: SQSEventInput;
      trigger: 'SQS';
    };
