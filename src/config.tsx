// process.env.NODE_ENV is automatically set by react-scripts from package.json
// react-scripts start -> process.env.NODE_ENV = "development"
import HttpService from './services/HttpService';

HttpService.setupInterceptors();

const environment = process.env.NODE_ENV;

export const serverUri = (): string => {
  switch (environment) {
    case 'development':
      return process.env.REACT_APP_HOST || 'http://localhost:3030';
    case 'production':
      return 'https://bxn.mml.keyko.rocks';
    default:
      return 'https://bxn.mml.keyko.rocks';
  }
};

export const remoteMarketplaceUri = (): string => {
  switch (environment) {
    case 'development':
      return process.env.REACT_APP_HOST || 'http://localhost:3030';
    case 'production':
      // here you can set another server for prod
      return 'https://bxn.mml.keyko.rocks';
    default:
      return 'https://bxn.mml.keyko.rocks';
  }
};

export const rodeoUri = (): string => {
  const environment = process.env.NODE_ENV;
  switch (environment) {
    case 'development':
      return 'http://localhost:14000';
    case 'production':
      return 'https://black-darkness-2139.on.fleek.co/';
    default:
      return 'https://black-darkness-2139.on.fleek.co/';
  }
};

export const lookingGlassUri = (): string => {
  const environment = process.env.NODE_ENV;
  switch (environment) {
    case 'development':
      return 'http://localhost:15000';
    case 'production':
      return 'https://bxn.mml-client.keyko.rocks/';
    default:
      return 'https://bxn.mml-client.keyko.rocks/';
  }
};
