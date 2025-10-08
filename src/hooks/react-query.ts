import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { searchUsers, type SearchUsersResult } from "@/api/users";

export {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type {
  InfiniteData,
  InfiniteQueryObserverOptions,
  MutationObserverOptions,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

type UseSearchUsersOptions = {
  page?: number;
  limit?: number;
  enabled?: boolean;
};

/**
 * Shared hook for querying users with TanStack Query.
 * Keeps the search page lean while exposing pagination controls if needed later.
 */
export function useSearchUsers(
  query: string,
  { page = 1, limit = 20, enabled = true }: UseSearchUsersOptions = {}
): UseQueryResult<SearchUsersResult, unknown> {
  return useTanstackQuery({
    queryKey: ["search-users", query, page, limit],
    queryFn: () => searchUsers(query, page, limit),
    enabled,
  });
}
