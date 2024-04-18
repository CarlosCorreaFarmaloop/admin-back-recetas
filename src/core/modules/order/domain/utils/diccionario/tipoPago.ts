import { DocumentTributarioTipoPago } from '../../documentos_tributarios.interface';

export const TipoPago: Record<string, DocumentTributarioTipoPago> = {
  account_money: 'Dinero-Cuenta',
  'Venta Débito': 'Debito',
  credit_card: 'Credito',
  debit_card: 'Debito',
  'Venta Normal': 'Credito',
};
