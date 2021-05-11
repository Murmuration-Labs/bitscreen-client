import { Filters } from "../Settings/Settings";

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

export interface CidItem {
  cid: string;
  edit: boolean;
}

export interface CidItemProps {
  cidItem: CidItem;
  saveItem: (i: CidItem) => void;
  deleteItem: (i: CidItem) => void;
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
  filter: Filters;
}

export interface Config {
  bitscreen: boolean;
  share: boolean;
  advanced: boolean;
  // filter: Filters;
}
