interface Provider {
  id?: number;
  walletAddressHashed?: string;
  country?: string;
  businessName?: string;
  website?: string;
  email?: string;
  contactPerson?: string;
  address?: string;
}

export interface Account extends Provider {
  walletAddress?: string;
}
