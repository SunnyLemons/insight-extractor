import express from 'express';
import Project from '../models/Project';
import Insight from '../models/Insight';
import mongoose from 'mongoose';

const router = express.Router();

// Create a new project
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      details, 
      valueProposition,
      coreFeatures,
      idealCustomerProfile,
      northStarObjective,
      currentBusinessObjectives
    } = req.body;

    // Validate required fields
    if (!name || !details) {
      return res.status(400).json({ 
        error: 'Project name and details are required' 
      });
    }

    // Create new project
    const newProject = new Project({
      name,
      details,
      valueProposition,
      coreFeatures,
      idealCustomerProfile,
      northStarObjective,
      currentBusinessObjectives
    });

    // Save project
    await newProject.save();

    res.status(201).json({
      message: 'Project created successfully',
      project: newProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      error: 'Failed to create project', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all projects with insights count
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Incoming GET /projects request');
    console.log('📋 Request Headers:', req.headers);
    console.log('🌐 Origin:', req.get('origin'));
    console.log('🔗 Referrer:', req.get('referrer'));

    // Fetch projects with insights count
    const projects = await Project.aggregate([
      {
        $lookup: {
          from: 'insights', // Assuming the collection name is 'insights'
          localField: '_id',
          foreignField: 'project',
          as: 'insights'
        }
      },
      {
        $addFields: {
          insightsCount: { $size: '$insights' }
        }
      },
      {
        $project: {
          name: 1,
          details: 1,
          createdAt: 1,
          valueProposition: 1,
          coreFeatures: 1,
          idealCustomerProfile: 1,
          northStarObjective: 1,
          currentBusinessObjectives: 1,
          insights: '$insights',
          insightsCount: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    console.log('📊 Projects Found:', projects.length);

    res.json({
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ 
      error: 'Failed to fetch projects', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Aggregate pipeline to fetch project with insights and actions
    const projectDetails = await Project.aggregate([
      // Match the specific project
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      
      // Lookup insights
      {
        $lookup: {
          from: 'insights', // Assuming the collection name is 'insights'
          localField: '_id',
          foreignField: 'project',
          as: 'insights'
        }
      },
      
      // Lookup actions for insights
      {
        $lookup: {
          from: 'actions', // Assuming the collection name is 'actions'
          let: { projectInsights: '$insights' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$insight', '$$projectInsights._id']
                }
              }
            }
          ],
          as: 'allActions'
        }
      },
      
      // Add actions to insights
      {
        $addFields: {
          insights: {
            $map: {
              input: '$insights',
              as: 'insight',
              in: {
                $mergeObjects: [
                  '$$insight',
                  {
                    actions: {
                      $filter: {
                        input: '$allActions',
                        as: 'action',
                        cond: { $eq: ['$$action.insight', '$$insight._id'] }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      
      // Project only the fields we need
      {
        $project: {
          name: 1,
          details: 1,
          createdAt: 1,
          valueProposition: 1,
          coreFeatures: 1,
          idealCustomerProfile: 1,
          northStarObjective: 1,
          currentBusinessObjectives: 1,
          insights: 1
        }
      }
    ]);

    // Check if project exists
    if (!projectDetails || projectDetails.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Return the first (and only) project
    res.json(projectDetails[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      error: 'Failed to fetch project', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router; 