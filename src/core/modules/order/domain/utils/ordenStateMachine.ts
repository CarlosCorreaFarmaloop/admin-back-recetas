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
  console.log('Validando Regla Negocio de observaciones receta');
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
};

const validaReglaNegocioListoParaRetiro = (orden: OrdenEntity): boolean => {
  if (validarSiTieneSeguroComplementario(orden)) {
    return validarSeguroComplementarioConfirmado(orden);
  }

  return true;
};

const validarSiTieneSeguroComplementario = (orden: OrdenEntity): boolean => {
  if (!orden.seguroComplementario) return false;

  return true;
};

const validarSeguroComplementarioConfirmado = (orden: OrdenEntity): boolean => {
  if (!orden.seguroComplementario) return false;

  if (orden?.seguroComplementario?.vouchers_url?.length > 0 && orden?.seguroComplementario?.billing.length > 0)
    return true;

  return false;
};

const validaReglaNegocioAsignarADelivery = (orden: OrdenEntity): boolean => {
  if (validarSiTieneSeguroComplementario(orden)) {
    const seguroConfirmado = validarSeguroComplementarioConfirmado(orden);

    if (!seguroConfirmado) return false;

    console.log('orden.delivery.provider.provider', orden?.delivery?.provider);

    if (!orden.delivery?.provider || orden.delivery.provider.provider === '') return false;

    return true;
  }

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
