import startServer from './src';

startServer({ 
  port: process.env.SERVER_PORT && parseInt(process.env.SERVER_PORT) || 8000, 
  logger: { enabled: true }
});
