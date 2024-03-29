// process.env.NODE_ENV is automatically set by react-scripts from package.json
// react-scripts start -> process.env.NODE_ENV = "development"
import HttpService from './services/HttpService';

HttpService.setupInterceptors();

export const debounceTime = 600;

export const serverUri = (): string => {
  const environment = process.env.NODE_ENV;
  switch (environment) {
    case 'development':
      return process.env.REACT_APP_HOST || 'http://localhost:3030';
    case 'production':
      return 'https://backend.bitscreen.co';
    default:
      return 'https://backend.bitscreen.co';
  }
};

export const remoteMarketplaceUri = (): string => {
  const environment = process.env.NODE_ENV;

  switch (environment) {
    case 'development':
      return process.env.REACT_APP_HOST || 'http://localhost:3030';
    case 'production':
      // here you can set another server for prod
      return 'https://backend.bitscreen.co';
    default:
      return 'https://backend.bitscreen.co';
  }
};

export const rodeoUri = (): string => {
  const environment = process.env.NODE_ENV;
  switch (environment) {
    case 'development':
      return 'http://localhost:14000';
    case 'production':
      return 'https://rodeo.bitscreen.co/';
    default:
      return 'https://rodeo.bitscreen.co/';
  }
};

export const lookingGlassUri = (): string => {
  const environment = process.env.NODE_ENV;
  switch (environment) {
    case 'development':
      return 'http://localhost:15000';
    case 'production':
      return 'https://glass.bitscreen.co/';
    default:
      return 'https://glass.bitscreen.co/';
  }
};
export const bitscreenGoogleClientId =
  '553067164447-7j2nls5qnt7pc1d2cti1vbfd33gjengl.apps.googleusercontent.com';

// change this to use the logger service tsx
export const shouldShowLoggerService = true;
