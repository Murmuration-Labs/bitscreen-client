export const serverUri = (): string => {
  const environment = process.env.REACT_APP_ENV || process.env.NODE_ENV;

  switch (environment) {
    case "development":
      return "http://localhost:3030";
    case "production":
      return "https://bxn.keyko.rocks";
    default:
      return "https://bxn.keyko.rocks";
  }
};
