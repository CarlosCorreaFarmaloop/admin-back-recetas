export interface ICarritoService {
  crearCarrito: (carrito: Carrito) => Promise<Carrito>;
  obtenerCarrito: (id: string) => Promise<Carrito>;
}

export interface Carrito {
  billetera: string;
  codigo_cupon: string;
  compartido_por: string;
  compromiso_entrega: number;
  comuna: string;
  createdAt: number;
  descuento_total: number;
  direccion_numero: string;
  direccion: string;
  email: string;
  es_delivery: boolean;
  es_direccion_exacta: boolean;
  fecha_compartido: number;
  id: string;
  latitud: string;
  longitud: string;
  nombre_completo: string;
  numero_depto: string;
  place_id: string;
  precio_delivery: number;
  productos: any[];
  referencia_cupon: string;
  referrer: string;
  region: string;
  telefono: string;
  tipo_cupon: string;
  tipo_de_casa: string;
  tipo_envio: string;
}
