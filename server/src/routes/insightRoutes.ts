import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Insight from '../models/Insight';
import Project from '../models/Project';
import express from 'express';
import { AITriageService } from '../services/aiTriageService';
import Action from '../models/Action';

const router = express.Router();

// Create insight route
export const createInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, source, projectId } = req.body;

    // Validate input
    if (!text || !source) {
      res.status(400).json({ error: 'Text and source are required' });
      return;
    }

    // Create new insight
    const newInsight = new Insight({
      text,
      source,
      project: projectId ? mongoose.Types.ObjectId.createFromHexString(projectId) : undefined
    });

    await newInsight.save();

    // If project is specified, add insight to project
    if (projectId) {
      await Project.findByIdAndUpdate(
        projectId, 
        { $push: { insights: newInsight._id } },
        { new: true }
      );
    }

    res.status(201).json(newInsight);
  } catch (error) {
    console.error('Error creating insight:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : error 
    });
  }
};

// Get insights route
export const getInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const insights = await Insight.find().populate('project');
    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Type guard for triage status
function isValidTriageStatus(status: unknown): status is 'pending' | 'passed' | 'rejected' | 'research_needed' {
  const validStatuses = ['pending', 'passed', 'rejected', 'research_needed'];
  return typeof status === 'string' && validStatuses.includes(status);
}

// Create a new insight with AI triage
router.post('/', async (req, res) => {
  try {
    const { 
      text, 
      source,
      project: projectId
    } = req.body;

    // Validate required fields
    if (!text || !source) {
      return res.status(400).json({ 
        error: 'Text and source are required for insight creation' 
      });
    }

    // Perform AI triage
    const triageResult = await AITriageService.triageInsight(text, source);

    // Create new insight with AI triage results
    const newInsight = new Insight({
      text,
      source,
      clarity: triageResult.clarity,
      impact: triageResult.impact,
      triageScore: triageResult.score,
      triageStatus: 
        triageResult.clarity === 'clear' && triageResult.score >= 4 
          ? 'passed' 
          : triageResult.clarity === 'vague' && triageResult.score >= 4 
            ? 'research_needed' 
            : 'rejected',
      project: projectId ? new mongoose.Types.ObjectId(projectId) : undefined
    });

    // Save insight
    await newInsight.save();

    // If project is specified, link insight to project
    if (projectId) {
      try {
        const project = await Project.findById(projectId);
        if (project) {
          project.insights = project.insights || [];
          const insightId = newInsight._id as mongoose.Types.ObjectId;
          
          // Explicitly type the comparison
          if (!project.insights.some((id: mongoose.Types.ObjectId) => id.equals(insightId))) {
            project.insights.push(insightId);
            await project.save();
          }
        }
      } catch (projectLinkError) {
        console.warn('Could not link insight to project:', projectLinkError);
      }
    }

    res.status(201).json({
      message: 'Insight created successfully',
      insight: newInsight,
      aiTriageReasoning: triageResult.reasoning
    });
  } catch (error) {
    console.error('Error creating insight:', error);
    res.status(500).json({ 
      error: 'Failed to create insight', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get insights by triage status
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    // Construct filter with validated status
    const filter = isValidTriageStatus(status) 
      ? { triageStatus: status } 
      : {};

    const insights = await Insight.find(filter)
      .populate('project', 'name') // Populate project name
      .sort({ createdAt: -1 });

    res.json({
      count: insights.length,
      insights
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ 
      error: 'Failed to fetch insights', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Manually update triage status (optional, for admin/manual review)
router.patch('/:id/triage', async (req, res) => {
  try {
    const { id } = req.params;
    const { triageStatus } = req.body;

    // Validate input
    const validStatuses = ['pending', 'passed', 'rejected', 'research_needed'];
    if (!validStatuses.includes(triageStatus)) {
      return res.status(400).json({ 
        error: 'Invalid triage status' 
      });
    }

    const insight = await Insight.findByIdAndUpdate(
      id, 
      { triageStatus }, 
      { new: true }
    );

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json({
      message: 'Triage status updated successfully',
      insight
    });
  } catch (error) {
    console.error('Error updating triage status:', error);
    res.status(500).json({ 
      error: 'Failed to update triage status', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get single insight by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid insight ID' });
    }

    // Find insight by ID and populate actions if they exist
    const insight = await Insight.findById(id)
      .populate({
        path: 'actions',
        model: 'Action',
        options: { sort: { createdAt: -1 } }
      });

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json(insight);
  } catch (error) {
    console.error('Error fetching single insight:', error);
    res.status(500).json({ 
      error: 'Failed to fetch insight', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete an insight and its associated actions
router.delete('/:insightId', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { insightId } = req.params;

    // Validate insight ID
    if (!mongoose.Types.ObjectId.isValid(insightId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        error: 'Invalid insight ID' 
      });
    }

    // Find the insight to get its associated project and actions
    const insight = await Insight.findById(insightId);
    if (!insight) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        error: 'Insight not found' 
      });
    }

    // Delete all actions associated with this insight
    await Action.deleteMany({ insight: insightId }, { session });

    // Remove the insight from the project
    if (insight.project) {
      await Project.findByIdAndUpdate(
        insight.project, 
        { $pull: { insights: insightId } },
        { session }
      );
    }

    // Delete the insight
    const deletedInsight = await Insight.findByIdAndDelete(insightId, { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json({
      message: 'Insight and associated actions deleted successfully',
      deletedInsight,
      deletedActionsCount: await Action.countDocuments({ insight: insightId })
    });
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();

    console.error('Error deleting insight:', error);
    res.status(500).json({ 
      error: 'Failed to delete insight', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router; 