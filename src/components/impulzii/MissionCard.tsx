import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Award } from "lucide-react";
import type { Mission } from "@/lib/impulzii/types";
import { MISSION_TYPE_LABELS } from "@/lib/impulzii/types";
import { CampaignService } from "@/lib/impulzii/services";
import { getState } from "@/lib/impulzii/store";

export function MissionCard({ mission }: { mission: Mission }) {
  const campaign = CampaignService.byId(mission.campaignId);
  const brand = campaign
    ? getState().brands.find((b) => b.id === campaign.brandId)
    : undefined;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(mission.endDate).getTime() - Date.now()) / (86400000)),
  );
  return (
    <Link
      to="/app/missions/$id"
      params={{ id: mission.id }}
      className="block"
    >
      <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {brand?.name ?? "Marca"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {MISSION_TYPE_LABELS[mission.type]}
              </Badge>
            </div>
            <h3 className="font-semibold text-base leading-tight truncate">
              {mission.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {mission.description}
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg gradient-brand text-primary-foreground">
            <Target className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <Award className="h-4 w-4" /> {mission.rewardPoints} pts
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {daysLeft > 0 ? `${daysLeft} días restantes` : "Vence hoy"}
          </span>
        </div>
      </Card>
    </Link>
  );
}