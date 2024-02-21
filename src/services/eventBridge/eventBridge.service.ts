import AWS from 'aws-sdk';
import { IEvent, IEventBridge } from './eventBridge.interface';

export class EventBridge implements IEventBridge {
  emit = async (event: IEvent) => {
    try {
      const eventbridge = new AWS.EventBridge();

      const params = {
        Entries: [
          {
            Time: new Date(),
            Source: event.source,
            DetailType: event.detailType,
            Detail: JSON.stringify(event.detail),
            EventBusName: event.eventBusName,
          },
        ],
      };
      console.log('--- Params ---');
      console.log(params);

      const response = await eventbridge.putEvents(params).promise();
      console.log('--- Response ---');
      console.log(response);

      return response;
    } catch (error) {
      console.log(error);
      throw new Error();
    }
  };
}
