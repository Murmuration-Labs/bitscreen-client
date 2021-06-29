export interface HeadCell {
  id: keyof Data;
  label: string;
  numeric: boolean;
}

export interface Data {
  name: string;
  cids: number;
  enabled: boolean;
  id: number;
}
