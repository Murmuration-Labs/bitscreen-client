import { CidItem } from "../Filters/Interfaces";

export interface HeadCell<T> {
  id: keyof T;
  label: string;
  numeric?: boolean;
  info?: JSX.Element;
}

export interface Data {
  name: string;
  isImported: boolean;
  cids: CidItem[];
  subs: number;
  providerId: number;
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
  isBulkSelected?: boolean;
  description?: string;
  notes?: string;
}
