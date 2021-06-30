export interface HeadCell {
  id: keyof Data;
  label: string;
  numeric: boolean;
}

export interface Data {
  name: string;
  cids: string[];
  enabled: boolean;
  _id?: number;
}
export interface FilterList {
  _id?: number;
  name: string;
  cids: string[];
  enabled: boolean;
  override: boolean;
  origin?: string;
  isBulkSelected?: boolean;
  description?: string;
  notes?: string;
}
