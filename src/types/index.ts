export interface Model {
  id: string;
  date: string;
  modelName: string;
  quantity: number;
  pricePerPiece: number;
  fabricCm: number;
  totalPrice: number;
  totalFabricCm: number;
}

export interface NewModelData {
  date: string;
  modelName: string;
  quantity: number;
  pricePerPiece: number;
  fabricCm: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

export type NewPaymentData = Omit<Payment, "id">;

export interface Summary {
  totalWork: number;
  totalPayments: number;
  balance: number;
  totalPieces: number;
  totalFabricCm: number;
}

/** A settlement closes the account through its date; the next period starts the following day. */
export interface Settlement {
  id: string;
  date: string;
  notes?: string;
}

export interface AllData {
  models: Model[];
  payments: Payment[];
  settlements: Settlement[];
}
