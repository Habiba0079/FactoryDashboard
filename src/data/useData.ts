import { useContext } from "react";
import { DataContext } from "./dataContext";

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData لازم يتستخدم جوه DataProvider");
  return value;
}
