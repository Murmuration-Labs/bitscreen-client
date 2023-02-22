import axios from 'axios';
import fileDownload from 'js-file-download';
import {
  ChartDataEntry,
  CidItem,
  Config,
  Conflict,
  DashboardData,
  FilterList,
  ProviderFilter,
} from 'pages/Filters/Interfaces';
import { isImported } from 'pages/Filters/utils';
import {
  Account,
  AccountType,
  BasicAuthInfoEmail,
  BasicAuthInfoWallet,
  DealFromApi,
  LoginType,
} from 'types/interfaces';
import { remoteMarketplaceUri, serverUri } from '../config';

// For authentication purposes we will use axios.createInstance
// Right now we use straight-forward axios

const cidsRequests = ({ id, cids }: FilterList) => {
  return cids.map((cid) =>
    typeof cid.id === 'number'
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

  getSharedFilter: async (shareId: string): Promise<FilterList> => {
    const response = await axios.get(`${serverUri()}/filter/share/${shareId}`);
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
              name: 'asc',
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
    filterId: number,
    isException: boolean
  ): Promise<Conflict[]> => {
    const response = await axios.get<Conflict[]>(
      `${serverUri()}/cid/conflict`,
      {
        params: { filterId, cid, isException: isException ? 1 : 0 },
      }
    );
    return response.data;
  },

  getAuthInfo: async (
    loginType: LoginType,
    walletOrToken: string
  ): Promise<BasicAuthInfoEmail | BasicAuthInfoWallet | null> => {
    const correspondingUri =
      loginType === LoginType.Wallet
        ? `${serverUri()}/provider/auth_info`
        : `${serverUri()}/provider/auth_info/email`;

    const response = await axios.get<
      BasicAuthInfoEmail | BasicAuthInfoWallet | null
    >(`${correspondingUri}/${walletOrToken}`);

    if (!response.data) {
      return null;
    }

    const authInfo =
      loginType === LoginType.Wallet
        ? {
            ...response.data,
            walletAddress: walletOrToken,
          }
        : {
            ...response.data,
          };
    return authInfo;
  },

  authenticateProvider: async (
    walletAddress: string,
    signature: string
  ): Promise<Account> => {
    const response = await axios.post<Account>(
      `${serverUri()}/provider/auth/wallet/${walletAddress}`,
      {
        signature,
      }
    );
    return response.data;
  },

  authenticateProviderByEmail: async (tokenId: string): Promise<Account> => {
    const response = await axios.post<Account>(
      `${serverUri()}/provider/auth/email`,
      {
        tokenId,
      }
    );
    return response.data;
  },

  createProvider: async (wallet: string): Promise<Account> => {
    const response = await axios.post(
      `${serverUri()}/provider/wallet/${wallet.toLowerCase()}`
    );
    return response.data;
  },

  createProviderByEmail: async (tokenId: string): Promise<Account> => {
    const response = await axios.post(`${serverUri()}/provider/email`, {
      tokenId,
    });
    return response.data;
  },

  updateProvider: async (data: {
    provider: Partial<Account>;
    config: Config;
  }): Promise<Account> => {
    const response = await axios.patch(`${serverUri()}/provider`, data);
    return response.data;
  },

  markQuickstartShown: async (): Promise<void> => {
    const response = await axios.post(`${serverUri()}/provider/quickstart`);
    return response.data;
  },

  markConsentDate: async (): Promise<string> => {
    const response = await axios.post(`${serverUri()}/provider/consent`);
    return response.data;
  },

  selectAccountType: async (accountType: AccountType): Promise<string> => {
    const response = await axios.post(`${serverUri()}/provider/account-type`, {
      accountType,
    });
    return response.data;
  },

  deleteProvider: async (account: Account): Promise<{ success: boolean }> => {
    const response = await axios.delete(`${serverUri()}/provider`);

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
      fileDownload(JSON.stringify(response.data), 'cid_file.json');
    });
  },

  exportAccount: async (): Promise<any> => {
    axios.get(`${serverUri()}/provider/export`).then((response) => {
      fileDownload(response.data, 'bitscreen_export.tar');
    });
  },

  linkWalletToGoogleAccount: async (tokenId: string): Promise<any> => {
    const response = await axios.post(
      `${serverUri()}/provider/link-google/${tokenId}`
    );

    return response.data;
  },

  generateNonceForSignature: async (
    wallet: string
  ): Promise<{
    nonceMessage: string;
    walletAddress: string;
  }> => {
    const response = await axios.post(
      `${serverUri()}/provider/generate-nonce/${wallet}`
    );

    return response.data;
  },

  linkProviderToWallet: async (
    wallet: string,
    signature: string
  ): Promise<Account> => {
    const response = await axios.post<Account>(
      `${serverUri()}/provider/link-wallet/${wallet}`,
      {
        signature,
      }
    );

    return response.data;
  },

  unlinkFromSecondLoginType: async (): Promise<Account> => {
    const response = await axios.post<Account>(
      `${serverUri()}/provider/unlink-second-login-type/`
    );

    return response.data;
  },
};

export default ApiService;
