import {
  Bell,
  Building2,
  Globe2,
  MapPin,
  Package,
  User,
  type LucideIcon,
} from "lucide-react";

export type AccountSectionKey =
  | "personal"
  | "company"
  | "branches"
  | "products"
  | "meta-regions"
  | "notifications";

export const ACCOUNT_SECTIONS: {
  key: AccountSectionKey;
  icon: LucideIcon;
  labelKey: string;
}[] = [
  { key: "personal", icon: User, labelKey: "account_nav_personal" },
  { key: "company", icon: Building2, labelKey: "account_nav_company" },
  { key: "branches", icon: MapPin, labelKey: "account_nav_branches" },
  { key: "products", icon: Package, labelKey: "account_nav_products" },
  { key: "meta-regions", icon: Globe2, labelKey: "account_nav_metaRegions" },
  { key: "notifications", icon: Bell, labelKey: "account_nav_notifications" },
];
