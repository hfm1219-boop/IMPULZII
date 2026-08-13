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
      const storedUsers = parsed.users ?? [];
      state.users = [
        ...storedUsers,
        ...seedUsers.filter((seedUser) => !storedUsers.some((stored) => stored.id === seedUser.id)),
      ];
      const storedRewards = parsed.rewards ?? [];
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

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getState(): Snapshot {
  load();
  return state;
}

export function setState(mut: (s: Snapshot) => Snapshot | void) {
  load();
  const draft = { ...state };
  const res = mut(draft);
  state = (res as Snapshot | undefined) ?? draft;
  persist();
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
