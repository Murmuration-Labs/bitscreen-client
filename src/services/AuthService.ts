import _ from 'lodash';
import { Account, LoginType } from 'types/interfaces';
import LoggerService from './LoggerService';

const AUTH_KEY = 'BITSCREEN__IDENTITY__INFO';
const BITSCREEN_LOGIN_TYPE = 'BITSCREEN__LOGIN__TYPE';

export const createAccount = (account: Account, loginType?: LoginType) => {
  const updatedAccount = { ...account };
  LoggerService.info('Logging in.');
  localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAccount));
  if (loginType || loginType === 0) {
    localStorage.setItem(BITSCREEN_LOGIN_TYPE, JSON.stringify(loginType));
  }
};

export const getAccount = (): Account | null => {
  const accountStringified = localStorage.getItem(AUTH_KEY);
  if (!accountStringified) {
    return null;
  }

  const account: Account = JSON.parse(accountStringified);
  if (!account || Object.keys(account).length === 0) {
    return null;
  }

  return account;
};

export const updateAccount = (account: Account): void => {
  LoggerService.info('Changing account.');
  const updatedAccount = { ...account };
  account.walletAddress = updatedAccount.walletAddress
    ? updatedAccount.walletAddress.toLowerCase()
    : updatedAccount.walletAddress;

  if (_.isEqual(updatedAccount, getAccount())) {
    return;
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAccount));
};

export const removeAccount = (): void => {
  LoggerService.info('Logging out.');
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(BITSCREEN_LOGIN_TYPE);
};

export const getProviderId = (): number => {
  let providerId = 0;

  const provider = getAccount();
  if (provider?.id) {
    providerId = provider.id;
  }

  return providerId;
};

export const setLoginType = (loginType: LoginType) => {
  localStorage.setItem(BITSCREEN_LOGIN_TYPE, JSON.stringify(loginType));
};

export const removeLoginType = (): void => {
  localStorage.removeItem(BITSCREEN_LOGIN_TYPE);
};

export const getLoginType = (): LoginType | null => {
  const loginTypeStringified = localStorage.getItem(BITSCREEN_LOGIN_TYPE);

  if (!loginTypeStringified) {
    return null;
  }

  const loginType: LoginType = JSON.parse(loginTypeStringified);
  if (!loginType && loginType !== 0) {
    return null;
  }

  return loginType;
};
