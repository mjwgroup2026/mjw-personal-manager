import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionState = "trial" | "active" | "grace" | "expired" | "cancelled" | "none";

interface SubscriptionInfo {
  state: SubscriptionState;
  plan: string;
  expiresAt: string | null;
  trialDaysRemaining: number | null;
  loading: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canExport: boolean;
  isRestricted: boolean;
  message: string | null;
  refetch: () => void;
}

const resolveState = (sub: any): SubscriptionState => {
  if (!sub) return "none";
  const status = sub.status as string;
  if (status === "trial") {
    // Check if trial expired
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) return "expired";
    return "trial";
  }
  if (status === "active") return "active";
  if (status === "grace") return "grace";
  if (status === "cancelled") {
    if (sub.expires_at && new Date(sub.expires_at) > new Date()) return "active";
    return "cancelled";
  }
  if (status === "expired") return "expired";
  return "active";
};

const calcTrialDays = (sub: any): number | null => {
  if (!sub || sub.status !== "trial" || !sub.expires_at) return null;
  const diff = new Date(sub.expires_at).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const useSubscription = (): SubscriptionInfo => {
  const { user } = useAuth();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = () => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("subscription_status")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSub(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSub();
  }, [user]);

  const state = resolveState(sub);
  const trialDaysRemaining = calcTrialDays(sub);

  const canCreate = state === "active" || state === "trial" || state === "grace";
  const canEdit = state === "active" || state === "trial" || state === "grace";
  const canExport = state === "active" || state === "trial" || state === "grace";
  const isRestricted = state === "expired" || state === "cancelled" || state === "none";

  let message: string | null = null;
  if (state === "trial" && trialDaysRemaining !== null) {
    message = `Trial ends in ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""}`;
  }
  if (state === "grace") message = "Your subscription is in a grace period. Please renew to avoid losing access.";
  if (state === "expired") message = "Your trial or subscription has expired. Please subscribe or enter a redeem code to continue.";
  if (state === "cancelled") message = "Your subscription has been cancelled. Access is read-only.";
  if (state === "none") message = "No active subscription. Please subscribe or enter a redeem code.";

  return {
    state,
    plan: sub?.plan ?? "free",
    expiresAt: sub?.expires_at ?? null,
    trialDaysRemaining,
    loading,
    canCreate,
    canEdit,
    canExport,
    isRestricted,
    message,
    refetch: fetchSub,
  };
};
