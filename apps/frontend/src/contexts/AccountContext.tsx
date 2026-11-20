import { createContext, useContext } from 'react';

export type AvatarKind = 'point' | 'circle' | 'triangle' | 'image';

export type PlanId = 'free' | 'forgia' | 'part' | 'full' | 'h24';

export interface Plan {
  id: PlanId;
  name: string;
  priceCents: number;
  monthlyMessages: number;
  tier: 'light' | 'full';
  forgeRooms: boolean;
  forgeElayra: boolean;
}

export interface Account {
  nickname: string;
  onboarded: boolean;
  referralCode: string | null;
  avatarKind: AvatarKind | null;
  avatarPath: string | null;
  elayraNotes: string;
  plan: PlanId;
  usage: { used: number; limit: number };
  subscription: { plan: PlanId; status: string; current_period_end: string | null; sponsored_by: string | null } | null;
  grants: { plan: PlanId; ends_at: string; source: string }[];
  plans: Plan[];
}

export interface AccountContextValue {
  account: Account | null;
  refresh: () => Promise<void>;
}

export const AccountContext = createContext<AccountContextValue>({ account: null, refresh: async () => {} });

export const useAccount = () => useContext(AccountContext);

export const planOf = (account: Account | null): Plan | undefined =>
  account?.plans.find((p) => p.id === account.plan);
