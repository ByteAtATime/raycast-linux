type Result = {
  subtitle?: string | null;
};

let results = $state<Result[]>([]);

export const getResults = () => results;

export const setResults = (newResults: Result[]) => {
  results = newResults;
};
