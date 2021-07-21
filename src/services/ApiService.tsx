import axios from "axios";
import { remoteMarketplaceUri, serverUri } from "../config";
import { Account } from "../pages/Contact/Interfaces";
import { CidItem, FilterList } from "../pages/Filters/Interfaces";
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
  getFilters: async (searchTerm?: string): Promise<FilterList[]> => {
    const query = searchTerm
      ? `filter/search?q=${searchTerm}`
      : `filter/search`;
    const response = await axios.get(`${serverUri()}/${query}`);
    console.log(response);
    return response.data;
  },

  addFilter: async (filterList: FilterList): Promise<number> => {
    //TODO: Need to populate with an ACTUAL provierId
    // Hardcoding it to id 0 (Anonymous) for now
    const provider = AuthService.getAccount();

    if (filterList.providerId !== 0 && !filterList.providerId && provider) {
      filterList.providerId = provider.id as number;
    }

    const response = await axios.post(`${serverUri()}/filter`, filterList);
    return response.data.id;
  },

  updateFilter: async (
    filterList: FilterList | FilterList[]
  ): Promise<FilterList[]> => {
    const array = filterList as FilterList[];

    if (array && array.length) {
      const responses = await Promise.all(
        array.map((filter) =>
          axios.put<FilterList>(`${serverUri()}/filter/${filter.id}`, filter)
        )
      );

      await Promise.all(array.flatMap((f) => cidsRequests(f)));

      return responses.map(({ data }) => data);
    }

    const filter = filterList as FilterList;

    const response = await axios.put(
      `${serverUri()}/filter/${filter.id}`,
      filter
    );

    await Promise.all(cidsRequests(filter));

    return [response.data];
  },

  deleteFilter: async (id: number): Promise<void> => {
    await axios.delete(`${serverUri()}/filter/${id}`);
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
