export interface EcommerceOrderEntity {
  id: string;
  cotizacion?: string;
  customer: string;
  delivery: Delivery;
  payment?: {
    payment: Payment;
  };
  productsOrder: ProductOrder[];
  resumeOrder: ResumeOrder;
  statusOrder: StatusOrder;
  extras: Extras;
}

//  id: Joi.string().required(),
//   cotizacion: Joi.string().optional(),
//   payment: Joi.object({
//     payment: Joi.object({
//       amount: Joi.number().required(),
//       method: Joi.string().required(),
//       originCode: Joi.string().required(),
//       status: Joi.string().required(),
//       wallet: Joi.string().required(),
//     }).required(),
//   }).required(),
//   customer: Joi.string().required(),
//   extras: Joi.object({
//     referrer: Joi.string().required().allow(''),
//   }).required(),
//   // Array ProductOrder
//   productsOrder: Joi.array()
//     .items(
//       Joi.object({
//         batchId: Joi.string().required(),
//         bioequivalent: Joi.boolean().required(),
//         cooled: Joi.boolean().required(),
//         ean: Joi.string().required(),
//         modified: Joi.boolean().required(),
//         expiration: Joi.number().required(),
//         laboratoryName: Joi.string().required(),
//         lineNumber: Joi.number().optional(),
//         liquid: Joi.boolean().required(),
//         fullName: Joi.string().required(),
//         normalUnitPrice: Joi.number().required(),
//         originalPrice: Joi.number().required(),
//         pharmaceuticalForm: Joi.string().required().allow(''),
//         photoURL: Joi.string().required(),
//         prescription: Joi.object({
//           file: Joi.string().required().allow(''),
//           state: Joi.string().required().allow(''),
//           validation: Joi.object({
//             comments: Joi.string().required().allow(''),
//             rut: Joi.string().required().allow(''),
//             responsible: Joi.string().required().allow(''),
//           }).required(),
//         }).optional(),
//         prescriptionType: Joi.string().required(),
//         presentation: Joi.string().required(),
//         price: Joi.number().required(),
//         productCategory: Joi.string().required(),
//         productSubCategory: Joi.array().items(Joi.string()).required(),
//         qty: Joi.number().required(),
//         quantityPerContainer: Joi.string().required().allow(''),
//         recommendations: Joi.string().required().allow(''),
//         referenceId: Joi.number().optional(),
//         refundedQuantity: Joi.number().optional(),
//         requirePrescription: Joi.boolean().required(),
//         shortName: Joi.string().optional().allow(''),
//         sku: Joi.string().required(),
//       })
//     )
//     .required(),
//   resumeOrder: Joi.object({
//     canal: Joi.string().optional().allow(''),
//     convenio: Joi.string().optional(),
//     deliveryPrice: Joi.number().required(),
//     discount: Joi.object({
//       details: Joi.array()
//         .items(
//           Joi.object({
//             descuentos_unitarios: Joi.array()
//               .items(
//                 Joi.object({
//                   cantidad: Joi.number().required(),
//                   descuento_unitario: Joi.number().required(),
//                   expireDate: Joi.string().required(),
//                   lote_id: Joi.string().required(),
//                   mg: Joi.number().required(),
//                   price: Joi.number().required(),
//                   sku: Joi.string().required(),
//                 })
//               )
//               .required(),
//             discount: Joi.number().required(),
//             promotionCode: Joi.string().required(),
//             reference: Joi.string().required(),
//             type: Joi.string().required(),
//           })
//         )
//         .required(),
//       total: Joi.number().required(),
//     }).required(),
//     nroProducts: Joi.number().required(),
//     subtotal: Joi.number().required(),
//     totalPrice: Joi.number().required(),
//   }).required(),
//   statusOrder: Joi.string().required(),
//   delivery: Joi.object({
//     delivery_address: Joi.object({
//       comuna: Joi.string().required(),
//       dpto: Joi.string().optional().allow(''),
//       firstName: Joi.string().required(),
//       lastName: Joi.string().optional().allow(''),
//       fullAddress: Joi.string().optional().allow(''),
//       homeType: Joi.string().optional().allow(''),
//       phone: Joi.string().required(),
//       region: Joi.string().required(),
//       streetName: Joi.string().optional().allow(''),
//       streetNumber: Joi.string().optional().allow(''),
//     }).required(),
//     method: Joi.string().required(),
//     type: Joi.string().required(),
//     cost: Joi.number().required(),
//     compromiso_entrega: Joi.string().required(),
//   }).required(),

interface Delivery {
  compromiso_entrega: string;
  cost: number;
  delivery_address: DeliveryAddress;
  method: DeliveryMethod;
  type?: DeliveryType;
}

export type DeliveryType =
  | ''
  | 'Envío Estándar (48 horas hábiles)'
  | 'Envío Express (4 horas hábiles)'
  | 'Envío en el día (24 horas hábiles)'
  | 'Envío 24 horas hábiles';

export type DeliveryMethod = 'DELIVERY' | 'STORE';

interface DeliveryAddress {
  comuna: string;
  dpto: string;
  firstName: string;
  homeType: string;
  lastName: string;
  phone: string;
  region: string;
  streetName: string;
}

interface Extras {
  referrer: string;
}

interface Payment {
  originCode?: string;
  amount?: number;
  method?: string;
  status: string;
  wallet: string;
}

interface ProductOrder {
  batchId: string;
  bioequivalent: boolean;
  cooled: boolean;
  modified: boolean;
  ean: string;
  expiration: number;
  fullName: string;
  laboratoryName: string;
  liquid: boolean;
  normalUnitPrice: number;
  pharmaceuticalForm: string;
  photoURL: string;
  prescription?: Prescription;
  prescriptionType: PrescriptionType;
  presentation: string;
  price: number;
  productCategory: string;
  productSubCategory: string[];
  qty: number;
  quantityPerContainer: string;
  recommendations: string;
  requirePrescription: boolean;
  shortName: string;
  sku: string;
  originalPrice: number;
}

export interface Prescription {
  file: string;
  state: StatePrescription;
  validation: PrescriptionValidation;
}

export interface PrescriptionValidation {
  comments: string;
  rut: string;
  responsible: string;
}

export type StatePrescription = 'Pending' | 'Rejected' | 'Approved' | 'Approved_With_Comments' | '';

interface ResumeOrder {
  nroProducts: number;
  subtotal: number;
  deliveryPrice: number;
  totalPrice: number;
  discount: Discount;
}

interface Discount {
  total: number;
  details: Details[];
}

interface Details {
  descuentos_unitarios?: DescuentoUnitario[];
  discount?: number;
  promotionCode?: string;
  reference?: string;
  type?: string;
}

interface DescuentoUnitario {
  cantidad: number;
  descuento_unitario: number;
  expireDate: string;
  lote_id: string;
  mg: number;
  price: number;
  sku: string;
}

type PrescriptionType =
  | 'Presentación receta médica'
  | 'Venta directa (Sin receta)'
  | 'Venta bajo receta cheque'
  | 'Receta médica retenida';

export type StatusOrder =
  | 'EN_OBSERVACION'
  | 'CANCELADO'
  | 'CREADO'
  | 'VALIDANDO_RECETA'
  | 'RECETA_VALIDADA'
  | 'PREPARANDO'
  | 'EN_DELIVERY'
  | 'ENTREGADO'
  | 'LISTO_PARA_RETIRO'
  | 'ASIGNAR_A_DELIVERY'
  | 'OBSERVACIONES_RECETAS';
