import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import Project from '../models/Project';
import Insight from '../models/Insight';
import Action from '../models/Action';

async function checkReferences() {
  try {
    // MongoDB connection string
    const mongoUri = 'mongodb+srv://joe:0mrJrSbRjvFjXO4o@cluster0.afhmmkk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

    // Connect to the database
    await mongoose.connect(mongoUri);

    // Project ID to check
    const projectId = '6853e52f317a6a8afafe360d';
    const insightId = '68543fb5a34feb21a9018754';

    // Check Project
    const project = await Project.findById(projectId);
    console.log('🏢 Project Details:', {
      exists: !!project,
      name: project ? project.name : null,
      id: project?._id
    });

    // Check Insight
    const insight = await Insight.findById(insightId).populate({
        path: "project",
        select: "_id name"
      })
      path: 'project',
      select: '_id name'
    });

    console.log('💡 Insight Details:', {
      exists: !!insight,
      text: insight?.text,
      projectRef: insight?.project ? {
        id: (insight.project as any)._id,
        name: (insight.project as any).name
      } : 'No Project Reference'
    });

    // Find Actions for this Insight
    const actions = await Action.find({ insight: insightId })
      .populate({
        path: "project",
        select: "_id name"
      })
        path: 'insight',
        select: '_id text'
      })
      .populate({
        path: "project",
        select: "_id name"
      })
        path: 'project',
        select: '_id name'
      });

    console.log('🚀 Actions for Insight:', {
      count: actions.length,
      actionDetails: actions.map(action => ({
        id: action._id,
        description: action.description,
        insightRef: action.insight ? (action.insight as any)._id : null,
        projectRef: action.project ? {
          id: (action.project as any)._id,
          name: (action.project as any).name
        } : 'No Project Reference'
      }))
    });

  } catch (error) {
    console.error('❌ Error in diagnostic check:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
  }
}

// Run the check
checkReferences(); 