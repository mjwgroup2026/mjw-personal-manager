type SentraEvent =
  | "USER_CREATED"
  | "TRIAL_STARTED"
  | "TRIAL_EXPIRED"
  | "SUBSCRIPTION_PURCHASED"
  | "SUBSCRIPTION_CANCELLED"
  | "WORKSPACE_CREATED"
  | "LOGIN";

interface PlatformSpecificData {
  vat_registered?: boolean;
  vat_number?: string | null;
  transactions_count?: number;
  tax_year?: string;
}

interface SentraPayload {
  platform: "ledgera";
  event: SentraEvent;
  user_id: string;
  timestamp: string;
  plan: string;
  amount: number;
  workspace_id?: string;
  metadata?: {
    entity_id?: string;
    entity_name?: string;
    platform_specific_data?: PlatformSpecificData;
    [key: string]: unknown;
  };
}

export const sendSentraWebhook = async (
  event: SentraEvent,
  userId: string,
  plan = "free",
  amount = 0,
  workspaceId?: string,
  metadata?: SentraPayload["metadata"]
): Promise<void> => {
  const payload: SentraPayload = {
    platform: "ledgera",
    event,
    user_id: userId,
    timestamp: new Date().toISOString(),
    plan,
    amount,
  };

  if (workspaceId) {
    payload.workspace_id = workspaceId;
  }

  if (metadata) {
    payload.metadata = metadata;
  }

  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    await fetch(
      `https://${projectId}.supabase.co/functions/v1/sentra-webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify(payload),
      }
    );
  } catch (e) {
    // Fire-and-forget — don't block auth flow
    console.warn("[Sentra] webhook failed:", e);
  }
};
