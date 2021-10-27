import _ from "lodash";
import { Account } from "../types/interfaces";
import LoggerService from "./LoggerService";

const AUTH_KEY = "BITSCREEN__IDENTITY__INFO";

export const createAccount = (account: Account) => {
  const updatedAccount = { ...account };
  LoggerService.info("Logging in.");
  localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAccount));
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
  LoggerService.info("Changing account.");
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
  LoggerService.info("Logging out.");
  localStorage.removeItem(AUTH_KEY);
};

export const getProviderId = (): number => {
  let providerId = 0;

  const provider = getAccount();
  if (provider?.id) {
    providerId = provider.id;
  }

  return providerId;
};
