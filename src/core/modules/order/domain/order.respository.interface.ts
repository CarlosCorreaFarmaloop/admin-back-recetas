import { OrdenEntity } from './order.entity';

export interface IUpdateProvisionalStatusOrder
  extends Pick<OrdenEntity, 'id' | 'provisionalStatusOrder' | 'provisionalStatusOrderDate'> {}
