const LoggerService = {
  debug: (data) => {
    console.debug('[DEBUG]', data);
  },

  info: (data) => {
    console.info('[INFO]', data);
  },

  warning: (data) => {
    console.warn('[WARNING]', data);
  },

  error: (data) => {
    console.error('[ERROR]', data);
  },
};

export default LoggerService;
