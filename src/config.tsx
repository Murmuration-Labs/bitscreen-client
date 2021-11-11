// process.env.NODE_ENV is automatically set by react-scripts from package.json
// react-scripts start -> process.env.NODE_ENV = "development"
import HttpService from "./services/HttpService";

HttpService.setupInterceptors();

const environment = process.env.NODE_ENV;

export const serverUri = (): string => {
  switch (environment) {
    case "development":
      return process.env.REACT_APP_HOST || "http://localhost:3030";
    case "production":
      return "https://bxn.keyko.rocks";
    default:
      return "https://bxn.keyko.rocks";
  }
};

export const remoteMarketplaceUri = (): string => {
  switch (environment) {
    case "development":
      return process.env.REACT_APP_HOST || "http://localhost:3030";
    case "production":
      // here you can set another server for prod
      return "https://bxn.keyko.rocks";
    default:
      return "https://bxn.keyko.rocks";
  }
};
