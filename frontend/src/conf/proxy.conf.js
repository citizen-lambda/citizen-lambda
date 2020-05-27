/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
const PROXY_CONFIG = {
  '/api': {
    target: 'http://localhost:5002',
    secure: false
  },
  '/api/programs/stream': {
    target: 'http://localhost:5002',
    secure: false,
    bypass: function (req, res, proxyOptions) {
      if (req.headers.accept.indexOf('text/event-stream') !== -1) {
        return 'http://localhost:5002/api/programs/stream';
      }
    }
  },
  logLevel: 'debug'
};

// eslint-disable-next-line no-undef
module.exports = PROXY_CONFIG;
