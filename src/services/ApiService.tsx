import axios from "axios";
import { remoteMarketplaceUri, serverUri } from "../config";
import { Account } from "../pages/Contact/Interfaces";
import { CidItem, FilterList } from "../pages/Filters/Interfaces";

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
    const response = await axios.post(`${serverUri()}/filter`, filterList);
    await Promise.all(
      filterList.cids.map((cid) =>
        axios.post<CidItem>(`${serverUri()}/cid`, {
          cid: cid.cid,
          filterId: filterList.id,
        })
      )
    );
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
    await axios.delete(`${serverUri()}/filters/${id}`);
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

  getProviderInfo: async (): Promise<Account> => {
    const response = await axios.get(`${serverUri()}/provider`);
    return response.data as Account;
  },

  updateProviderInfo: async (account: Account): Promise<void> => {
    await axios.put(`${serverUri()}/provider_info`, account);
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
