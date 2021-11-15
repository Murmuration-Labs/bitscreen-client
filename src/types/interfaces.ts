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
}

export interface Account extends Provider {
  walletAddress?: string;
  accessToken?: string;
}
