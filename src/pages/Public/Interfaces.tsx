import { CidItem } from "../Filters/Interfaces";

export interface HeadCell {
  id: keyof Data;
  label: string;
  numeric: boolean;
}

export interface Data {
  name: string;
  cids: CidItem[];
  enabled: boolean;
  actions?: string;
  shareId?: string;
  description?: string;
  id?: number;
}
export interface FilterList {
  id?: number;
  name: string;
  cids: string[];
  enabled: boolean;
  override: boolean;
  originId?: string;
  isBulkSelected?: boolean;
  description?: string;
  notes?: string;
}
