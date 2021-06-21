export const VisibilityString: string[] = [
  "None",
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

export enum BulkSelectedType {
  All,
  Public,
  Private,
  Imported,
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
  rerender?: boolean;
}

export interface CidItemProps {
  cidItem: CidItem;
  saveItem: (i: CidItem) => void;
  deleteItem: (i: CidItem) => void;
  changeCidValue: (i: CidItem) => void;
  cancelEdit: () => void;
  beginMoveToDifferentFilter: (i: CidItem) => Promise<void>;
  index: number;
  isOverrideFilter: boolean;
  isHashedCid: boolean;
}

export interface MoveCIDModalProps {
  cidItem: CidItem;
  optionFilters: FilterList[];
  move: (i: CidItem, fl: FilterList) => Promise<void>;
  closeCallback: () => void;
  show: boolean;
}

export interface ImportFilterModalProps {
  closeCallback: (refreshParent: boolean) => Promise<void>;
  show: boolean;
}

export interface AddCidBatchModalProps {
  closeCallback: (cidsAddedBatch: Array<string>) => Promise<void>;
  show: boolean;
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
  override: boolean;
  origin?: string;
  isBulkSelected?: boolean;
  description?: string;
  notes?: string;
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

export interface AdvancedFilters {
  enabled: boolean;
  list: string[];
}

export interface Config {
  bitscreen: boolean;
  share: boolean;
  advanced: AdvancedFilters;
  filters: Filters;
}
