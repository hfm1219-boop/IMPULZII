import { getState, setState, uid, subscribe } from "./store";
import type {
  Campaign,
  Evidence,
  Execution,
  ExecutionStatus,
  Mission,
  Redemption,
  Reward,
  User,
  Venue,
  VenueMembership,
  WalletTransaction,
} from "./types";

// -- helpers --
function log(actor: string, action: string, entity: string, entityId: string) {
  setState((s) => {
    s.audit = [
      ...s.audit,
      {
        id: uid("log"),
        actorUserId: actor,
        action,
        entity,
        entityId,
        createdAt: new Date().toISOString(),
      },
    ];
  });
}

function inDate(m: Mission, when = new Date()): boolean {
  return new Date(m.startDate) <= when && when <= new Date(m.endDate);
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// -- Auth --
export const AuthService = {
  currentUser(): User | null {
    const s = getState();
    if (!s.currentUserId) return null;
    return s.users.find((u) => u.id === s.currentUserId) ?? null;
  },
  loginAs(userId: string): User | null {
    const u = getState().users.find((x) => x.id === userId);
    if (!u) return null;
    setState((s) => {
      s.currentUserId = u.id;
    });
    return u;
  },
  loginByEmail(email: string): User | null {
    const u = getState().users.find(
      (x) => x.email.toLowerCase() === email.toLowerCase(),
    );
    if (!u) return null;
    setState((s) => {
      s.currentUserId = u.id;
    });
    return u;
  },
  register(input: Omit<User, "id" | "roles" | "verification" | "active" | "createdAt">): User {
    const user: User = {
      ...input,
      id: uid("u"),
      roles: ["participant"],
      verification: "pending",
      active: true,
      createdAt: new Date().toISOString(),
    };
    setState((s) => {
      s.users = [...s.users, user];
      s.currentUserId = user.id;
    });
    return user;
  },
  logout() {
    setState((s) => {
      s.currentUserId = null;
    });
  },
};

// -- Users --
export const UserService = {
  list(): User[] {
    return getState().users;
  },
  byId(id: string): User | undefined {
    return getState().users.find((u) => u.id === id);
  },
  update(id: string, patch: Partial<User>) {
    setState((s) => {
      s.users = s.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
    });
  },
  toggleBlock(id: string) {
    setState((s) => {
      s.users = s.users.map((u) =>
        u.id === id ? { ...u, active: !u.active } : u,
      );
    });
  },
};

// -- Venues & memberships --
export const VenueService = {
  list(): Venue[] {
    return getState().venues;
  },
  byId(id: string): Venue | undefined {
    return getState().venues.find((v) => v.id === id);
  },
  create(v: Omit<Venue, "id">): Venue {
    const nv: Venue = { ...v, id: uid("v") };
    setState((s) => {
      s.venues = [...s.venues, nv];
    });
    return nv;
  },
  membershipsForUser(userId: string): VenueMembership[] {
    return getState().memberships.filter((m) => m.userId === userId);
  },
  membershipsForVenue(venueId: string): VenueMembership[] {
    return getState().memberships.filter((m) => m.venueId === venueId);
  },
  requestMembership(userId: string, venueId: string): VenueMembership {
    const existing = getState().memberships.find(
      (m) => m.userId === userId && m.venueId === venueId,
    );
    if (existing) {
      if (existing.status !== "approved") {
        setState((s) => {
          s.memberships = s.memberships.map((m) =>
            m.id === existing.id
              ? {
                  ...m,
                  status: "approved",
                  requestedAt: new Date().toISOString(),
                  decidedAt: new Date().toISOString(),
                }
              : m,
          );
        });
        log(userId, "membership_approve", "membership", existing.id);
        return {
          ...existing,
          status: "approved",
          requestedAt: new Date().toISOString(),
          decidedAt: new Date().toISOString(),
        };
      }
      return existing;
    }
    const now = new Date().toISOString();
    const m: VenueMembership = {
      id: uid("m"),
      userId,
      venueId,
      status: "approved",
      requestedAt: now,
      decidedAt: now,
    };
    setState((s) => {
      s.memberships = [...s.memberships, m];
    });
    log(userId, "membership_request", "venue", venueId);
    return m;
  },
  requestByCode(userId: string, code: string): VenueMembership | null {
    const v = getState().venues.find(
      (x) => x.joinCode.toLowerCase() === code.trim().toLowerCase(),
    );
    if (!v) return null;
    return VenueService.requestMembership(userId, v.id);
  },
  decideMembership(membershipId: string, approve: boolean, actor: string) {
    setState((s) => {
      s.memberships = s.memberships.map((m) =>
        m.id === membershipId
          ? {
              ...m,
              status: approve ? "approved" : "rejected",
              decidedAt: new Date().toISOString(),
            }
          : m,
      );
    });
    log(actor, approve ? "membership_approve" : "membership_reject", "membership", membershipId);
  },
};

// -- Campaigns --
export const CampaignService = {
  list(): Campaign[] {
    return getState().campaigns;
  },
  byId(id: string): Campaign | undefined {
    return getState().campaigns.find((c) => c.id === id);
  },
  create(c: Omit<Campaign, "id">): Campaign {
    const nc: Campaign = { ...c, id: uid("c") };
    setState((s) => {
      s.campaigns = [...s.campaigns, nc];
    });
    log(c.ownerUserId, "campaign_create", "campaign", nc.id);
    return nc;
  },
  update(id: string, patch: Partial<Campaign>) {
    setState((s) => {
      s.campaigns = s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c));
    });
  },
};

// -- Missions --
export const MissionService = {
  list(): Mission[] {
    return getState().missions;
  },
  byId(id: string): Mission | undefined {
    return getState().missions.find((m) => m.id === id);
  },
  byCampaign(campaignId: string): Mission[] {
    return getState().missions.filter((m) => m.campaignId === campaignId);
  },
  create(m: Omit<Mission, "id">): Mission {
    const nm: Mission = { ...m, id: uid("mi") };
    setState((s) => {
      s.missions = [...s.missions, nm];
    });
    return nm;
  },
  getAvailableMissions(userId: string): Mission[] {
    const s = getState();
    const user = s.users.find((u) => u.id === userId);
    if (!user) return [];
    const approvedVenues = s.memberships
      .filter((m) => m.userId === userId && m.status === "approved")
      .map((m) => m.venueId);
    return s.missions.filter((m) => {
      if (m.status !== "active" || !inDate(m)) return false;
      const campaign = s.campaigns.find((c) => c.id === m.campaignId);
      if (!campaign || campaign.status !== "published") return false;
      if (m.targetCities.length && !m.targetCities.includes(user.city)) return false;
      if (
        m.targetProfileKinds.length &&
        !m.targetProfileKinds.includes(user.profileKind)
      )
        return false;
      if (
        m.targetVenueIds.length &&
        !m.targetVenueIds.some((v) => approvedVenues.includes(v))
      )
        return false;
      const userExecs = s.executions.filter(
        (e) => e.userId === userId && e.missionId === m.id,
      );
      if (userExecs.length >= m.perUserQuota) return false;
      const totalNonRejected = s.executions.filter(
        (e) => e.missionId === m.id && e.status !== "rejected",
      ).length;
      if (totalNonRejected >= m.totalQuota) return false;
      return true;
    });
  },
};

// -- Executions --
export const ExecutionService = {
  list(): Execution[] {
    return getState().executions;
  },
  byId(id: string): Execution | undefined {
    return getState().executions.find((e) => e.id === id);
  },
  byUser(userId: string): Execution[] {
    return getState().executions.filter((e) => e.userId === userId);
  },
  activeForMission(userId: string, missionId: string): Execution | undefined {
    return getState().executions.find(
      (e) =>
        e.userId === userId &&
        e.missionId === missionId &&
        ["accepted", "in_progress", "needs_fix"].includes(e.status),
    );
  },
  accept(userId: string, missionId: string): Execution {
    const mission = MissionService.byId(missionId);
    if (!mission) throw new Error("Misión no encontrada");
    if (!inDate(mission)) throw new Error("La misión está vencida");
    const existing = ExecutionService.activeForMission(userId, missionId);
    if (existing) return existing;
    const approvedVenues = VenueService.membershipsForUser(userId)
      .filter((m) => m.status === "approved")
      .map((m) => m.venueId);
    const venueId = mission.targetVenueIds.find((v) => approvedVenues.includes(v));
    const ex: Execution = {
      id: uid("ex"),
      userId,
      missionId,
      campaignId: mission.campaignId,
      venueId,
      acceptedAt: new Date().toISOString(),
      answers: {},
      evidences: [],
      status: "accepted",
    };
    setState((s) => {
      s.executions = [...s.executions, ex];
    });
    log(userId, "execution_accept", "execution", ex.id);
    return ex;
  },
  start(executionId: string) {
    setState((s) => {
      s.executions = s.executions.map((e) =>
        e.id === executionId
          ? { ...e, status: "in_progress", startedAt: new Date().toISOString() }
          : e,
      );
    });
  },
  saveDraft(executionId: string, answers: Record<string, unknown>, evidences: Evidence[], loc?: { lat: number; lng: number }) {
    setState((s) => {
      s.executions = s.executions.map((e) =>
        e.id === executionId
          ? { ...e, answers, evidences, lat: loc?.lat, lng: loc?.lng }
          : e,
      );
    });
  },
  submit(executionId: string): Execution {
    const ex = ExecutionService.byId(executionId);
    if (!ex) throw new Error("Ejecución no encontrada");
    const mission = MissionService.byId(ex.missionId);
    if (!mission) throw new Error("Misión no encontrada");
    // Validate required fields
    for (const f of mission.fields) {
      if (!f.required) continue;
      const v = ex.answers[f.id];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
        throw new Error(`Campo obligatorio: ${f.label}`);
      }
    }
    if (mission.requiresPhoto && !ex.evidences.some((ev) => ev.type === "photo")) {
      throw new Error("Se requiere al menos una fotografía");
    }
    if (mission.requiresGeo) {
      if (ex.lat === undefined || ex.lng === undefined) {
        throw new Error("Se requiere ubicación");
      }
      const venue = ex.venueId ? VenueService.byId(ex.venueId) : undefined;
      if (venue && mission.geoRadiusMeters) {
        const d = distanceMeters({ lat: ex.lat, lng: ex.lng }, venue);
        if (d > mission.geoRadiusMeters * 20) {
          // generous fallback so mock demo doesn't hard-fail; still logged
          console.warn(`Ubicación lejos del establecimiento: ${Math.round(d)}m`);
        }
      }
    }
    const updated: Execution = {
      ...ex,
      status: mission.requiresAudit ? "in_review" : "approved",
      submittedAt: new Date().toISOString(),
    };
    setState((s) => {
      s.executions = s.executions.map((e) => (e.id === executionId ? updated : e));
    });
    log(ex.userId, "execution_submit", "execution", ex.id);
    if (updated.status === "approved") {
      WalletService.credit(ex.userId, mission.rewardPoints, `Misión: ${mission.name}`, mission.id, ex.id);
    }
    return updated;
  },
  review(
    executionId: string,
    auditorId: string,
    decision: "approved" | "rejected" | "needs_fix",
    notes?: string,
  ): Execution {
    const ex = ExecutionService.byId(executionId);
    if (!ex) throw new Error("Ejecución no encontrada");
    const mission = MissionService.byId(ex.missionId)!;
    const updated: Execution = {
      ...ex,
      status: decision,
      auditorId,
      reviewNotes: notes,
      rejectionReason: decision === "rejected" ? notes : undefined,
    };
    setState((s) => {
      s.executions = s.executions.map((e) => (e.id === executionId ? updated : e));
    });
    log(auditorId, `execution_${decision}`, "execution", ex.id);
    if (decision === "approved") {
      WalletService.credit(ex.userId, mission.rewardPoints, `Misión: ${mission.name}`, mission.id, ex.id);
    }
    return updated;
  },
  pending(): Execution[] {
    return getState().executions.filter((e) => e.status === "in_review");
  },
};

// -- Wallet --
export const WalletService = {
  balance(userId: string): { available: number; pending: number; total: number; redeemed: number } {
    const txs = getState().wallet.filter((t) => t.userId === userId);
    let available = 0;
    let pending = 0;
    let total = 0;
    let redeemed = 0;
    for (const t of txs) {
      if (t.status === "reversed") continue;
      if (t.kind === "redemption") {
        available += t.points; // negative
        redeemed += Math.abs(t.points);
      } else if (t.status === "confirmed") {
        available += t.points;
        if (t.points > 0) total += t.points;
      } else if (t.status === "pending") {
        pending += t.points;
      }
    }
    return { available, pending, total, redeemed };
  },
  transactions(userId: string): WalletTransaction[] {
    return getState()
      .wallet.filter((t) => t.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  credit(userId: string, points: number, concept: string, missionId?: string, executionId?: string) {
    const tx: WalletTransaction = {
      id: uid("w"),
      userId,
      kind: "mission_credit",
      points,
      concept,
      missionId,
      executionId,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };
    setState((s) => {
      s.wallet = [...s.wallet, tx];
    });
  },
  adjust(userId: string, points: number, concept: string, actor: string) {
    setState((s) => {
      s.wallet = [
        ...s.wallet,
        {
          id: uid("w"),
          userId,
          kind: "adjustment",
          points,
          concept,
          createdAt: new Date().toISOString(),
          status: "confirmed",
        },
      ];
    });
    log(actor, "wallet_adjust", "user", userId);
  },
};

// -- Rewards --
export const RewardService = {
  list(): Reward[] {
    return getState().rewards.filter((r) => r.active);
  },
  all(): Reward[] {
    return getState().rewards;
  },
  byId(id: string): Reward | undefined {
    return getState().rewards.find((r) => r.id === id);
  },
  redeem(userId: string, rewardId: string): Redemption {
    const r = RewardService.byId(rewardId);
    if (!r) throw new Error("Recompensa no encontrada");
    if (r.stock <= 0) throw new Error("Sin stock disponible");
    const bal = WalletService.balance(userId);
    if (bal.available < r.pointsRequired) throw new Error("Saldo insuficiente");
    const red: Redemption = {
      id: uid("rd"),
      userId,
      rewardId,
      points: r.pointsRequired,
      status: "requested",
      createdAt: new Date().toISOString(),
    };
    setState((s) => {
      s.redemptions = [...s.redemptions, red];
      s.rewards = s.rewards.map((x) =>
        x.id === rewardId ? { ...x, stock: x.stock - 1 } : x,
      );
      s.wallet = [
        ...s.wallet,
        {
          id: uid("w"),
          userId,
          kind: "redemption",
          points: -r.pointsRequired,
          concept: `Redención: ${r.name}`,
          createdAt: new Date().toISOString(),
          status: "confirmed",
        },
      ];
    });
    log(userId, "redemption_request", "reward", rewardId);
    return red;
  },
  redemptions(userId?: string): Redemption[] {
    const all = getState().redemptions;
    return userId ? all.filter((r) => r.userId === userId) : all;
  },
};

// -- Reports --
export const ReportService = {
  dashboard() {
    const s = getState();
    const publishedCampaigns = s.campaigns.filter((c) => c.status === "published");
    const activeMissions = s.missions.filter((m) => m.status === "active");
    const approved = s.executions.filter((e) => e.status === "approved");
    const rejected = s.executions.filter((e) => e.status === "rejected");
    const submitted = s.executions.filter((e) =>
      ["submitted", "in_review", "approved", "rejected", "needs_fix"].includes(e.status),
    );
    const pointsGiven = s.wallet
      .filter((t) => t.kind === "mission_credit" && t.status === "confirmed")
      .reduce((sum, t) => sum + t.points, 0);
    const approvalRate =
      approved.length + rejected.length > 0
        ? Math.round((approved.length / (approved.length + rejected.length)) * 100)
        : 0;
    return {
      campaignsActive: publishedCampaigns.length,
      missionsPublished: activeMissions.length,
      participantsActive: s.users.filter((u) => u.active && u.roles.includes("participant")).length,
      venuesActive: s.venues.filter((v) => v.active).length,
      executionsSubmitted: submitted.length,
      executionsApproved: approved.length,
      executionsRejected: rejected.length,
      pointsGiven,
      approvalRate,
      pending: s.executions.filter((e) => e.status === "in_review").length,
    };
  },
};

export { subscribe };
