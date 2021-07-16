export const VisibilityString: string[] = [
  "None",
  "Private",
  "Public",
  "ThirdParty",
];

export enum ViewTypes {
  New,
  Edit,
  Imported,
}

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
  id?: number;
  cid: string;
  refUrl?: string;
  edit?: boolean;
  isChecked: boolean;
  rerender?: boolean;
}

export interface CidItemProps {
  index: number;
  cidItem: CidItem;
  filterList: FilterList;
  isEdit: boolean;
  isOverrideFilter: boolean;
  isHashedCid: boolean;
  saveItem: (i: CidItem, idx: number) => void;
  updateCidItem: (i: CidItem, idx: number) => void;
  changeCidValue: (i: CidItem, idx: number) => void;
  cancelEdit: (i: CidItem, index: number) => void;
  beginMoveToDifferentFilter: (i: CidItem[], idx: number) => Promise<void>;
  prepareModalForDeleteItems: (i: CidItem[]) => void;
}

export interface MoveCIDModalProps {
  cidItems: CidItem[];
  optionFilters: FilterList[];
  move: (i: CidItem[], fl: FilterList) => Promise<void>;
  closeCallback: () => void;
  show: boolean;
}

export interface ImportFilterModalProps {
  prefetch?: string;
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
  id: number;
  name: string;
  cids: CidItem[];
  visibility: Visibility;
  enabled: boolean;
  override: boolean;
  origin?: string;
  isBulkSelected?: boolean;
  description?: string;
  providerId: number;
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
