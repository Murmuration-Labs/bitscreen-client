export const serverUri = (): string => {
  switch (process.env.NODE_ENV) {
    case "development":
      return "http://localhost:3030";
    case "production":
      return "https://bxn.keyko.rocks";
    default:
      return "https://bxn.keyko.rocks";
  }
};
