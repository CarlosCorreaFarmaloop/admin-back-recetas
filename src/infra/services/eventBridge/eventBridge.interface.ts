export interface IEventBridge {
  emit: (event: IEvent) => Promise<any>;
}

export interface IEvent {
  detail: any;
  detailType: string;
  eventBusName?: string;
  source?: string;
}
