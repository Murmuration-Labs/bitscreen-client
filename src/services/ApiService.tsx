import axios from "axios";
import { FilterList } from "../pages/Filters/Interfaces";
import { serverUri, remoteMarketplaceUri } from "../config";
import { Account } from "../pages/Contact/Interfaces";

// For authentication purposes we will use axios.createInstance
// Right now we use straight-forward axios

const ApiService = {
  getFilters: async (searchTerm?: string): Promise<FilterList[]> => {
    const query = searchTerm
      ? `search-filters?search=${searchTerm}`
      : `search-filters`;
    const response = await axios.get(`${serverUri()}/${query}`);
    return response.data;
  },

  addFilter: async (filterList: FilterList): Promise<number> => {
    const response = await axios.post(`${serverUri()}/filters`, filterList);
    return response.data._id;
  },

  updateFilter: async (
    filterList: FilterList | FilterList[]
  ): Promise<FilterList[]> => {
    const response = await axios.put(`${serverUri()}/filters`, filterList);
    return response.data;
  },

  deleteFilter: async (id: number): Promise<void> => {
    await axios.delete(`${serverUri()}/filters/${id}`);
  },

  fetchRemoteFilter: async (filterUri: string): Promise<FilterList> => {
    const response = await axios.get(filterUri);
    return response.data as FilterList;
  },

  getCidOverride: async (cid: string): Promise<FilterList> => {
    const response = await axios.get(`${serverUri()}/cid/is-override/${cid}`);
    return response.data as FilterList;
  },

  getProviderInfo: async (): Promise<Account> => {
    const response = await axios.get(`${serverUri()}/provider_info`);
    return response.data as Account;
  },

  updateProviderInfo: async (account: Account): Promise<void> => {
    await axios.put(`${serverUri()}/provider_info`, account);
  },

  getAllFilters: async (
    page: number,
    rowsPerPage: number,
    mySortBy: string,
    mySort: string,
    searchedValue: string
  ): Promise<FilterList[]> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filters/public`,
      {
        params: {
          per_page: rowsPerPage,
          page: page,
          sort: {
            [mySortBy]: mySort,
          },
          q: searchedValue,
        },
      }
    );
    return response.data;
  },

  getCountAllFilter: async (searchedValue: string): Promise<number> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filters/public/count`,
      {
        params: {
          q: searchedValue,
        },
      }
    );

    return response.data.count;
  },
};

export default ApiService;
