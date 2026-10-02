import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Model, Payment, Settlement } from "../types";

export interface DataContextValue {
  models: Model[];
  payments: Payment[];
  settlements: Settlement[];
  setModels: Dispatch<SetStateAction<Model[]>>;
  setPayments: Dispatch<SetStateAction<Payment[]>>;
  setSettlements: Dispatch<SetStateAction<Settlement[]>>;
  /** عندنا بيانات نعرضها (من الجهاز أو من النت) */
  hasData: boolean;
  /** أول تحميل ومفيش حاجة محفوظة نعرضها */
  loading: boolean;
  /** بنحدّث في الخلفية */
  refreshing: boolean;
  error: string;
  refresh: () => void;
  /** تاريخ آخر تسوية، أو null */
  lastSettlementDate: string | null;
}

export const DataContext = createContext<DataContextValue | null>(null);
