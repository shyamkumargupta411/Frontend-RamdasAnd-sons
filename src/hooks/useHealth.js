import { useQuery } from "@tanstack/react-query";

import client from "../api/client";

async function fetchHealth() {
  const { data } = await client.get("/health/", { timeout: 8000 });
  return data;
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    retry: 1,
    staleTime: 15000,
    refetchInterval: 60000,
  });
}
