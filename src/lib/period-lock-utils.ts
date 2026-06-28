import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth } from "date-fns";

export async function isMonthLocked(entityId: string, date: string): Promise<boolean> {
  const monthDate = format(startOfMonth(new Date(date)), "yyyy-MM-dd");
  const { data } = await supabase
    .from("period_locks")
    .select("id")
    .eq("entity_id", entityId)
    .eq("locked_month", monthDate)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function getLockedMonths(entityId: string): Promise<string[]> {
  const { data } = await supabase
    .from("period_locks")
    .select("locked_month")
    .eq("entity_id", entityId);
  return (data ?? []).map(d => d.locked_month);
}
