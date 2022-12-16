export interface Provider {
  id?: number;
  walletAddressHashed?: string;
  country?: string;
  businessName?: string;
  website?: string;
  email?: string;
  contactPerson?: string;
  address?: string;
  nonce?: string;
  consentDate?: string;
  guideShown?: boolean;
  lastUpdate?: Date;
  minerId?: string;
}

export interface BasicAuthInfo {
  consentDate: string;
}

export interface BasicAuthInfoEmail extends BasicAuthInfo {
  loginEmail: string;
}

export interface BasicAuthInfoWallet extends BasicAuthInfo {
  nonceMessage: string;
  nonce: string;
  walletAddress: string;
}

export interface Account extends Provider {
  walletAddress?: string;
  loginEmail?: string;
  accessToken?: string;
}

export interface DealFromApi {
  unique_blocked: string;
  total_blocked: string;
  key: string;
}

export enum LoginType {
  Wallet,
  Email,
}
