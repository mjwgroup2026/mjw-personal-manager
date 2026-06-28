import { useSubscription } from "@/hooks/useSubscription";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SubscriptionGateProps {
  children: React.ReactNode;
  action?: "create" | "edit" | "export";
}

/** Wraps content that requires an active subscription. Shows restriction message when blocked. */
const SubscriptionGate = ({ children, action = "create" }: SubscriptionGateProps) => {
  const { isRestricted, message, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) return <>{children}</>;

  if (isRestricted) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground font-body">
              {action === "create" ? "Creating records" : action === "edit" ? "Editing records" : "Exports"} restricted
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1">
              {message || "Your subscription does not allow this action. Please subscribe or enter a redeem code."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs font-body"
              onClick={() => navigate("/app/subscription")}
            >
              View Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;

/** Inline hook-based guard for buttons/actions. Returns true if action is blocked. */
export const useSubscriptionGuard = () => {
  const sub = useSubscription();
  return {
    ...sub,
    guardCreate: () => {
      if (sub.isRestricted) return sub.message || "Subscription required";
      return null;
    },
    guardEdit: () => {
      if (!sub.canEdit) return sub.message || "Subscription required";
      return null;
    },
    guardExport: () => {
      if (!sub.canExport) return sub.message || "Subscription required";
      return null;
    },
  };
};
