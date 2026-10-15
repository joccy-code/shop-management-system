export type AuthShop = {
  id: string;
  name: string;
  currency: string;
  timezone: string;
};

export type AuthUser = {
  id: string;
  phone: string;
  displayName: string;
  role: "OWNER" | "STAFF";
  shop: AuthShop;
};
