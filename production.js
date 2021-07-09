import { join } from 'path';
import Application from 'thinkjs';

const instance = new Application({
  ROOT_PATH: __dirname,
  APP_PATH: join(__dirname, 'app'),
  proxy: true, // use proxy
  env: 'production'
});

instance.run();
