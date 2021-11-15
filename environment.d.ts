declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_PORT?: string;
      DATABASE_HOST?: string;
      DATABASE_NAME?: string;
      DATABASE_URI?: string
      NODE_ENV: 'development' | 'production';
      SERVER_PORT?: string;
      SERVER_AUTH_SECRET?: string;
    }
  }
}

export {};
