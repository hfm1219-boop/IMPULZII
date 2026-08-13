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

function updatedStatus(mission: Mission): ExecutionStatus {
  return mission.requiresAudit ? "in_review" : "approved";
}

function requirePlatformAdmin(userId: string) {
  const user = getState().users.find((item) => item.id === userId);
  if (!user?.active || !user.roles.includes("platform_admin")) {
    throw new Error("Solo el administrador de plataforma puede realizar esta acción");
  }
}

function frequencyWindowStart(mission: Mission, now = new Date()): number {
  if (["once", "campaign"].includes(mission.frequency)) return Number.NEGATIVE_INFINITY;
  const start = new Date(now);
  if (mission.frequency === "daily") start.setHours(0, 0, 0, 0);
  if (mission.frequency === "weekly") {
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  }
  if (mission.frequency === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return start.getTime();
}

function reconcileExpiredRedemptions() {
  const now = Date.now();
  if (
    !getState().redemptions.some(
      (redemption) =>
        redemption.status === "requested" && new Date(redemption.expiresAt).getTime() <= now,
    )
  ) {
    return;
  }
  setState((s) => {
    const expired = s.redemptions.filter(
      (redemption) =>
        redemption.status === "requested" && new Date(redemption.expiresAt).getTime() <= now,
    );
    if (!expired.length) return;
    const ids = new Set(expired.map((redemption) => redemption.id));
    s.redemptions = s.redemptions.map((redemption) =>
      ids.has(redemption.id) ? { ...redemption, status: "cancelled" } : redemption,
    );
    s.wallet = s.wallet.map((transaction) =>
      transaction.redemptionId && ids.has(transaction.redemptionId)
        ? { ...transaction, status: "reversed" }
        : transaction,
    );
    const restored = new Map<string, number>();
    for (const redemption of expired) {
      restored.set(redemption.rewardId, (restored.get(redemption.rewardId) ?? 0) + 1);
    }
    s.rewards = s.rewards.map((reward) => ({
      ...reward,
      stock: reward.stock + (restored.get(reward.id) ?? 0),
    }));
  });
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// -- Auth --
export const AuthService = {
  currentUser(): User | null {
    const s = getState();
    if (!s.currentUserId) return null;
    return s.users.find((u) => u.id === s.currentUserId && u.active) ?? null;
  },
  loginAs(userId: string): User | null {
    const u = getState().users.find((x) => x.id === userId && x.active);
    if (!u) return null;
    setState((s) => {
      s.currentUserId = u.id;
    });
    return u;
  },
  loginByEmail(email: string): User | null {
    const normalized = email.trim().toLowerCase();
    const u = getState().users.find((x) => x.active && x.email.toLowerCase() === normalized);
    if (!u) return null;
    setState((s) => {
      s.currentUserId = u.id;
    });
    return u;
  },
  register(input: Omit<User, "id" | "roles" | "verification" | "active" | "createdAt">): User {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedDocument = input.docNumber.trim();
    const users = getState().users;
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error("Ya existe una cuenta con este correo");
    }
    if (users.some((user) => user.docNumber === normalizedDocument)) {
      throw new Error("Ya existe una cuenta con este documento");
    }
    const user: User = {
      ...input,
      email: normalizedEmail,
      docNumber: normalizedDocument,
      id: uid("u"),
      roles: ["participant"],
      verification: "verified",
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
      s.users = s.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
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
  create(v: Omit<Venue, "id">, actorUserId: string): Venue {
    requirePlatformAdmin(actorUserId);
    if (!v.commercialName.trim() || !v.legalName.trim() || !v.nit.trim()) {
      throw new Error("Completa la información obligatoria del establecimiento");
    }
    if (getState().venues.some((item) => item.nit === v.nit.trim())) {
      throw new Error("Ya existe un establecimiento con este NIT");
    }
    const nv: Venue = { ...v, id: uid("v") };
    setState((s) => {
      s.venues = [...s.venues, nv];
    });
    log(actorUserId, "venue_create", "venue", nv.id);
    return nv;
  },
  membershipsForUser(userId: string): VenueMembership[] {
    return getState().memberships.filter((m) => m.userId === userId);
  },
  membershipsForVenue(venueId: string): VenueMembership[] {
    return getState().memberships.filter((m) => m.venueId === venueId);
  },
  requestMembership(userId: string, venueId: string): VenueMembership {
    const state = getState();
    if (!state.users.some((user) => user.id === userId && user.active)) {
      throw new Error("Participante no encontrado o inactivo");
    }
    if (!state.venues.some((venue) => venue.id === venueId && venue.active)) {
      throw new Error("Establecimiento no encontrado o inactivo");
    }
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
    const v = getState().venues.find((x) => x.joinCode.toLowerCase() === code.trim().toLowerCase());
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
    requirePlatformAdmin(c.ownerUserId);
    if (!c.name.trim() || !c.description.trim()) throw new Error("Completa nombre y descripción");
    if (!getState().brands.some((brand) => brand.id === c.brandId)) {
      throw new Error("Selecciona una marca válida");
    }
    if (new Date(c.startDate) > new Date(c.endDate)) {
      throw new Error("La fecha final debe ser posterior a la inicial");
    }
    if (!Number.isFinite(c.budgetPoints) || c.budgetPoints <= 0) {
      throw new Error("El presupuesto debe ser mayor que cero");
    }
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
  create(m: Omit<Mission, "id">, actorUserId: string): Mission {
    requirePlatformAdmin(actorUserId);
    const campaign = getState().campaigns.find((item) => item.id === m.campaignId);
    if (!campaign) throw new Error("Selecciona una campaña válida");
    if (!m.name.trim() || !m.instructions.trim())
      throw new Error("Completa nombre e instrucciones");
    if (new Date(m.startDate) > new Date(m.endDate)) {
      throw new Error("La fecha final debe ser posterior a la inicial");
    }
    if (m.rewardPoints <= 0 || m.totalQuota <= 0 || m.perUserQuota <= 0) {
      throw new Error("Puntos y cupos deben ser mayores que cero");
    }
    if (m.perUserQuota > m.totalQuota) {
      throw new Error("El cupo por participante no puede superar el cupo total");
    }
    const nm: Mission = { ...m, id: uid("mi") };
    setState((s) => {
      s.missions = [...s.missions, nm];
    });
    log(actorUserId, "mission_create", "mission", nm.id);
    return nm;
  },
  getAvailableMissions(userId: string): Mission[] {
    const s = getState();
    const user = s.users.find((u) => u.id === userId);
    if (!user?.active || !user.roles.includes("participant") || user.verification !== "verified") {
      return [];
    }
    const approvedVenues = s.memberships
      .filter(
        (membership) =>
          membership.userId === userId &&
          membership.status === "approved" &&
          s.venues.some((venue) => venue.id === membership.venueId && venue.active),
      )
      .map((m) => m.venueId);
    return s.missions.filter((m) => {
      if (m.status !== "active" || !inDate(m)) return false;
      const campaign = s.campaigns.find((c) => c.id === m.campaignId);
      if (
        !campaign ||
        campaign.status !== "published" ||
        new Date(campaign.startDate) > new Date() ||
        new Date(campaign.endDate) < new Date()
      ) {
        return false;
      }
      if (campaign.targetCities.length && !campaign.targetCities.includes(user.city)) return false;
      if (
        campaign.targetProfileKinds.length &&
        !campaign.targetProfileKinds.includes(user.profileKind)
      ) {
        return false;
      }
      if (
        campaign.targetVenueIds.length &&
        !campaign.targetVenueIds.some((venueId) => approvedVenues.includes(venueId))
      ) {
        return false;
      }
      if (m.targetCities.length && !m.targetCities.includes(user.city)) return false;
      if (m.targetProfileKinds.length && !m.targetProfileKinds.includes(user.profileKind))
        return false;
      if (m.targetVenueIds.length && !m.targetVenueIds.some((v) => approvedVenues.includes(v)))
        return false;
      const userExecs = s.executions.filter(
        (e) =>
          e.userId === userId &&
          e.missionId === m.id &&
          e.status !== "rejected" &&
          new Date(e.acceptedAt ?? 0).getTime() >= frequencyWindowStart(m),
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
    if (mission.status !== "active") throw new Error("La misión no está activa");
    if (!inDate(mission)) throw new Error("La misión está vencida");
    const existing = ExecutionService.activeForMission(userId, missionId);
    if (existing) return existing;
    if (!MissionService.getAvailableMissions(userId).some((item) => item.id === missionId)) {
      throw new Error("Esta misión no está disponible para tu perfil o establecimiento");
    }
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
    const execution = ExecutionService.byId(executionId);
    if (!execution || !["accepted", "needs_fix"].includes(execution.status)) {
      throw new Error("La ejecución no se puede iniciar en su estado actual");
    }
    setState((s) => {
      s.executions = s.executions.map((e) =>
        e.id === executionId
          ? { ...e, status: "in_progress", startedAt: new Date().toISOString() }
          : e,
      );
    });
  },
  saveDraft(
    executionId: string,
    answers: Record<string, unknown>,
    evidences: Evidence[],
    loc?: { lat: number; lng: number },
  ) {
    const execution = ExecutionService.byId(executionId);
    if (!execution || !["accepted", "in_progress", "needs_fix"].includes(execution.status)) {
      throw new Error("La ejecución no se puede editar en su estado actual");
    }
    setState((s) => {
      s.executions = s.executions.map((e) =>
        e.id === executionId ? { ...e, answers, evidences, lat: loc?.lat, lng: loc?.lng } : e,
      );
    });
  },
  submit(executionId: string): Execution {
    const ex = ExecutionService.byId(executionId);
    if (!ex) throw new Error("Ejecución no encontrada");
    if (!["accepted", "in_progress", "needs_fix"].includes(ex.status)) {
      throw new Error("La ejecución ya fue enviada");
    }
    const mission = MissionService.byId(ex.missionId);
    if (!mission) throw new Error("Misión no encontrada");
    if (mission.status !== "active" || !inDate(mission)) {
      throw new Error("La misión ya no está activa");
    }
    // Validate required fields
    for (const f of mission.fields) {
      if (!f.required) continue;
      const v = ex.answers[f.id];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
        throw new Error(`Campo obligatorio: ${f.label}`);
      }
    }
    for (const f of mission.fields) {
      const value = ex.answers[f.id];
      if (value === undefined || value === null || value === "") continue;
      if (["number", "currency"].includes(f.type)) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error(`Valor numérico inválido: ${f.label}`);
        }
        if (f.min !== undefined && value < f.min) {
          throw new Error(`${f.label} debe ser mínimo ${f.min}`);
        }
        if (f.max !== undefined && value > f.max) {
          throw new Error(`${f.label} debe ser máximo ${f.max}`);
        }
      }
      if (["dropdown", "single_choice"].includes(f.type) && !f.options?.includes(String(value))) {
        throw new Error(`Opción inválida: ${f.label}`);
      }
      if (
        f.type === "multi_choice" &&
        (!Array.isArray(value) || value.some((item) => !f.options?.includes(String(item))))
      ) {
        throw new Error(`Opciones inválidas: ${f.label}`);
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
        if (d > mission.geoRadiusMeters) {
          throw new Error(
            `Debes estar a menos de ${mission.geoRadiusMeters} m del establecimiento (distancia actual: ${Math.round(d)} m)`,
          );
        }
      }
    }
    if (updatedStatus(mission) === "approved") {
      WalletService.credit(
        ex.userId,
        mission.rewardPoints,
        `Misión: ${mission.name}`,
        mission.id,
        ex.id,
      );
    }
    const updated: Execution = {
      ...ex,
      status: updatedStatus(mission),
      submittedAt: new Date().toISOString(),
      pointsAwarded: mission.requiresAudit ? undefined : mission.rewardPoints,
      auditorId: undefined,
      reviewNotes: undefined,
      rejectionReason: undefined,
    };
    setState((s) => {
      s.executions = s.executions.map((e) => (e.id === executionId ? updated : e));
    });
    log(ex.userId, "execution_submit", "execution", ex.id);
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
    if (ex.status !== "in_review") throw new Error("La ejecución ya fue revisada");
    const actor = UserService.byId(auditorId);
    if (
      !actor?.active ||
      !actor.roles.some((role) => ["auditor", "platform_admin"].includes(role))
    ) {
      throw new Error("No tienes permiso para auditar ejecuciones");
    }
    const mission = MissionService.byId(ex.missionId);
    if (!mission) throw new Error("Misión no encontrada");
    if (decision === "approved") {
      WalletService.credit(
        ex.userId,
        mission.rewardPoints,
        `Misión: ${mission.name}`,
        mission.id,
        ex.id,
      );
    }
    const updated: Execution = {
      ...ex,
      status: decision,
      auditorId,
      reviewNotes: notes,
      rejectionReason: decision === "rejected" ? notes : undefined,
      pointsAwarded: decision === "approved" ? mission.rewardPoints : undefined,
    };
    setState((s) => {
      s.executions = s.executions.map((e) => (e.id === executionId ? updated : e));
    });
    log(auditorId, `execution_${decision}`, "execution", ex.id);
    return updated;
  },
  pending(): Execution[] {
    return getState().executions.filter((e) => e.status === "in_review");
  },
};

// -- Wallet --
export const WalletService = {
  balance(userId: string): { available: number; pending: number; total: number; redeemed: number } {
    reconcileExpiredRedemptions();
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
    reconcileExpiredRedemptions();
    return getState()
      .wallet.filter((t) => t.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  credit(
    userId: string,
    points: number,
    concept: string,
    missionId?: string,
    executionId?: string,
  ) {
    if (!Number.isFinite(points) || points <= 0) throw new Error("Crédito de puntos inválido");
    if (
      executionId &&
      getState().wallet.some(
        (transaction) =>
          transaction.executionId === executionId &&
          transaction.kind === "mission_credit" &&
          transaction.status !== "reversed",
      )
    ) {
      return;
    }
    if (missionId) {
      const state = getState();
      const mission = state.missions.find((item) => item.id === missionId);
      const campaign = mission
        ? state.campaigns.find((item) => item.id === mission.campaignId)
        : undefined;
      if (!mission || !campaign) throw new Error("Campaña de la misión no encontrada");
      const spent = state.wallet
        .filter(
          (transaction) =>
            transaction.kind === "mission_credit" &&
            transaction.status === "confirmed" &&
            state.missions.some(
              (item) => item.id === transaction.missionId && item.campaignId === campaign.id,
            ),
        )
        .reduce((sum, transaction) => sum + transaction.points, 0);
      if (spent + points > campaign.budgetPoints) {
        throw new Error("La campaña no tiene presupuesto de puntos disponible");
      }
    }
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
    const actingUser = UserService.byId(actor);
    if (!actingUser?.active || !actingUser.roles.includes("platform_admin")) {
      throw new Error("No tienes permiso para ajustar saldos");
    }
    if (!Number.isFinite(points) || points === 0) throw new Error("Ajuste de puntos inválido");
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
    reconcileExpiredRedemptions();
    return getState().rewards.filter((r) => r.active);
  },
  all(): Reward[] {
    return getState().rewards;
  },
  byId(id: string): Reward | undefined {
    return getState().rewards.find((r) => r.id === id);
  },
  create(reward: Omit<Reward, "id">, actorUserId: string): Reward {
    requirePlatformAdmin(actorUserId);
    if (!reward.name.trim() || !reward.description.trim()) {
      throw new Error("Completa nombre y descripción de la recompensa");
    }
    if (reward.pointsRequired <= 0 || reward.stock < 0) {
      throw new Error("Créditos e inventario no son válidos");
    }
    if (!reward.merchantName?.trim() || !reward.merchantId?.trim()) {
      throw new Error("Define el comercio autorizado");
    }
    const created: Reward = { ...reward, id: uid("r") };
    setState((state) => {
      state.rewards = [...state.rewards, created];
    });
    log(actorUserId, "reward_create", "reward", created.id);
    return created;
  },
  redeem(userId: string, rewardId: string): Redemption {
    reconcileExpiredRedemptions();
    const participant = UserService.byId(userId);
    if (!participant?.active || !participant.roles.includes("participant")) {
      throw new Error("Participante no encontrado o inactivo");
    }
    let red: Redemption | null = null;
    setState((s) => {
      const r = s.rewards.find((reward) => reward.id === rewardId);
      if (!r || !r.active) throw new Error("Recompensa no encontrada");
      if (!r.merchantId) throw new Error("El beneficio no tiene un comercio autorizado");
      if (r.stock <= 0) throw new Error("Sin stock disponible");
      const available = s.wallet
        .filter(
          (transaction) => transaction.userId === userId && transaction.status === "confirmed",
        )
        .reduce((balance, transaction) => balance + transaction.points, 0);
      if (available < r.pointsRequired) throw new Error("Saldo insuficiente");
      const now = new Date();
      red = {
        id: uid("rd"),
        userId,
        rewardId,
        points: r.pointsRequired,
        status: "requested",
        createdAt: now.toISOString(),
        token: RewardService.createToken(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
      s.redemptions = [...s.redemptions, red];
      s.rewards = s.rewards.map((x) => (x.id === rewardId ? { ...x, stock: x.stock - 1 } : x));
      s.wallet = [
        ...s.wallet,
        {
          id: uid("w"),
          userId,
          kind: "redemption",
          points: -r.pointsRequired,
          concept: `Reserva de redención: ${r.name}`,
          redemptionId: red.id,
          createdAt: new Date().toISOString(),
          status: "confirmed",
        },
      ];
    });
    log(userId, "redemption_request", "reward", rewardId);
    if (!red) throw new Error("No se pudo crear la redención");
    return red;
  },
  redemptions(userId?: string): Redemption[] {
    reconcileExpiredRedemptions();
    const all = getState().redemptions;
    return userId ? all.filter((r) => r.userId === userId) : all;
  },
  createToken(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let token = "";
    const secureRandom = (max: number) => {
      if (!globalThis.crypto?.getRandomValues) {
        throw new Error("Generador criptográfico no disponible");
      }
      const value = new Uint32Array(1);
      globalThis.crypto.getRandomValues(value);
      return value[0] % max;
    };
    do {
      const block = () =>
        Array.from({ length: 4 }, () => alphabet[secureRandom(alphabet.length)]).join("");
      token = `${block()}-${block()}-${block()}`;
    } while (getState().redemptions.some((redemption) => redemption.token === token));
    return token;
  },
  checkToken(token: string, actorUserId: string) {
    reconcileExpiredRedemptions();
    const normalized = token.trim().toUpperCase();
    const redemption = getState().redemptions.find(
      (item) => item.token?.toUpperCase() === normalized,
    );
    if (!redemption) return { valid: false as const, reason: "Token no encontrado" };

    const reward = RewardService.byId(redemption.rewardId);
    const participant = getState().users.find((user) => user.id === redemption.userId);
    const actor = getState().users.find((user) => user.id === actorUserId);
    if (!reward || !participant?.active || !actor?.active) {
      return { valid: false as const, reason: "No fue posible verificar la redención" };
    }
    if (!actor.roles.some((role) => ["venue_admin", "platform_admin"].includes(role))) {
      return { valid: false as const, reason: "No tienes permiso para validar tokens" };
    }
    if (
      !actor.roles.includes("platform_admin") &&
      (!reward.merchantId || !actor.merchantIds?.includes(reward.merchantId))
    ) {
      return {
        valid: false as const,
        reason: "El token pertenece a otro establecimiento",
        redemption,
        reward,
        participant,
      };
    }
    if (redemption.status === "delivered") {
      return {
        valid: false as const,
        reason: "Este token ya fue utilizado",
        redemption,
        reward,
        participant,
      };
    }
    if (["rejected", "cancelled"].includes(redemption.status)) {
      return {
        valid: false as const,
        reason: "Esta redención fue cancelada",
        redemption,
        reward,
        participant,
      };
    }
    if (new Date(redemption.expiresAt).getTime() <= Date.now()) {
      return {
        valid: false as const,
        reason: "El token está vencido",
        redemption,
        reward,
        participant,
      };
    }
    return { valid: true as const, redemption, reward, participant };
  },
  consumeToken(token: string, actorUserId: string): Redemption {
    reconcileExpiredRedemptions();
    let updated: Redemption | null = null;
    setState((s) => {
      const normalized = token.trim().toUpperCase();
      const redemption = s.redemptions.find((item) => item.token?.toUpperCase() === normalized);
      if (!redemption) throw new Error("Token no encontrado");
      const reward = s.rewards.find((item) => item.id === redemption.rewardId);
      const actor = s.users.find((item) => item.id === actorUserId);
      if (!reward || !actor?.active) throw new Error("No fue posible verificar la redención");
      if (!actor.roles.some((role) => ["venue_admin", "platform_admin"].includes(role))) {
        throw new Error("No tienes permiso para validar tokens");
      }
      if (
        !actor.roles.includes("platform_admin") &&
        (!reward.merchantId || !actor.merchantIds?.includes(reward.merchantId))
      ) {
        throw new Error("El token pertenece a otro establecimiento");
      }
      if (redemption.status === "delivered") throw new Error("Este token ya fue utilizado");
      if (redemption.status !== "requested") throw new Error("Esta redención no está activa");
      if (new Date(redemption.expiresAt).getTime() <= Date.now())
        throw new Error("El token está vencido");
      updated = {
        ...redemption,
        status: "delivered",
        redeemedAt: new Date().toISOString(),
        validatedByUserId: actorUserId,
      };
      s.redemptions = s.redemptions.map((item) => (item.id === updated!.id ? updated! : item));
    });
    if (!updated) throw new Error("No se pudo aplicar el beneficio");
    const delivered = updated as Redemption;
    log(actorUserId, "redemption_delivered", "redemption", delivered.id);
    return delivered;
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
