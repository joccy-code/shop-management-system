import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { fetchCurrentUser } from "./api";

export const authQueryKey = ["auth", "me"] as const;

export function useAuth() {
  const query = useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

  const isUnauthenticated =
    query.isError &&
    query.error instanceof ApiError &&
    query.error.status === 401;

  return {
    // TanStack Query keeps the last successful `data` around even after a
    // background refetch fails (e.g. right after logout), so callers must
    // not treat that stale value as a signed-in user once the query errors.
    user: query.isError ? undefined : query.data,
    isLoading: query.isLoading,
    isUnauthenticated,
  };
}

export function useInvalidateAuth() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: authQueryKey });
}
