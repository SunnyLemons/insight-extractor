import express from 'express';
import Project from '../models/Project';
import Insight from '../models/Insight';

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

    res.json({
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
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

    const project = await Project.findById(id)
      .populate({
        path: 'insights',
        match: { triageStatus: 'passed' } // Only show passed insights
      });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      error: 'Failed to fetch project', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router; 