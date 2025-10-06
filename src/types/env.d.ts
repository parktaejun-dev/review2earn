declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_CAFE24_CLIENT_ID: string;
      CAFE24_CLIENT_SECRET: string;
      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
    }
  }
}

export {};
