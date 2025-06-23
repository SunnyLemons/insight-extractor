import { connectToDatabase, disconnectFromDatabase } from './dbConnect';

// Define a generic handler type
type ServerlessHandler = (event: any, context: any) => Promise<any>;

// Generic error response
const createErrorResponse = (statusCode: number, message: string) => ({
  statusCode,
  body: JSON.stringify({ error: message }),
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }
});

// Generic success response
const createSuccessResponse = (data: any, statusCode = 200) => ({
  statusCode,
  body: JSON.stringify(data),
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }
});

// Base serverless function handler
export const createHandler = (
  handler: ServerlessHandler
) => {
  return async (event: any, context: any) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return createSuccessResponse(null);
    }

    try {
      // Connect to database
      await connectToDatabase();

      // Execute the specific handler
      const result = await handler(event, context);

      // Disconnect from database
      await disconnectFromDatabase();

      // Return successful response
      return createSuccessResponse(result);
    } catch (error) {
      console.error('Serverless Function Error:', error);

      // Attempt to disconnect from database in case of error
      try {
        await disconnectFromDatabase();
      } catch (disconnectError) {
        console.error('Error disconnecting from database:', disconnectError);
      }

      // Return error response
      return createErrorResponse(
        500, 
        error instanceof Error ? error.message : 'Internal Server Error'
      );
    }
  };
}; 