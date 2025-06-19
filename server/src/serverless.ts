import serverless from 'serverless-http';
import app from './index';

// Wrap the Express app with serverless-http
export const handler = serverless(app, {
  binary: ['*/*'] // Handle all content types
}); 