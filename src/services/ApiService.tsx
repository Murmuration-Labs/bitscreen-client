import detectEthereumProvider from "@metamask/detect-provider";
import axios from "axios";
import Web3 from "web3";
import { remoteMarketplaceUri, serverUri } from "../config";
import { Account } from "../pages/Contact/Interfaces";
import {
  CidItem,
  FilterList,
  ProviderFilter,
  DashboardData,
  Config,
  ChartDataEntry,
} from "../pages/Filters/Interfaces";
import { isImported } from "../pages/Filters/utils";
import * as AuthService from "./AuthService";

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
    const providerId = AuthService.getProviderId();
    const query = `providerId=${encodeURIComponent(providerId)}`;

    const response = await axios.get(
      `${serverUri()}/filter/${shareId}?${query}`
    );
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
        providerId: AuthService.getProviderId(),
      },
    });

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

    if (saveCids) {
      await Promise.all(regularFilters.flatMap((f) => cidsRequests(f)));
    }

    return responses.map(({ data }) => data);
  },

  updateEnabledForSharedFilters: async (
    filterIds: number[],
    enabled: boolean
  ): Promise<void> => {
    const providerId = AuthService.getProviderId();

    await Promise.all(
      filterIds.map((filterId) => {
        const response = axios.put(
          `${serverUri()}/provider-filter/${filterId}/shared/enabled`,
          {
            providerId,
            enabled,
          }
        );

        return response;
      })
    );
  },

  deleteFilter: (filter: FilterList): Promise<void> => {
    const currentProviderId = AuthService.getProviderId();
    return axios.delete(
      `${serverUri()}/provider-filter/${currentProviderId}/${filter.id}`
    );
  },

  getPublicFilterDetails: async (shareId: string): Promise<void> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filter/public/details/${shareId}`,
      {
        params: {
          providerId: AuthService.getProviderId(),
        },
      }
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

  fetchRemoteFilter: async (filterUri: string): Promise<FilterList> => {
    const response = await axios.get(
      `${filterUri}?providerId=${AuthService.getProviderId()}`
    );
    return response.data as FilterList;
  },

  getCidOverride: async (
    cid: string,
    filterId: number
  ): Promise<{ remote: boolean; local: boolean }> => {
    const query = `filterId=${encodeURIComponent(
      filterId
    )}&cid=${cid}&providerId=${AuthService.getProviderId()}`;
    const response = await axios.get<{ remote: boolean; local: boolean }>(
      `${serverUri()}/cid/override?${query}`
    );
    return response.data;
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

  authenticateProvider: async (account: Account): Promise<Account> => {
    const provider: any = await detectEthereumProvider({
      mustBeMetaMask: true,
    });

    if (!provider) {
      console.error();
      throw new Error("Please install metamask.");
    }

    if (!account || !account.walletAddress || !account.nonce) {
      throw new Error("Please login with metamask.");
    }

    const { walletAddress, nonce } = account;

    const web3 = new Web3(provider);
    const signature = await web3.eth.personal.sign(nonce, walletAddress, "");

    return (
      await axios.post<Account>(
        `${serverUri()}/provider/auth/${walletAddress}`,
        {
          signature,
        }
      )
    ).data;
  },

  createProvider: async (wallet: string): Promise<Account> => {
    return (await axios.post(`${serverUri()}/provider/${wallet.toLowerCase()}`))
      .data;
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
          providerId: AuthService.getProviderId(),
        },
      }
    );
    return response.data;
  },

  getAllFiltersCount: async (): Promise<number> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filter/count/${AuthService.getProviderId()}`
    );

    return response.data.count;
  },

  getDashboardData: async (): Promise<DashboardData> => {
    const response = await axios.get(
      `${remoteMarketplaceUri()}/filter/dashboard`,
      {
        params: {
          providerId: AuthService.getProviderId(),
        },
      }
    );
    return response.data;
  },

  getChartData: async (periodType, periodInterval): Promise<any> => {
    const { startDate, endDate } = periodInterval;
    const response = await axios.get(
      `${serverUri()}/deals/stats/${periodType}?start=${startDate}&end=${endDate}`
    );
    // return Object.values(response.data);
    const data: ChartDataEntry[] = Object.values(response.data);
    return data;
    // const mock = data.map((element) => {
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
    const providerId = AuthService.getProviderId();
    const response = await axios.get(`${serverUri()}/config/${providerId}`);

    return response.data;
  },
};

export default ApiService;
