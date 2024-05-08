import { ProductOrder, StatusOrder } from '../order.entity';

export const generateInitialStatusOrder = (products: ProductOrder[]): StatusOrder => {
  // Verificar si algun Producto requirePrescription y no tiene prescription.file
  const requiereRecetaPeroNoEstaCargada = products.some(
    (producto) => producto.requirePrescription && producto.prescription.file === ''
  );

  if (requiereRecetaPeroNoEstaCargada) {
    return 'OBSERVACIONES_RECETAS';
  }

  // Verificar si algun Producto requirePrescription y no tiene prescription.state aprobado

  const requiereRecetaPeroNoEstaAprobada = products.some(
    (producto) =>
      producto.requirePrescription &&
      producto.prescription.state !== 'Approved' &&
      producto.prescription.state !== 'Approved_With_Comments'
  );

  if (requiereRecetaPeroNoEstaAprobada) {
    return 'VALIDANDO_RECETA';
  }

  const ningunProductoRequiereReceta = products.every(
    (producto) =>
      !producto.requirePrescription ||
      (producto.requirePrescription &&
        (producto.prescription.state === 'Approved' || producto.prescription.state === 'Approved_With_Comments'))
  );

  if (ningunProductoRequiereReceta) {
    return 'RECETA_VALIDADA';
  }

  return 'CREADO';
};
