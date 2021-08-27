import { FilterList } from "./Interfaces";
import * as AuthService from "../../services/AuthService";

export const isOrphan = (f: FilterList) =>
  f.provider_Filters &&
  !f.provider_Filters.some((pf) => pf.provider.id === f.provider.id);
export const isEnabled = (f: FilterList) => !isOrphan(f) && f.enabled;
export const isDisabled = (f: FilterList) => !isOrphan(f) && !f.enabled;
export const isShared = (f: FilterList) =>
  f.provider_Filters &&
  f.provider_Filters.length > 1 &&
  f.provider.id === AuthService.getProviderId();
export const isImported = (f: FilterList) =>
  f.provider.id !== AuthService.getProviderId();

export const formatDate = (date: string | undefined): string => {
  if (date) {
    const dateObj = new Date(date);
    return (
      dateObj.getFullYear() +
      "-" +
      (dateObj.getMonth() + 1) +
      "-" +
      dateObj.getDate()
    );
  }
  return "No data";
};
