export interface IEventDetail {
  origin: IOrigin;
  body: any;
  action: IAction;
}

export type IOrigin = 'ecommerce' | 'admin' | 'courier';

export type IAction =
  | 'crear-orden'
  | 'actualizar-order'
  | 'actualizar-pago'
  | 'actualizar-a-retiro-envio'
  | 'generar-courier'
  | 'actualizar-courier'
  | 'actualizar-a-envio'
  | 'actualizar-a-listo-retiro'
  | 'generar-documento-tributario'
  | 'confirmar-asignacion-courier'
  | 'actualizar-tracking-courier';

export interface IAsignacionCourier {
  id: string;
  provider: string;
  urlLabel: string;
  trackingNumber: string;
  status: 'Pendiente' | 'Cancelado' | 'Aprobado';
}

export interface ITrackingCourier {
  id: string;
  fecha: Date;
  estado: string;
  comentario: string;
  evidencias: string[];
}
