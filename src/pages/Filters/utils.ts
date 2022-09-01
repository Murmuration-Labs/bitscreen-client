import { FilterList } from './Interfaces';
import * as AuthService from 'services/AuthService';

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
export const isDisabledGlobally = (f: FilterList) =>
  !isOrphan(f) &&
  isImported(f) &&
  f.provider_Filters?.every((pf) => pf.active == false);

export const formatDate = (date: string | undefined): string => {
  if (date) {
    const dateObj = new Date(date);
    return (
      dateObj.getFullYear() +
      '-' +
      (dateObj.getMonth() + 1) +
      '-' +
      dateObj.getDate()
    );
  }
  return 'No data';
};

export const itemsToPages = (rowsPerPage) => {
  return ({ from, to, count }) => {
    const totalPages = Math.ceil(count / rowsPerPage);
    const currentPage = Math.ceil(from / rowsPerPage);

    return `${currentPage} of ${totalPages} pages`;
  };
};
