import { Badge } from "@/components/ui/badge";
import { EXECUTION_STATUS_LABELS, type ExecutionStatus } from "@/lib/impulzii/types";

const cls: Record<ExecutionStatus, string> = {
  available: "bg-secondary text-secondary-foreground",
  accepted: "bg-primary/15 text-primary border-primary/30",
  in_progress: "bg-primary/20 text-primary border-primary/40",
  submitted: "bg-warning/20 text-foreground border-warning/40",
  in_review: "bg-warning/20 text-foreground border-warning/40",
  needs_fix: "bg-destructive/15 text-destructive border-destructive/40",
  approved: "bg-success/20 text-foreground border-success/40",
  rejected: "bg-destructive/15 text-destructive border-destructive/40",
  expired: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <Badge variant="outline" className={cls[status]}>
      {EXECUTION_STATUS_LABELS[status]}
    </Badge>
  );
}
