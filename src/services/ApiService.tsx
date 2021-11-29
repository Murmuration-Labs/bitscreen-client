import detectEthereumProvider from "@metamask/detect-provider";
import axios from "axios";
import Web3 from "web3";
import { remoteMarketplaceUri, serverUri } from "../config";
import { Account, DealFromApi } from "../types/interfaces";
import {
  CidItem,
  FilterList,
  ProviderFilter,
  DashboardData,
  Config,
  ChartDataEntry,
  Conflict,
} from "../pages/Filters/Interfaces";
import { isImported } from "../pages/Filters/utils";
import * as AuthService from "./AuthService";
import fileDownload from "js-file-download";

// For authentication purposes we will use axios.createInstance
// Right now we use straight-forward axios

const cidsRequests = ({ id, cids }: FilterList) => {
  return cids.map((cid) =>
    typeof cid.id === "number"
      ? axios.put<CidItem>(`${serverUri()}/cid/${cid.id}`, {
          cid: cid.cid,
          refUrl: cid.refUrl,
          filterId: id,
        })
      : axios.post<CidItem>(`${serverUri()}/cid`, {
          cid: cid.cid,
          refUrl: cid.refUrl,
          filterId: id,
        })
  );
};

const ApiService = {
  getFilter: async (shareId: string): Promise<FilterList> => {
    const response = await axios.get(`${serverUri()}/filter/${shareId}`);
    return response.data;
  },

  getFilters: async (
    page: number,
    perPage: number,
    mySortBy?: string,
    mySort?: string,
    q?: string
  ): Promise<{ filters: FilterList[]; count: number }> => {
    const response: any = await axios.get(`${serverUri()}/filter`, {
      params: {
        page,
        perPage,
        q,
        sort: mySortBy
          ? {
              [mySortBy]: mySort,
            }
          : {
              name: "asc",
            },
      },
    });

    return response.data;
  },

  addFilter: async (filterList: FilterList): Promise<number> => {
    const response = await axios.post(`${serverUri()}/filter`, filterList);
    const filterId = response.data.id;

    const providerFilter: ProviderFilter = {
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

  updateFilter: async (
    filters: FilterList[],
    saveCids = true
  ): Promise<FilterList[]> => {
    const importedFilters: FilterList[] = [];
    const regularFilters: FilterList[] = [];

    filters.forEach((filter) => {
      // check for both undefined and null
      if (!isImported(filter)) {
        regularFilters.push(filter);
      } else {
        importedFilters.push(filter);
      }
    });

    await Promise.all(
      importedFilters.map((filter) => {
        const providerFilter: ProviderFilter = {
          notes: filter.notes,
          active: filter.enabled,
        };
        const response = axios.put(
          `${serverUri()}/provider-filter/${filter.id}`,
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
          `${serverUri()}/provider-filter/${filter.id}`,
          providerFilter
        );

        const response = axios.put<FilterList>(
          `${serverUri()}/filter/${filter.id}`,
          filter
        );

        return response;
      })
    );

    if (saveCids) {
      await Promise.all(regularFilters.flatMap((f) => cidsRequests(f)));
    }

    return responses.map(({ data }) => data);
  },

  updateEnabledForSharedFilters: async (
    filterIds: number[],
    enabled: boolean
  ): Promise<void> => {
    await Promise.all(
      filterIds.map((filterId) => {
        const response = axios.put(
          `${serverUri()}/provider-filter/${filterId}/shared/enabled`,
          {
            enabled,
          }
        );

        return response;
      })
    );
  },

  deleteFilter: (filter: FilterList): Promise<void> => {
    return axios.delete(`${serverUri()}/provider-filter/${filter.id}`);
  },

  getPublicFilterDetails: async (shareId: string): Promise<void> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filter/public/details/${shareId}`
    );

    return response.data;
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

  deleteCidById: async (id: number) => {
    return axios.delete(`${serverUri()}/cid/${id}`);
  },

  fetchRemoteFilter: async (filterUri: string): Promise<FilterList> => {
    const response = await axios.get(`${filterUri}`);
    return response.data as FilterList;
  },

  getCidConflict: async (
    cid: string,
    filterId: number
  ): Promise<Conflict[]> => {
    const response = await axios.get<Conflict[]>(
      `${serverUri()}/cid/conflict`,
      {
        params: { filterId, cid },
      }
    );
    return response.data;
  },

  getProvider: async (wallet: string): Promise<Account | null> => {
    const response = await axios.get<Account | null>(
      `${serverUri()}/provider/${wallet}`
    );

    if (!response.data) {
      return null;
    }
    return {
      ...response.data,
      walletAddress: wallet,
    };
  },

  authenticateProvider: async (walletAddress, signature): Promise<Account> => {
    const response = await axios.post<Account>(
      `${serverUri()}/provider/auth/${walletAddress}`,
      {
        signature,
      }
    );
    return response.data;
  },

  createProvider: async (wallet: string): Promise<Account> => {
    const response = await axios.post(
      `${serverUri()}/provider/${wallet.toLowerCase()}`
    );
    return response.data;
  },

  updateProvider: async (account: Account): Promise<Account> => {
    const response = await axios.put(`${serverUri()}/provider`, account);
    return {
      ...account,
      ...response.data,
    };
  },

  deleteProvider: async (account: Account): Promise<{ success: boolean }> => {
    const response = await axios.delete(
      `${serverUri()}/provider/${account.walletAddress}`
    );

    return response.data;
  },

  getOverrideCids: async (filterList: FilterList): Promise<string[]> => {
    const response = await axios.post(
      `${serverUri()}/cids/exception/${filterList.id}`,
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
    data: (FilterList & {
      isImported: boolean;
      providerId?: string;
      providerName?: string;
      providerCountry?: string;
      subs: number;
    })[];
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

  getAllFiltersCount: async (): Promise<number> => {
    const response = await axios.get(`${remoteMarketplaceUri()}/filter/count`);

    return response.data.count;
  },

  getDashboardData: async (): Promise<DashboardData> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filter/dashboard`
    );
    return response.data;
  },

  getChartData: async (periodType, periodInterval): Promise<any> => {
    const { startDate, endDate } = periodInterval;

    const response = await axios.get(
      `${serverUri()}/deals/stats/${periodType}?start=${startDate}&end=${endDate}`
    );

    const data: Array<DealFromApi> = response.data;
    console.log(data);
    const parsedData: ChartDataEntry[] = Object.values(data).map((e) => ({
      unique_count: e.unique_blocked ? parseInt(e.unique_blocked) : 0,
      total_count: e.total_blocked ? parseInt(e.total_blocked) : 0,
      key: e.key,
    }));
    return parsedData;
    // const mock = Object.values(data).map((element) => {
    //   const totalRequestsBlocked = Math.ceil(Math.random() * 500) + 100;
    //   const totalCidsFiltered =
    //     totalRequestsBlocked -
    //     Math.ceil(Math.random() * (totalRequestsBlocked - 50));
    //   return {
    //     key: element.key,
    //     total_count: totalRequestsBlocked,
    //     unique_count: totalCidsFiltered,
    //   };
    // });
    // return mock;
  },

  getProviderConfig: async (): Promise<Config> => {
    const response = await axios.get(`${serverUri()}/config`);

    return response.data;
  },

  setProviderConfig: async (config: Config): Promise<void> => {
    const response = await axios.put(`${serverUri()}/config`, {
      ...config,
    });
    return response.data;
  },

  downloadCidList: async (): Promise<any> => {
    axios.get(`${serverUri()}/cid/blocked?download=true`).then((response) => {
      fileDownload(JSON.stringify(response.data), "cid_file.json");
    });
  },

  exportAccount: async (): Promise<any> => {
    axios.get(`${serverUri()}/provider/export`).then((response) => {
      fileDownload(response.data, "bitscreen_export.tar");
    });
  },
};

export default ApiService;
