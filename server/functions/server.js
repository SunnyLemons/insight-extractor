const app = require('../dist/index').default;

exports.handler = (event, context) => {
  console.log('Serverless function invoked:', event);
  
  // Basic error handling
  if (!app) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server not initialized' })
    };
  }

  // Return a simple response
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Serverless function is working', 
      path: event.path 
    })
  };
}; 