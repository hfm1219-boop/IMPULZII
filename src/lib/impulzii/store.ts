import {
  seedBrands,
  seedCampaigns,
  seedMemberships,
  seedMissions,
  seedRewards,
  seedUsers,
  seedVenues,
} from "./seed";
import type {
  Brand,
  Campaign,
  Execution,
  Mission,
  Redemption,
  Reward,
  User,
  Venue,
  VenueMembership,
  WalletTransaction,
  AuditLog,
} from "./types";

export interface Snapshot {
  users: User[];
  venues: Venue[];
  brands: Brand[];
  memberships: VenueMembership[];
  campaigns: Campaign[];
  missions: Mission[];
  executions: Execution[];
  wallet: WalletTransaction[];
  rewards: Reward[];
  redemptions: Redemption[];
  audit: AuditLog[];
  currentUserId: string | null;
}

const KEY = "impulzii:v1";

function initial(): Snapshot {
  return {
    users: seedUsers,
    venues: seedVenues,
    brands: seedBrands,
    memberships: seedMemberships,
    campaigns: seedCampaigns,
    missions: seedMissions,
    executions: [],
    wallet: [],
    rewards: seedRewards,
    redemptions: [],
    audit: [],
    currentUserId: null,
  };
}

type Listener = () => void;
const listeners = new Set<Listener>();
let state: Snapshot = initial();
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Snapshot>;
      state = { ...initial(), ...parsed };
      const storedUsers = (parsed.users ?? []).map((user) => {
        const seedUser = seedUsers.find((item) => item.id === user.id);
        const brandedUser = seedUser
          ? { ...user, fullName: seedUser.fullName, email: seedUser.email }
          : user;
        return !seedUser &&
          brandedUser.roles.includes("participant") &&
          brandedUser.verification === "pending"
          ? { ...brandedUser, verification: "verified" as const }
          : brandedUser;
      });
      state.users = [
        ...storedUsers,
        ...seedUsers.filter((seedUser) => !storedUsers.some((stored) => stored.id === seedUser.id)),
      ];
      const storedRewards = (parsed.rewards ?? []).map((reward) => {
        const seedReward = seedRewards.find((item) => item.id === reward.id);
        return seedReward ? { ...reward, name: seedReward.name } : reward;
      });
      state.rewards = [
        ...storedRewards,
        ...seedRewards.filter(
          (seedReward) => !storedRewards.some((stored) => stored.id === seedReward.id),
        ),
      ];
    }
  } catch {
    // ignore
  }
}

function persist(): boolean {
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function getState(): Snapshot {
  load();
  return state;
}

export function setState(mut: (s: Snapshot) => Snapshot | void) {
  load();
  const previous = state;
  const draft = { ...state };
  const res = mut(draft);
  state = (res as Snapshot | undefined) ?? draft;
  if (!persist()) {
    state = previous;
    throw new Error("No fue posible guardar los cambios en este navegador");
  }
  listeners.forEach((l) => l());
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function resetStore() {
  state = initial();
  persist();
  listeners.forEach((l) => l());
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
