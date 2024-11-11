export interface Order {
  id: string;
  productsOrder: Product[];
  statusOrder: StatusOrder;
}

interface Product {
  prescription: {
    file: string;
    state: 'Pending' | 'Approved';
  };
  requirePrescription: boolean;
}

type StatusOrder = 'ENTREGADO';

export interface GPTResponse {
  clinica: string;
  doctor: string;
  especialidad: string;
}
