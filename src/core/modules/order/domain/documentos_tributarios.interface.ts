export interface IDocumentoTributarioEventInput {
  accion: Accion;
  payload: GenerarBoletaPayload;
  origen: string;
}

export interface GenerarBoletaPayload {
  comentario: string;
  delivery?: Delivery;
  id_interno: string;
  productos: Producto[];
  proveedor: Emisor;
  tipo_documento: 'Boleta';
  tipo_pago: DocumentTributarioTipoPago;
}

interface Producto {
  cantidad: number;
  descuento: number;
  precio_unitario: number;
  titulo: string;
}

interface Delivery {
  precio_unitario: number;
  titulo: string;
}

export type DocumentTributarioTipoPago = 'Efectivo-Prepago' | 'Credito' | 'Debito' | 'Transferencia' | 'Dinero-Cuenta';

export type Emisor = 'Bsale';

export type Accion = 'generar-documento-tributario';
