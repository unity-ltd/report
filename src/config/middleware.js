const path = require('path');
const isDev = think.env === 'development';
const cors = require('koa2-cors')
module.exports = [
  {
    handle: 'meta',
    options: {
      logRequest: isDev,
      sendResponseTime: isDev
    }
  },
    {
        handle:cors,
        options: {
            exposeHeaders: ["token", "account_id"]
        }
    },
  {
    handle: 'resource',
    enable: true,
    options: {
      root: path.join(think.ROOT_PATH, 'www'),
      publicPath: /^\/(static|favicon\.ico)/
    }
  },
  {
    handle: 'trace',
    enable: !think.isCli,
    options: {
      debug: isDev
    }
  },
  {
    handle: 'payload',
    options: {
      keepExtensions: true,
      limit: '20mb'
    }
  },
  {
    handle: 'router',
    options: {}
  },
  'controller'
];
