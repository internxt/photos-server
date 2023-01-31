import { StringFormatOption } from "@sinclair/typebox";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_NAME?: string;
      DATABASE_URI?: StringFormatOption;
      NETWORK_URL?:string;
      NODE_ENV: 'development' | 'production';
      SERVER_PORT?: string;
      SERVER_AUTH_SECRET?: string;
    }
  }
}

export {};
