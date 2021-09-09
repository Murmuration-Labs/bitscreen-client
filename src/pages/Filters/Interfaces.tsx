import { Provider } from "../Contact/Interfaces";

export const VisibilityString: string[] = [
  "None",
  "Private",
  "Public",
  "Shareable",
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
  Shareable,
}

export enum BulkSelectedType {
  None,
  All,
  Private,
  Shared,
  Public,
  Imported,
  Override,
  Orphan,
}

export enum EnabledOption {
  None,
  Local,
  Global,
}

export function mapVisibilityString(visibilityStr: string): Visibility {
  if (visibilityStr === "Private") return Visibility.Private;
  if (visibilityStr === "Public") return Visibility.Public;
  if (visibilityStr === "Shareable") return Visibility.Shareable;

  return Visibility.None;
}

export interface CidItem {
  id?: number;
  created?: string;
  tableKey: string;
  cid: string;
  refUrl?: string;
  edit?: boolean;
  isChecked: boolean;
  isSaved: boolean;
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
  cancelEdit: (i: CidItem, index: number) => void;
  beginMoveToDifferentFilter: (i: CidItem[]) => Promise<void>;
  prepareModalForDeleteItems: (i: CidItem[]) => void;
}

export type Order = "asc" | "desc";

export interface MoveCIDModalProps {
  cidItems: CidItem[];
  optionFilters: FilterList[];
  move: (i: CidItem[], fl: FilterList) => Promise<void>;
  closeCallback: () => void;
  show: boolean;
}

export interface ImportFilterModalProps {
  prefetch?: string;
  filter?: FilterList;
  closeCallback: (refreshParent: boolean) => Promise<void>;
  show: boolean;
}

export interface ToggleEnabledFilterModalProps {
  show: boolean;
  title: string;
  callback: (option: EnabledOption) => void;
  closeCallback: () => void;
}

export interface AddCidBatchCallbackPayload {
  result: string[];
  refUrl: string;
}

export interface AddCidBatchModalProps {
  closeCallback: (data: AddCidBatchCallbackPayload | null) => Promise<void>;
  edit?: boolean;
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

export interface Provider_Filter {
  id: number;
  provider: Provider;
  filter: FilterList;
  active: boolean;
  notes?: string;
}
export interface FilterList {
  id: number;
  name: string;
  cids: CidItem[];
  cidsCount?: number;
  visibility: Visibility;
  enabled: boolean;
  override: boolean;
  shareId: string;
  shared?: boolean;
  isBulkSelected?: boolean;
  description?: string;
  providerId: number;
  provider?: any;
  provider_Filters?: Provider_Filter[];
  notes?: string;
}

export interface ProviderFilter {
  id?: number;
  active: boolean;
  notes?: string;
  providerId?: number;
  filterId?: number;
}

export interface CidListProps {
  cids: CidItem[];
  saveItem: (i: CidItem) => void;
  deleteItem: (i: CidItem) => void;
}

export interface DataProps {
  data: [];
}

export interface Config {
  bitscreen: boolean;
  import: boolean;
  share: boolean;
}
