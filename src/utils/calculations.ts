export const calculateTotalPrice = (
  quantity: number,
  pricePerPiece: number
) => quantity * pricePerPiece;

export const calculateTotalFabric = (
  quantity: number,
  fabricCm: number
) => quantity * fabricCm;

export const calculateBalance = (
  totalWork: number,
  totalPayments: number
) => totalWork - totalPayments;