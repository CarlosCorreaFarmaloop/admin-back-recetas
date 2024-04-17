export interface OrderFromEcommerce {
  id: string;
  payment: {
    amount?: number;
    method?: string;
    originCode?: string;
    status: 'Aprobado' | 'Pendiente' | 'Cancelado';
    wallet?: Wallet;
  };
  statusOrder: StatusOrder;
}

export type StatusOrder =
  | 'EN_OBSERVACION'
  | 'ABANDONADO'
  | 'CANCELADO'
  | 'RECETA_NO_VALIDA'
  | 'CREADO'
  | 'VALIDANDO_RECETA'
  | 'RECETA_VALIDADA'
  | 'PREPARANDO'
  | 'EN_DELIVERY'
  | 'ENTREGADO'
  | 'LISTO_PARA_RETIRO'
  | 'ASIGNAR_A_DELIVERY'
  | 'OBSERVACIONES_RECETAS';

export interface AdminPayment {
  payment: {
    amount: number;
    method: string;
    originCode: string;
    status: Status;
    wallet: Wallet;
  };
}

export type Status = 'Cancelado' | 'Aprobado';
export type Wallet = 'Transbank' | 'Mercadopago';
