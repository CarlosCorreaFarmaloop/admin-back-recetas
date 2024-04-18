import { OrdenEntity, StatusOrder } from '../order.entity';
import { validateStatusChange } from './validarEstadoACambiar';

export const ordenStateMachine = (
  estadoPrevio: StatusOrder,
  proximoEstado: StatusOrder,
  orden: OrdenEntity
): boolean => {
  console.log('----------------------- ordenStateMachine -----------------------');
  console.log('------- Estado Previo:', estadoPrevio + ' ------- Proximo Estado:', proximoEstado);

  if (!validateStatusChange(estadoPrevio, proximoEstado)) return false;

  if (!validaReglaNegocio(estadoPrevio, proximoEstado, orden)) return false;

  return true;
};

const validaReglaNegocio = (estadoPrevio: StatusOrder, proximoEstado: StatusOrder, orden: OrdenEntity): boolean => {
  if (proximoEstado === 'VALIDANDO_RECETA') {
    return validaReglaNegocioValidandoReceta(orden);
  }

  if (proximoEstado === 'RECETA_VALIDADA') {
    return validaReglaNegocioRecetaValidada(orden);
  }

  if (proximoEstado === 'OBSERVACIONES_RECETAS') {
    return validaReglaNegocioObservacionesReceta(orden);
  }

  if (proximoEstado === 'PREPARANDO') {
    return validarOrdenPREPARANDO(orden);
  }

  if (proximoEstado === 'LISTO_PARA_RETIRO') {
    return validaReglaNegocioListoParaRetiro(orden);
  }

  if (proximoEstado === 'ASIGNAR_A_DELIVERY') {
    return validaReglaNegocioAsignarADelivery(orden);
  }

  if (proximoEstado === 'EN_DELIVERY') {
    return validaReglaNegocioEnDelivery(orden);
  }

  if (proximoEstado === 'ENTREGADO') {
    return validaReglaNegocioEntregado(orden);
  }

  if (proximoEstado === 'EN_OBSERVACION') {
    return validaReglaNegocioEnObservacion(orden);
  }

  if (proximoEstado === 'CANCELADO') {
    return validaReglaNegocioCancelado(orden);
  }

  return false;
};

const validaReglaNegocioValidandoReceta = ({ productsOrder }: OrdenEntity): boolean => {
  if (
    productsOrder
      .filter(({ requirePrescription }) => requirePrescription)
      .filter(
        (product) =>
          product.prescription.file !== '' &&
          (product.prescription.state === '' || product.prescription.state === 'Pending')
      ).length === 0
  )
    return false;

  return true;
};

const validaReglaNegocioRecetaValidada = (orden: OrdenEntity): boolean => {
  // Para que sea valido los productos que requieran receta deben tener receta y deben estar aprobadas

  return validarOrdenRequiereRecetaYEstanAprobadas(orden);
};

const validaReglaNegocioObservacionesReceta = (orden: OrdenEntity): boolean => {
  // Para que sea valido una observacion receta debe ser una orden que tenga productos que requieran receta y que no tengan receta
  if (
    orden.productsOrder.filter((producto) => producto.requirePrescription && producto.prescription.file === '')
      .length === 0
  )
    return false;

  return true;
};

const validarOrdenPREPARANDO = (orden: OrdenEntity): boolean => {
  // Para que sea valido una orden en estado PREPARANDO debe tener productos

  return validarOrdenRequiereRecetaYEstanAprobadas(orden);
};

const validarOrdenRequiereRecetaYEstanAprobadas = ({ productsOrder }: OrdenEntity): boolean => {
  const isInvalid = productsOrder.some((producto) => {
    if (producto.requirePrescription && producto.prescription.file === '') {
      console.log('Algun producto requiere receta y no tiene receta cargada', producto);
      return true;
    }

    if (
      producto.requirePrescription &&
      producto.prescription.state !== 'Approved' &&
      producto.prescription.state !== 'Approved_With_Comments'
    ) {
      console.log('Algun producto requiere receta y no tiene receta aprobada', producto);
      return true;
    }

    return false;
  });

  console.log('isInvalid', isInvalid);

  return !isInvalid;

  // const ningunProductoRequiereReceta = productsOrder.every((producto) => !producto.requirePrescription);

  // console.log('productsOrder', JSON.stringify(productsOrder, null, 2));

  // const productosRequierenRecetaYRecetacargada = productsOrder.filter(
  //   (producto) =>
  //     producto.requirePrescription &&
  //     producto.prescription.file !== '' &&
  //     (producto.prescription.state === 'Approved' || producto.prescription.state === 'Approved_With_Comments')
  // );

  // console.log('productosRequierenRecetaYRecetacargada', productosRequierenRecetaYRecetacargada.length);

  // const productoRequiereReceta = productsOrder.filter((producto) => producto.requirePrescription);

  // console.log('productoNoRequiereReceta', productoRequiereReceta.length);

  // const isValid = productoRequiereReceta.length === 0 || productosRequierenRecetaYRecetacargada.length === 0;

  // console.log('isValid', isValid)

  // return isValid;
};

const validaReglaNegocioListoParaRetiro = (orden: OrdenEntity): boolean => {
  return true;
};

const validaReglaNegocioAsignarADelivery = (orden: OrdenEntity): boolean => {
  // Debe tener su courier asignado

  console.log('orden.delivery.provider.provider', orden?.delivery?.provider);

  if (!orden.delivery?.provider || orden.delivery.provider.provider === '') return false;

  // if (
  //   orden.delivery.provider.provider === 'Propio2' &&
  //   (!orden.delivery.provider.service_id || orden.delivery.provider.service_id === '')
  // )
  //   return false;

  // if (orden.delivery.provider.provider === 'Propio Integracion' && !orden.delivery.provider.service_id) return false;

  return true;
};

const validarFacturacionOrden = (orden: OrdenEntity): boolean => {
  console.log(orden.billing.number, orden.billing.urlBilling, orden.billing.urlTimbre);
  if (!orden.billing.number) return false;

  if (!orden.billing.urlBilling || orden.billing.urlBilling === '') return false;

  if (!orden.billing.urlTimbre || orden.billing.urlTimbre === '') return false;

  return true;
};

const validaReglaNegocioEnDelivery = (orden: OrdenEntity): boolean => {
  if (!orden.delivery?.provider || orden.delivery.provider.provider === '') return false;

  if (!orden.delivery?.provider.trackingNumber || orden.delivery.provider.trackingNumber === '') return false;

  return true;
};

const validaReglaNegocioEntregado = (orden: OrdenEntity): boolean => {
  if (!validarFacturacionOrden(orden)) return false;
  return true;
};

const validaReglaNegocioEnObservacion = (orden: OrdenEntity): boolean => {
  return true;
};

const validaReglaNegocioCancelado = (orden: OrdenEntity): boolean => {
  return true;
};
