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
  _cryptId?: string;
  description?: string;
  _id?: number;
}
export interface FilterList {
  _id?: number;
  name: string;
  cids: string[];
  enabled: boolean;
  override: boolean;
  originId?: string;
  isBulkSelected?: boolean;
  description?: string;
  notes?: string;
}
