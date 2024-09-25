export interface ProductoEntity {
  active: boolean;
  basePrice: number;
  batchs: Batch[];
  bioequivalent: boolean;
  composicion: Composition[];
  cooled: boolean;
  ean: string;
  fullName: string;
  genericName: string;
  laboratoryName: string;
  pharmaceuticalForm: string;
  photoURL: string;
  prescriptionType: string;
  presentation: string;
  priority: number;
  productCategory: string;
  productSubCategory: string;
  quantityPerContainer: number;
  recommendations: string;
  requiresPrescription: boolean;
  restrictions: string;
  shortName: string;
  sku: string;
  temporaryCategories: string[];
}

export interface Batch {
  active: boolean;
  expireDate: number;
  id: string;
  normalPrice: number;
  settlementPrice: number;
  stock: number;
  unitCost: number;
}

interface Composition {
  principio_activo: string;
  concentracion: string;
  unidad_de_medida: string;
}
