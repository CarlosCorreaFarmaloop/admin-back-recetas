export const validateStatusChange = (currentStatus: string, toStatus: string) => {
  const statusChangeMap: Record<string, string[]> = {
    VALIDANDO_RECETA: ['EN_OBSERVACION', 'OBSERVACIONES_RECETAS', 'CREADO'],
    RECETA_VALIDADA: ['VALIDANDO_RECETA', 'CREADO', 'EN_OBSERVACION'],
    OBSERVACIONES_RECETAS: ['CREADO'],
    PREPARANDO: ['RECETA_VALIDADA'],
    LISTO_PARA_RETIRO: ['PREPARANDO'],
    ASIGNAR_A_DELIVERY: ['PREPARANDO'],
    EN_DELIVERY: ['ASIGNAR_A_DELIVERY'],
    ENTREGADO: ['LISTO_PARA_RETIRO', 'EN_DELIVERY'],
    EN_OBSERVACION: ['VALIDANDO_RECETA', 'OBSERVACIONES_RECETAS', 'PREPARANDO'],
    CANCELADO: ['VALIDANDO_RECETA', 'OBSERVACIONES_RECETAS', 'EN_OBSERVACION'],
    CREADO: [],
  };

  const nextValidStatus: string[] = statusChangeMap[toStatus];

  if (nextValidStatus?.includes(currentStatus)) {
    return true;
  } else {
    return false;
  }
};