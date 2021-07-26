import axios from "axios";
import { remoteMarketplaceUri, serverUri } from "../config";
import { Account } from "../pages/Contact/Interfaces";
import {
  CidItem,
  FilterList,
  ProviderFilter,
} from "../pages/Filters/Interfaces";
import * as AuthService from "./AuthService";

// For authentication purposes we will use axios.createInstance
// Right now we use straight-forward axios

const cidsRequests = ({ id, cids }: FilterList) => {
  return cids.map((cid) =>
    typeof cid.id === "number"
      ? axios.put<CidItem>(`${serverUri()}/cid/${cid.id}`, {
          cid: cid.cid,
          filterId: id,
        })
      : axios.post<CidItem>(`${serverUri()}/cid`, {
          cid: cid.cid,
          filterId: id,
        })
  );
};

const ApiService = {
  getFilters: async (searchTerm = ""): Promise<FilterList[]> => {
    if (searchTerm) {
      searchTerm += ";";
    }

    const providerId = AuthService.getProviderId();
    searchTerm += "providerId=" + providerId;

    const query = searchTerm
      ? `filter/search?q=${searchTerm}`
      : `filter/search`;
    const response = await axios.get(`${serverUri()}/${query}`);
    console.log(response);
    return response.data;
  },

  addFilter: async (filterList: FilterList): Promise<number> => {
    const providerId = AuthService.getProviderId();

    filterList.providerId = providerId;

    const response = await axios.post(`${serverUri()}/filter`, filterList);
    const filterId = response.data.id;

    const providerFilter: ProviderFilter = {
      providerId,
      filterId,
      notes: filterList.notes,
      active: filterList.enabled,
    };
    await axios.post(`${serverUri()}/provider-filter`, providerFilter);

    return filterId;
  },

  addProviderFilter: async (providerFilter: ProviderFilter): Promise<void> => {
    await axios.post(`${serverUri()}/provider-filter`, providerFilter);
  },

  updateFilter: async (filters: FilterList[]): Promise<FilterList[]> => {
    const importedFilters: FilterList[] = [];
    const regularFilters: FilterList[] = [];

    filters.forEach((filter) => {
      // check for both undefined and null
      if (filter.originId == null) {
        regularFilters.push(filter);
      } else {
        importedFilters.push(filter);
      }
    });

    const currentProviderId = AuthService.getProviderId();
    await Promise.all(
      importedFilters.map((filter) => {
        const providerFilter: ProviderFilter = {
          notes: filter.notes,
          active: filter.enabled,
        };
        const response = axios.put(
          `${serverUri()}/provider-filter/${currentProviderId}/${filter.id}`,
          providerFilter
        );

        return response;
      })
    );

    const responses = await Promise.all(
      regularFilters.map((filter) => {
        const providerFilter: ProviderFilter = {
          notes: filter.notes,
          active: filter.enabled,
        };
        axios.put(
          `${serverUri()}/provider-filter/${currentProviderId}/${filter.id}`,
          providerFilter
        );

        const response = axios.put<FilterList>(
          `${serverUri()}/filter/${filter.id}`,
          filter
        );

        return response;
      })
    );

    await Promise.all(regularFilters.flatMap((f) => cidsRequests(f)));

    return responses.map(({ data }) => data);
  },

  deleteFilter: async (filter: FilterList): Promise<void> => {
    const currentProviderId = AuthService.getProviderId();
    await axios.delete(
      `${serverUri()}/provider-filter/${currentProviderId}/${filter.id}`
    );
    if (!filter.originId) {
      await axios.delete(`${serverUri()}/filter/${filter.id}`);
    }
  },

  deleteCid: async (_cid: CidItem | CidItem[]) => {
    const array = _cid as CidItem[];

    if (array && array.length) {
      return await Promise.all(
        array
          .filter(({ id }) => id)
          .map(({ id }) => axios.delete(`${serverUri()}/cid/${id}`))
      );
    }

    const cid = _cid as CidItem;
    if (!cid || !cid.id) {
      return;
    }

    return axios.delete(`${serverUri()}/cid/${cid.id}`);
  },

  fetchRemoteFilter: async (filterUri: string): Promise<FilterList> => {
    const response = await axios.get(filterUri);
    return response.data as FilterList;
  },

  getCidOverride: async (cid: string, fl: FilterList): Promise<FilterList> => {
    const response = await axios.get(
      `${serverUri()}/cid/is-override-remote/${fl.id}/${cid}`
    );
    return response.data as FilterList;
  },

  getCidOverrideLocal: async (
    cid: string,
    fl: FilterList
  ): Promise<FilterList> => {
    const response = await axios.get(
      `${serverUri()}/cid/is-override-local/${fl.id}/${cid}`
    );
    return response.data as FilterList;
  },

  getProvider: async (account: Account | string): Promise<Account | null> => {
    const wallet =
      typeof account === "string" ? account : account.walletAddress;

    const response = await axios.get<Account | null>(
      `${serverUri()}/provider/${wallet}`
    );

    if (!response.data) {
      return null;
    }

    return {
      ...(typeof account === "string" ? { walletAddress: wallet } : account),
      ...response.data,
    };
  },

  createProvider: async (wallet: string): Promise<Account> => {
    return axios.post(`${serverUri()}/provider/${wallet}`);
  },

  updateProvider: async (account: Account): Promise<Account> => {
    const response = await axios.put(`${serverUri()}/provider`, account);
    return {
      ...account,
      ...response.data,
    };
  },

  getOverrideCids: async (filterList: FilterList): Promise<string[]> => {
    const response = await axios.post(
      `${serverUri()}/cids/override/${filterList.id}`,
      filterList.cids
    );
    return response.data as string[];
  },

  getAllFilters: async (
    page: number,
    rowsPerPage: number,
    mySortBy: string,
    mySort: string,
    searchedValue: string
  ): Promise<{
    data: FilterList[];
    sort: any;
    page: number;
    per_page: number;
    count: number;
  }> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filter/public`,
      {
        params: {
          per_page: rowsPerPage,
          page: page,
          sort: {
            [mySortBy]: mySort,
          },
          q: searchedValue,
          providerId: AuthService.getProviderId(),
        },
      }
    );
    return response.data;
  },

  getCountAllFilter: async (searchedValue: string): Promise<number> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filter/public/count`,
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
