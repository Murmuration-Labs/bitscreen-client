import { Provider } from 'types/interfaces';

export const VisibilityString: string[] = [
  'None',
  'Private',
  'Public',
  'Shared',
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
  Shared,
  Exception,
}

export enum BadgeColor {
  None,
  Private,
  Public,
  Shared,
  Imported,
  Orphan,
  Override,
}

export enum BulkSelectedType {
  None,
  All,
  Private,
  Shared,
  Public,
  Imported,
  Exception,
  Orphan,
}

export enum EnabledOption {
  None,
  Local,
  Global,
}

export enum PeriodType {
  daily = 'daily',
  monthly = 'monthly',
  yearly = 'yearly',
}

export interface PeriodInterval {
  startDate: Date | null;
  endDate: Date | null;
}

export function mapVisibilityString(visibilityStr: string): Visibility {
  if (visibilityStr === 'Private') return Visibility.Private;
  if (visibilityStr === 'Public') return Visibility.Public;
  if (visibilityStr === 'Shared') return Visibility.Shared;

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
  updated?: string;
}

export interface ChartDataEntry {
  key: string;
  total_count: number;
  unique_count: number;
}

export interface DashboardData {
  currentlyFiltering: number;
  listSubscribers: number;
  dealsDeclined: number;
  activeLists: number;
  inactiveLists: number;
  importedLists: number;
  privateLists: number;
  publicLists: number;
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

export type Order = 'asc' | 'desc';

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
  shareId: string;
  shared?: boolean;
  isBulkSelected?: boolean;
  description?: string;
  providerId: number;
  provider?: any;
  provider_Filters?: Provider_Filter[];
  notes?: string;
  created?: string;
  updated?: string;
  networks: Array<NetworkType>;
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
  safer?: boolean;
  share: boolean;
}

export interface Conflict {
  crated: string;
  updated: string;
  id: number;
  cid: string;
  refUrl: string;
  filters: { id; name; shareId }[];
}

export interface ConflictModalProps {
  showConflict: {
    single: boolean;
    multiple: boolean;
  };
  conflicts: Conflict[];
  setShowConflict: (showConflict: {
    single: boolean;
    multiple: boolean;
  }) => void;
  removeConflict: (cid: string) => void;
}

export enum NetworkType {
  IPFS = 'IPFS',
  Filecoin = 'Filecoin',
}
