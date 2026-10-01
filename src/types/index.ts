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

export interface Payment {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}
