import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as AuthService from "./AuthService";
import LoggerService from "./LoggerService";
import history from "../history";

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
        LoggerService.error(error);

        if (error.response.status === 401) {
          history.push("/settings", {
            tokenExpired: true,
          });
        }
        return Promise.reject(error.response);
      }
    );
  },
  checkIfErrorIsValid: (e) => {
    if (e && e.tokenExpired) {
      return false;
    }
    return true;
  },
};
