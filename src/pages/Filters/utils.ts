import { FilterList } from "./Interfaces";

export const isOrphan = (f: FilterList) =>
  f.provider_Filters &&
  !f.provider_Filters.some((pf) => pf.provider.id === f.provider.id);
export const isEnabled = (f: FilterList) => !isOrphan(f) && f.enabled;
export const isDisabled = (f: FilterList) => !isOrphan(f) && !f.enabled;
