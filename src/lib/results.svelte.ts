import type { Toast } from "./api/toast";

type Result = {
  subtitle?: string | null;
};

let results = $state<Result[]>([]);

export const getResults = () => results;
export const setResults = (newResults: Result[]) => {
  results = newResults;
};

let toast = $state<Toast | null>(null);

export const getToast = (): Toast | null => toast;
export const setToast = (newToast: Toast | null) => {
  toast = newToast;
};
