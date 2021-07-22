import { Account } from "../pages/Contact/Interfaces";

const AUTH_KEY = "BITSCREEN__IDENTITY__INFO";
let subscribers: any[] = [];

const update = (account: Account | null) => {
  subscribers.forEach((s) => s(account));
};

export const updateAccount = (account: Account): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(account));
  update(account);
};

export const removeAccount = (): void => {
  localStorage.removeItem(AUTH_KEY);
  update(null);
};

export const getAccount = (): Account | null => {
  const accountStringified = localStorage.getItem(AUTH_KEY);
  if (!accountStringified) {
    return null;
  }

  const account: Account = JSON.parse(accountStringified);
  if (!account || !Object.keys(account).length) {
    return null;
  }

  return account;
};

export const subscribe = (
  handler: (account: Account) => void
): (() => void) => {
  subscribers = [...subscribers, handler];
  return () => {
    const idx = subscribers.indexOf(handler);
    if (idx < 0) {
      return;
    }

    subscribers.splice(subscribers.indexOf(handler), 1);
  };
};
