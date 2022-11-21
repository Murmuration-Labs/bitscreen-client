import { shouldShowLoggerService } from '../config';

const LoggerService = {
  debug: (data) => {
    if (!shouldShowLoggerService) return;
    console.debug('[DEBUG]', data);
  },

  info: (data) => {
    if (!shouldShowLoggerService) return;
    console.info('[INFO]', data);
  },

  warning: (data) => {
    if (!shouldShowLoggerService) return;
    console.warn('[WARNING]', data);
  },

  error: (data) => {
    if (!shouldShowLoggerService) return;
    console.error('[ERROR]', data);
  },
};

export default LoggerService;
