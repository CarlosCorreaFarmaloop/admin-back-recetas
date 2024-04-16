export interface MovementEntity {
  batch: string;
  createAt: Date;
  documentNumber: string;
  documento_referencia?: string;
  documentType: DocumentType;
  id: string;
  movementType: MovementType;
  quantity: number;
  sku: string;
}

export type MovementType = 'Entrada' | 'Salida' | 'Inventario' | 'Nota de crédito';
export type DocumentType =
  | 'Guia de despacho'
  | 'Factura'
  | 'Boleta'
  | 'Inventario'
  | 'POS'
  | 'Order'
  | 'Nota de crédito';
