// Impulzii — domain models
export type ProfileKind =
  | "waiter"
  | "bartender"
  | "venue_admin"
  | "seller"
  | "promoter"
  | "merchandiser"
  | "shopkeeper"
  | "brand_ambassador"
  | "customer_service";

export const PROFILE_KIND_LABELS: Record<ProfileKind, string> = {
  waiter: "Mesero",
  bartender: "Bartender",
  venue_admin: "Administrador de establecimiento",
  seller: "Vendedor",
  promoter: "Promotor",
  merchandiser: "Mercaderista",
  shopkeeper: "Tendero",
  brand_ambassador: "Embajador de marca",
  customer_service: "Atención al cliente",
};

export type Role = "participant" | "venue_admin" | "auditor" | "platform_admin";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface User {
  id: string;
  fullName: string;
  docType: "CC" | "CE" | "PA";
  docNumber: string;
  email: string;
  phone: string;
  city: string;
  photoUrl?: string;
  profileKind: ProfileKind;
  roles: Role[];
  verification: VerificationStatus;
  active: boolean;
  createdAt: string;
  merchantIds?: string[];
}

export type VenueType =
  | "restaurant"
  | "bar"
  | "hotel"
  | "liquor_store"
  | "store"
  | "supermarket"
  | "club"
  | "cafe"
  | "other";

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  restaurant: "Restaurante",
  bar: "Bar",
  hotel: "Hotel",
  liquor_store: "Licorera",
  store: "Tienda",
  supermarket: "Supermercado",
  club: "Discoteca",
  cafe: "Café",
  other: "Otro",
};

export interface Venue {
  id: string;
  commercialName: string;
  legalName: string;
  nit: string;
  type: VenueType;
  city: string;
  address: string;
  lat: number;
  lng: number;
  adminUserId?: string;
  active: boolean;
  joinCode: string;
  logoUrl?: string;
}

export type MembershipStatus = "pending" | "approved" | "rejected" | "inactive";

export interface VenueMembership {
  id: string;
  userId: string;
  venueId: string;
  status: MembershipStatus;
  requestedAt: string;
  decidedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

export type CampaignStatus =
  "draft" | "scheduled" | "published" | "paused" | "finished" | "cancelled";

export interface Campaign {
  id: string;
  name: string;
  brandId: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  budgetPoints: number;
  status: CampaignStatus;
  targetCities: string[];
  targetVenueIds: string[];
  targetProfileKinds: ProfileKind[];
  ownerUserId: string;
  terms: string;
}

export type MissionType =
  | "sale"
  | "display"
  | "training"
  | "info"
  | "recommendation"
  | "activation"
  | "survey"
  | "collective";

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  sale: "Venta",
  display: "Exhibición",
  training: "Capacitación",
  info: "Información comercial",
  recommendation: "Recomendación",
  activation: "Activación",
  survey: "Encuesta",
  collective: "Meta colectiva",
};

export type Frequency = "once" | "daily" | "weekly" | "monthly" | "campaign";

export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "currency"
  | "date"
  | "time"
  | "dropdown"
  | "single_choice"
  | "multi_choice"
  | "yes_no"
  | "photo"
  | "document"
  | "location"
  | "signature"
  | "qr";

export interface MissionField {
  id: string;
  label: string;
  description?: string;
  type: FieldType;
  required: boolean;
  order: number;
  options?: string[];
  min?: number;
  max?: number;
  maxFiles?: number;
}

export interface Mission {
  id: string;
  campaignId: string;
  name: string;
  description: string;
  instructions: string;
  imageUrl?: string;
  type: MissionType;
  startDate: string;
  endDate: string;
  rewardPoints: number;
  totalQuota: number;
  perUserQuota: number;
  frequency: Frequency;
  requiresGeo: boolean;
  requiresPhoto: boolean;
  requiresVenueValidation: boolean;
  requiresAudit: boolean;
  targetProfileKinds: ProfileKind[];
  targetVenueIds: string[];
  targetCities: string[];
  status: "active" | "inactive";
  fields: MissionField[];
  geoRadiusMeters?: number;
}

export type ExecutionStatus =
  | "available"
  | "accepted"
  | "in_progress"
  | "submitted"
  | "in_review"
  | "needs_fix"
  | "approved"
  | "rejected"
  | "expired";

export const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
  available: "Disponible",
  accepted: "Aceptada",
  in_progress: "En ejecución",
  submitted: "Enviada",
  in_review: "En revisión",
  needs_fix: "Requiere corrección",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Vencida",
};

export interface Evidence {
  id: string;
  type: "photo" | "document" | "location" | "signature" | "qr";
  fileDataUrl?: string;
  createdAt: string;
  lat?: number;
  lng?: number;
  hash?: string;
}

export interface Execution {
  id: string;
  userId: string;
  missionId: string;
  campaignId: string;
  venueId?: string;
  acceptedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  answers: Record<string, unknown>;
  evidences: Evidence[];
  lat?: number;
  lng?: number;
  status: ExecutionStatus;
  auditorId?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  pointsAwarded?: number;
}

export type WalletTxKind =
  "mission_credit" | "adjustment" | "reversal" | "redemption" | "expiration";

export interface WalletTransaction {
  id: string;
  userId: string;
  kind: WalletTxKind;
  points: number; // signed
  concept: string;
  missionId?: string;
  executionId?: string;
  redemptionId?: string;
  createdAt: string;
  status: "pending" | "confirmed" | "reversed";
}

export interface Reward {
  id: string;
  name: string;
  imageUrl?: string;
  description: string;
  pointsRequired: number;
  stock: number;
  active: boolean;
  merchantName?: string;
  city?: string;
  tripadvisorRank?: number;
  tripadvisorRating?: number;
  category?: string;
  merchantId?: string;
}

export type RedemptionStatus = "requested" | "approved" | "delivered" | "rejected" | "cancelled";

export interface Redemption {
  id: string;
  userId: string;
  rewardId: string;
  points: number;
  status: RedemptionStatus;
  createdAt: string;
  token: string;
  expiresAt: string;
  redeemedAt?: string;
  validatedByUserId?: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}
