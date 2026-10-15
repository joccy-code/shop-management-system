import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export function pageArgs(query: PaginationQuery) {
  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  };
}
