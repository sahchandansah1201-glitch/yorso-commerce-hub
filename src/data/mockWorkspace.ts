/**
 * Mock-данные для Buyer Workspace v1. Все значения предсказуемые и
 * стабильные — тесты опираются на них напрямую.
 */
import { mockOffers } from "@/data/mockOffers";

export interface SavedOfferEntry {
  offerId: string;
  savedAt: string;
  note?: string;
}

export type PriceRequestStatus = "pending" | "approved" | "rejected";

export interface PriceRequestEntry {
  id: string;
  offerId: string;
  supplier: string;
  product: string;
  status: PriceRequestStatus;
  requestedAt: string;
  respondedAt?: string;
}

export interface MessageThreadEntry {
  id: string;
  supplier: string;
  supplierCountry: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface ActivityItem {
  id: string;
  type: "offer_view" | "price_request" | "message";
  label: string;
  at: string;
}

const offerByIndex = (i: number) => mockOffers[i % mockOffers.length];

export const mockSavedOffers: SavedOfferEntry[] = [
  { offerId: offerByIndex(0).id, savedAt: "2026-04-20T09:14:00Z", note: "Match for Q3 buyer brief" },
  { offerId: offerByIndex(1).id, savedAt: "2026-04-19T14:02:00Z" },
  { offerId: offerByIndex(2).id, savedAt: "2026-04-18T11:28:00Z", note: "Compare with Vietnam supplier" },
  { offerId: offerByIndex(3).id, savedAt: "2026-04-15T08:00:00Z" },
];

export const mockPriceRequests: PriceRequestEntry[] = [
  {
    id: "pr_001",
    offerId: offerByIndex(0).id,
    supplier: offerByIndex(0).supplierName,
    product: offerByIndex(0).productName,
    status: "approved",
    requestedAt: "2026-04-19T10:00:00Z",
    respondedAt: "2026-04-20T08:30:00Z",
  },
  {
    id: "pr_002",
    offerId: offerByIndex(1).id,
    supplier: offerByIndex(1).supplierName,
    product: offerByIndex(1).productName,
    status: "pending",
    requestedAt: "2026-04-21T14:00:00Z",
  },
  {
    id: "pr_003",
    offerId: offerByIndex(2).id,
    supplier: offerByIndex(2).supplierName,
    product: offerByIndex(2).productName,
    status: "rejected",
    requestedAt: "2026-04-17T09:12:00Z",
    respondedAt: "2026-04-18T07:45:00Z",
  },
];

export const mockMessageThreads: MessageThreadEntry[] = [
  {
    id: "th_001",
    supplier: offerByIndex(0).supplierName,
    supplierCountry: offerByIndex(0).origin,
    lastMessage: "We can confirm the volume for May shipment.",
    lastMessageAt: "2026-04-22T07:20:00Z",
    unread: 2,
  },
  {
    id: "th_002",
    supplier: offerByIndex(1).supplierName,
    supplierCountry: offerByIndex(1).origin,
    lastMessage: "Updated pricing attached for your review.",
    lastMessageAt: "2026-04-21T16:40:00Z",
    unread: 0,
  },
  {
    id: "th_003",
    supplier: offerByIndex(2).supplierName,
    supplierCountry: offerByIndex(2).origin,
    lastMessage: "Glazing percentage clarification: 8%.",
    lastMessageAt: "2026-04-20T11:10:00Z",
    unread: 1,
  },
];

export const mockActivity: ActivityItem[] = [
  { id: "a_001", type: "offer_view", label: offerByIndex(3).productName, at: "2026-04-22T08:00:00Z" },
  { id: "a_002", type: "price_request", label: offerByIndex(1).productName, at: "2026-04-21T14:00:00Z" },
  { id: "a_003", type: "message", label: offerByIndex(0).supplierName, at: "2026-04-22T07:20:00Z" },
  { id: "a_004", type: "offer_view", label: offerByIndex(4).productName, at: "2026-04-20T18:30:00Z" },
];

export const workspaceKpis = () => ({
  savedCount: mockSavedOffers.length,
  pendingPriceRequests: mockPriceRequests.filter((p) => p.status === "pending").length,
  unreadMessages: mockMessageThreads.reduce((sum, t) => sum + t.unread, 0),
  activeSuppliers: new Set(mockMessageThreads.map((t) => t.supplier)).size,
});
