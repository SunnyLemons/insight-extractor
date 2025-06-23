import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env file with more robust path resolution
const envPath = path.resolve(process.cwd(), 'server/.env');
dotenv.config({ path: envPath });

console.log('🔍 ENV Path:', envPath);
console.log('🔍 Current Working Directory:', process.cwd());
console.log('🔍 Loaded Environment Variables:', {
  MONGODB_URI: process.env.MONGODB_URI ? 'LOADED' : 'NOT FOUND'
});

// Import model definitions
import Project from '../models/Project';
import Insight, { IInsight } from '../models/Insight';
import Action, { IAction } from '../models/Action';

// Type guard for error
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Type guard for Mongoose connection error
function isMongooseConnectionError(error: unknown): error is mongoose.MongooseError {
  return error instanceof mongoose.MongooseError;
}

async function diagnoseProjectReferences(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    console.log('🔌 Attempting to connect to MongoDB:', mongoUri.replace(/\/\/.*:.*@/, '//[REDACTED]:***@'));

    // Connect to the database with more detailed options
    const connectOptions: ConnectOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(mongoUri, connectOptions);

    // Register models explicitly
    mongoose.model('Project', Project.schema);
    mongoose.model('Insight', Insight.schema);
    mongoose.model('Action', Action.schema);

    console.log('✅ MongoDB Connection Established');
    console.log('🔍 Mongoose Connection State:', mongoose.connection.readyState);

    // Comprehensive Project Reference Diagnostic
    console.log('\n🔬 Comprehensive Project Reference Diagnostic');
    console.log('===========================================');

    // Fetch insights with detailed project reference information
    const insights = await Insight.find({ project: { $exists: true } })
      .populate('project')
      .limit(10);

    console.log(`\n📊 Insights with Project References (Sample of ${insights.length}):`);
    for (const insight of insights) {
      const insightId = insight._id instanceof mongoose.Types.ObjectId 
        ? insight._id.toString() 
        : String(insight._id);

      console.group(`🔍 Insight ${insightId}`);
      console.log('Insight Details:', {
        id: insightId,
        text: insight.text.substring(0, 100) + '...',
        projectRef: insight.project ? {
          id: (insight.project as any)._id.toString(),
          name: (insight.project as any).name,
          type: typeof (insight.project as any)._id,
          instanceOf: (insight.project as any)._id instanceof mongoose.Types.ObjectId
        } : 'No Project Reference'
      });

      // Find actions for this insight with detailed project reference investigation
      const actions = await Action.find({ insight: insight._id })
        .populate({
          path: 'project',
          select: '_id name'
        });

      console.log(`🚀 Actions for Insight (${actions.length}):`);
      for (const action of actions) {
        const actionId = action._id instanceof mongoose.Types.ObjectId 
          ? action._id.toString() 
          : String(action._id);

        console.group(`🔍 Action ${actionId}`);
        console.log('Action Details:', {
          id: actionId,
          description: action.description.substring(0, 100) + '...',
          projectRef: action.project ? {
            id: (action.project as any)._id.toString(),
            name: (action.project as any).name,
            type: typeof (action.project as any)._id,
            instanceOf: (action.project as any)._id instanceof mongoose.Types.ObjectId
          } : 'No Project Reference'
        });

        // Detailed project reference investigation
        console.log('Project Reference Investigation:', {
          actionProjectRef: action.project,
          actionProjectRefType: typeof action.project,
          actionProjectRefInstanceOf: action.project instanceof mongoose.Types.ObjectId,
          
          // Check if project can be extracted from insight
          extractedFromInsight: insight.project ? {
            id: (insight.project as any)._id.toString(),
            type: typeof (insight.project as any)._id,
            instanceOf: (insight.project as any)._id instanceof mongoose.Types.ObjectId
          } : 'No Insight Project Reference'
        });
        console.groupEnd();
      }
      console.groupEnd();
    }

    // Diagnostic Summary
    const insightStats = await Insight.aggregate([
      { 
        $group: {
          _id: '$project',
          count: { $sum: 1 },
          withProject: { $sum: { $cond: [{ $ifNull: ['$project', false] }, 1, 0] } }
        }
      }
    ]);

    const actionStats = await Action.aggregate([
      { 
        $group: {
          _id: '$project',
          count: { $sum: 1 },
          withProject: { $sum: { $cond: [{ $ifNull: ['$project', false] }, 1, 0] } }
        }
      }
    ]);

    console.log('\n📈 Diagnostic Summary:');
    console.log('-------------------');
    console.log('Insights Project Reference Stats:', JSON.stringify(insightStats, null, 2));
    console.log('Actions Project Reference Stats:', JSON.stringify(actionStats, null, 2));

  } catch (error: unknown) {
    console.error('❌ Diagnostic Error:', error);
    
    // Detailed error logging
    if (isError(error)) {
      console.error('🚨 Error Details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    // Additional connection state logging
    console.log('🔍 Mongoose Connection State:', mongoose.connection.readyState);
    
    // Attempt to provide more context about the connection failure
    if (process.env.MONGODB_URI) {
      console.log('🔍 Connection URI Provided: Yes');
      console.log('🔍 URI Length:', process.env.MONGODB_URI.length);
      console.log('🔍 URI Starts With:', process.env.MONGODB_URI.substring(0, 20) + '...');
    } else {
      console.log('🚨 No MongoDB URI found in environment variables');
    }
  } finally {
    // Ensure connection is closed even if an error occurs
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB Connection Closed');
    } catch (closeError: unknown) {
      if (isError(closeError)) {
        console.error('❌ Error closing MongoDB connection:', {
          name: closeError.name,
          message: closeError.message,
          stack: closeError.stack
        });
      } else {
        console.error('❌ Unknown error closing MongoDB connection:', closeError);
      }
    }
  }
}

// Immediately invoke the function
void diagnoseProjectReferences(); 