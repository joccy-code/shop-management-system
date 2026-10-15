import { z } from "zod";
import { calendarDaySchema } from "./common.js";

export const reportRangeSchema = z.object({
  from: calendarDaySchema.optional(),
  to: calendarDaySchema.optional(),
});

export type ReportRangeQuery = z.infer<typeof reportRangeSchema>;
