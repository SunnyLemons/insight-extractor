import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project';
import Insight from '../models/Insight';

// Load environment variables
dotenv.config();

async function checkDatabaseContents() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not defined in .env file');
      process.exit(1);
    }

    // Detailed logging with masked password
    console.log('🔍 Attempting to connect with URI:', 
      mongoUri.replace(/:(.*?)@/, ':****@') // Mask password
    );

    // Comprehensive connection options
    const connectionOptions: ConnectOptions = {
      serverSelectionTimeoutMS: 10000,  // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    // Validate connection string components
    const uriParts = mongoUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)\?/);
    if (!uriParts) {
      console.error('❌ Invalid MongoDB URI format');
      process.exit(1);
    }

    const [, username, password, host, database] = uriParts;
    console.log('🔑 Connection Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Host: ${host}`);
    console.log(`   Database: ${database}`);

    // Connect to MongoDB with detailed logging
    await mongoose.connect(mongoUri, connectionOptions);
    console.log('✅ Successfully connected to MongoDB');

    // Verify database connection
    const connection = mongoose.connection;
    console.log('🌐 Connection Host:', connection.host);
    console.log('🔢 Connection Port:', connection.port);

    // Safely get database name
    const dbName = mongoUri.split('/').pop()?.split('?')[0] || 'Unknown';
    console.log('📦 Database Name:', dbName);

    // Check Projects
    const projects = await Project.find();
    console.log('Projects in database:');
    projects.forEach(project => {
      console.log(`- ID: ${project._id}`);
      console.log(`  Name: ${project.name}`);
      console.log(`  Details: ${project.details}`);
      console.log(`  Created At: ${project.createdAt}`);
      console.log(`  Insights: ${project.insights?.length || 0}`);
      console.log('---');
    });

    // Check Insights
    const insights = await Insight.find();
    console.log('\nInsights in database:');
    insights.forEach(insight => {
      console.log(`- ID: ${insight._id}`);
      console.log(`  Text: ${insight.text}`);
      console.log(`  Source: ${insight.source}`);
      console.log(`  Created At: ${insight.createdAt}`);
      console.log(`  Project: ${insight.project}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Database Connection Error:', error);
    
    // Comprehensive error logging
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      console.error('🚨 Server Selection Error. Possible causes:');
      console.error('   - Incorrect connection string');
      console.error('   - Network issues');
      console.error('   - IP not whitelisted');
    }

    if (error instanceof Error) {
      console.error('🔒 Authentication/Authorization Error. Specific details:');
      console.error('   - Error Name:', error.name);
      console.error('   - Error Message:', error.message);
      console.error('   - Stack Trace:', error.stack);
    }

    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
}

checkDatabaseContents(); 