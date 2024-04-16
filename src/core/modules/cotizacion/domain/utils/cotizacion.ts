import { CotizacionEntity } from '../cotizacion.entity';
import { OrdenEntity, Prescription } from '../../../order/domain/order.entity';

export interface DocumentoCotizacion {
  delivery?: DeliveryDocumento;
  documento: Documento;
  precio_subtotal: number;
  precio_total: number;
  productos: ProductoDocumento[];
  referenceDocumentId?: string;
}

export interface ProductoDocumento {
  cantidad: number;
  lote: string;
  precio_referencia: number;
  precio_sin_descuento: number;
  precio: number;
  receta: Prescription;
  requiere_receta: boolean;
  sku: string;
  seguro_copago?: number;
  seguro_beneficio?: number;
  seguro_deducible?: number;
}

export interface DeliveryDocumento {
  precio: number;
  precio_sin_descuento: number;
}

type Documento = 'Boleta' | 'Guia_Yapp' | 'Boleta_Yapp';

export const calcularDocumentos = async (
  orden: OrdenEntity,
  cotizacion: CotizacionEntity
): Promise<DocumentoCotizacion[]> => {
  const documentos: DocumentoCotizacion[] = [];

  const { productos } = cotizacion;

  const productos_con_descuento = ajustarDescuentoProductos(orden);
  const delivery_con_descuento = ajustarDescuentoDelivery(orden);

  const productos_sin_cobertura: ProductoDocumento[] = [];
  const productos_con_cobertura: ProductoDocumento[] = [];

  productos_con_descuento.forEach((producto) => {
    const producto_con_cobertura = productos.find(({ sku, lote }) => sku === producto.sku && lote === producto.lote);
    if (producto_con_cobertura) {
      productos_con_cobertura.push({
        ...producto,
        seguro_beneficio: producto_con_cobertura.beneficio_unitario,
        seguro_copago: producto_con_cobertura.copago_unitario,
        seguro_deducible: producto_con_cobertura.deducible_unitario,
      });
    } else {
      productos_sin_cobertura.push(producto);
    }
  });

  if (productos_sin_cobertura.length > 0 || delivery_con_descuento) {
    const precio_subtotal = productos_sin_cobertura.reduce((acc, { cantidad, precio }) => acc + cantidad * precio, 0);

    if (delivery_con_descuento) {
      documentos.push({
        documento: 'Boleta',
        productos: productos_sin_cobertura,
        delivery: delivery_con_descuento,
        precio_subtotal,
        precio_total: precio_subtotal + delivery_con_descuento.precio,
      });
    } else {
      documentos.push({
        documento: 'Boleta',
        productos: productos_sin_cobertura,
        precio_subtotal,
        precio_total: precio_subtotal,
      });
    }
  }

  const precio_subtotal = productos_con_cobertura.reduce((acc, { cantidad, precio }) => acc + cantidad * precio, 0);

  if (cotizacion.documento === 'bill') {
    documentos.push({
      documento: 'Boleta_Yapp',
      productos: productos_con_cobertura,
      precio_subtotal,
      precio_total: precio_subtotal,
    });
  } else {
    documentos.push({
      documento: 'Guia_Yapp',
      productos: productos_con_cobertura,
      precio_subtotal,
      precio_total: precio_subtotal,
    });
  }

  return documentos;
};

const ajustarDescuentoProductos = (orden: OrdenEntity): ProductoDocumento[] => {
  const { productsOrder, resumeOrder } = orden;
  const { discount } = resumeOrder;

  const descuentos_productos = discount.details.find(
    (detalle) => detalle.type === 'Products' && detalle.descuentos_unitarios
  )?.descuentos_unitarios;

  if (discount.total <= 0 || !descuentos_productos)
    return productsOrder.map((producto) => ({
      cantidad: producto.qty,
      lote: producto.batchId,
      precio: producto.price,
      precio_referencia: producto.normalUnitPrice,
      precio_sin_descuento: producto.price,
      requiere_receta: producto.requirePrescription,
      sku: producto.sku,
      receta: producto?.prescription,
    }));

  const productos_actualizados: ProductoDocumento[] = productsOrder.map((producto) => {
    const descuento = descuentos_productos.find(
      ({ sku, lote_id }) => sku === producto.sku && lote_id === producto.batchId
    );

    return {
      cantidad: producto.qty,
      lote: producto.batchId,
      precio_referencia: producto.normalUnitPrice,
      precio_sin_descuento: producto.price,
      precio: descuento ? producto.price - descuento.descuento_unitario : producto.price,
      receta: producto?.prescription,
      requiere_receta: producto.requirePrescription,
      sku: producto.sku,
    };
  });

  return productos_actualizados;
};

const ajustarDescuentoDelivery = (orden: OrdenEntity): DeliveryDocumento | null => {
  const { resumeOrder, delivery } = orden;
  const { discount, deliveryPrice } = resumeOrder;

  if (delivery.method === 'STORE') return null;

  const descuento_delivery = discount.details.find((detalle) => detalle.type === 'Delivery')?.discount;

  if (!descuento_delivery)
    return {
      precio: deliveryPrice,
      precio_sin_descuento: deliveryPrice,
    };

  const delivery_con_descuento = deliveryPrice - descuento_delivery;

  if (delivery_con_descuento <= 0) return null;

  return {
    precio: delivery_con_descuento,
    precio_sin_descuento: deliveryPrice,
  };
};
