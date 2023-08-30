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

  addFilter: async (filterList: FilterList) => {
    const response = await axios.post(`${serverUri()}/filter`, filterList);

    return response.data;
  },

  addProviderFilter: async (providerFilter: ProviderFilter): Promise<void> => {
    await axios.post(`${serverUri()}/provider-filter`, providerFilter);
  },

  updateFilter: async (filters: FilterList[]) => {
    for (let i = 0; i < filters.length; i++) {
      const currentFilter = filters[i];
      if (!isImported(currentFilter)) {
        const providerFilter: ProviderFilter = {
          notes: currentFilter.notes,
          active: currentFilter.enabled,
        };
        await axios.put(
          `${serverUri()}/provider-filter/${currentFilter.id}`,
          providerFilter
        );

        await axios.put<FilterList>(
          `${serverUri()}/filter/${currentFilter.id}`,
          currentFilter
        );
      } else {
        const providerFilter: ProviderFilter = {
          notes: currentFilter.notes,
          active: currentFilter.enabled,
        };
        await axios.put(
          `${serverUri()}/provider-filter/${currentFilter.id}`,
          providerFilter
        );
      }
    }
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

  removeCidsFromFilter: async (_cid: CidItem | CidItem[], filterId: number) => {
    const array = _cid as CidItem[];

    const response = await axios.post(
      `${serverUri()}/filter/remove-cids-from-filter`,
      {
        cids: array.map((e) => e.id),
        filterId,
      }
    );

    return response.data;
  },

  deleteCidById: async (id: number) => {
    return axios.delete(`${serverUri()}/cid/${id}`);
  },

  removeConflictedCids: async (cids: number[], filters: number[]) => {
    return axios.post(`${serverUri()}/filter/remove-conflicted-cids`, {
      cids,
      filters,
    });
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
    >(
      `${correspondingUri}/${
        loginType === LoginType.Wallet
          ? walletOrToken
          : walletOrToken.replace('/', '%2F').replace(',', '%2C')
      }`
    );

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
    const response = await axios.get(
      `${serverUri()}/cid/blocked?download=true`
    );
    fileDownload(JSON.stringify(response.data), 'cid_file.json');
  },

  exportAccount: async (): Promise<{
    accountData: { [key: string]: any };
    privateLists?: { [key: string]: any };
    sharedLists?: { [key: string]: any };
    publicLists?: { [key: string]: any };
    exceptionLists?: { [key: string]: any };
    importedLists?: { [key: string]: any };
  }> => {
    const response = await axios.get(`${serverUri()}/provider/export`);

    return response.data;
  },

  linkWalletToGoogleAccount: async (tokenId: string): Promise<Account> => {
    const response = await axios.post(
      `${serverUri()}/provider/link-google/${tokenId
        .replace('/', '%2F')
        .replace(',', '%2C')}`
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
