export interface StockEntity {
  active: boolean;
  batchs: Batch[];
  fullName: string;
  laboratoryName: string;
  sku: string;
}

interface Batch {
  active: boolean;
  expireDate: number;
  id: string;
  mg: number;
  normalPrice: number;
  settlementPrice: number;
  stock: number;
  unitCost: number;
}
