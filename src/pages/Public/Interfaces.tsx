import { CidItem } from "../Filters/Interfaces";

export interface HeadCell {
  id: keyof Data;
  label: string;
  numeric: boolean;
}

export interface Data {
  name: string;
  cids: CidItem[];
  subs: number;
  providerName: string;
  providerCountry?: string;
  enabled: boolean;
  actions?: string;
  shareId?: string;
  description?: string;
  updated?: string;
  id?: number;
}
export interface FilterList {
  id?: number;
  name: string;
  cids: string[];
  enabled: boolean;
  override: boolean;
  isBulkSelected?: boolean;
  description?: string;
  notes?: string;
}
