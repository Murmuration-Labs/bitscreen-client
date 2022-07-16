import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as AuthService from "./AuthService";
import LoggerService from "./LoggerService";
import history from "../appHistory";

export default {
  setupInterceptors: () => {
    axios.interceptors.request.use((config: AxiosRequestConfig) => {
      const account = AuthService.getAccount();

      if (!account) {
        return config;
      }

      config.headers.Authorization = `Bearer ${account.accessToken}`;

      return config;
    });

    axios.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        LoggerService.debug(config);
        return config;
      },
      (error) => {
        LoggerService.error(error);
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        LoggerService.debug(response);
        return response;
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          AuthService.removeAccount();
          history.push("/login", {
            tokenExpired: true,
            currentPath: history.location.pathname,
          });
        }
        return Promise.reject(error.response);
      }
    );
  },
};
