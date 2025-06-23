import { Application } from 'express';

declare module 'serverless-http' {
  function serverless(
    app: Application, 
    options?: {
      binary?: string[];
    }
  ): (event: any, context: any) => Promise<any>;
  
  export = serverless;
} 