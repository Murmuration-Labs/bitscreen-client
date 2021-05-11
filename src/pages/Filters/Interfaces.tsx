export const VisibilityString: string[] = [
  "",
  "Private",
  "Public",
  "ThirdParty",
];

export enum Visibility {
  None,
  Private,
  Public,
  ThirdParty,
}

export function mapVisibilityString(visibilityStr: string): Visibility {
  if (visibilityStr === "Private") return Visibility.Private;
  if (visibilityStr === "Public") return Visibility.Public;
  if (visibilityStr === "ThirdParty") return Visibility.ThirdParty;

  return Visibility.None;
}

export interface CidItem {
  id: number;
  cid: string;
  edit: boolean;
}

export interface CidItemProps {
  cidItem: CidItem;
  saveItem: (i: CidItem) => void;
  deleteItem: (i: CidItem) => void;
  index: number;
}

export interface SettingsProps {
  enabled?: boolean;
}

export interface ModalProps {
  filterList: FilterList;
  show: boolean;
  title: string;
  handleClose: () => void;
  modalEntered: () => void;
  dataChanged: (FileList) => void;
  save: () => void;
}

export interface FilterState {
  data: CidItem[];
  filterList: FilterList;
}

export interface FilterList {
  _id?: number;
  name: string;
  cids: string[];
  visibility: Visibility;
  enabled: boolean;
}

export interface CidListProps {
  cids: CidItem[];
  saveItem: (i: CidItem) => void;
  deleteItem: (i: CidItem) => void;
}

export interface DataProps {
  data: [];
}

export interface SettingsState {
  loaded: boolean;
  config: Config;
}

export interface Filters {
  internal: boolean;
  external: boolean;
}

export interface Config {
  bitscreen: boolean;
  share: boolean;
  advanced: boolean;
  filters: Filters;
}
