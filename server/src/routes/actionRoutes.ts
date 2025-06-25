import express from 'express';
import mongoose from 'mongoose';
import Action from '../models/Action';
import Insight from '../models/Insight';
import Project from '../models/Project';
import { triageAIService } from '../services/TriageAIService';
import { anthropicActionService } from '../services/anthropicActionService';
import { IAction } from '../models/Action';
import { IProject } from '../models/Project';
import { TriageResult } from '../services/TriageAIService';

const router = express.Router();

// Generate AI action for a specific insight
router.post('/generate', async (req, res) => {
  // Increase default timeout
  req.setTimeout(120000); // 120 seconds (2 minutes)

  try {
    const { insightId } = req.body;
    console.log('🚀 Generating action for insight:', insightId);

    // Validate insight ID
    if (!insightId) {
      return res.status(400).json({ 
        error: 'Insight ID is required to generate an action',
        details: 'No insight ID was provided in the request body.'
      });
    }

    // Validate insight ID format
    if (!mongoose.Types.ObjectId.isValid(insightId)) {
      return res.status(400).json({ 
        error: 'Invalid insight ID format',
        details: `Received ID: ${insightId}`
      });
    }

    // Find the insight with its project
    const insight = await Insight.findById(insightId).populate('project');
    if (!insight) {
      return res.status(404).json({ 
        error: 'Insight not found',
        details: `No insight found with ID: ${insightId}`
      });
    }

    // Log start of AI processing
    console.time(`Action Generation for Insight ${insightId}`);

    // Perform AI Triage first
    let triageResult;
    try {
      triageResult = await triageAIService.performTriageScoring(
        insight.text, 
        insight.source
      );
    } catch (triageError) {
      console.error('Triage Scoring Failed:', triageError);
      return res.status(500).json({ 
        error: 'Triage scoring failed',
        details: triageError instanceof Error ? triageError.message : 'Unknown triage error'
      });
    }

    // Check if insight passes triage
    if (triageResult.triageStatus !== 'passed') {
      console.timeEnd(`Action Generation for Insight ${insightId}`);
      return res.status(400).json({ 
        error: 'Insight did not pass triage',
        triageResult,
        details: 'The insight was not considered suitable for action generation.'
      });
    }

    // Fetch project details if available
    const projectDoc = insight.project 
      ? await Project.findById(insight.project) 
      : undefined;

    // Generate AI actions using Anthropic
    let anthropicActionResult;
    try {
      anthropicActionResult = await anthropicActionService.generateActions(
        insight, 
        {
          clarity: triageResult.clarity,
          impact: triageResult.impact,
          score: triageResult.score,
          reasoning: triageResult.explanation
        },
        projectDoc || undefined
      );
    } catch (actionGenerationError) {
      console.error('Action Generation Failed:', actionGenerationError);
      return res.status(500).json({ 
        error: 'Action generation failed',
        details: actionGenerationError instanceof Error 
          ? actionGenerationError.message 
          : 'Unknown action generation error'
      });
    }

    // Create new action with multiple AI-generated actions
    const newAction = new Action({
      insight: insight._id,
      description: anthropicActionResult.actions[0]?.description || 'AI-generated action',
      status: 'proposed',
      generatedBy: 'ai',
      
      // Dynamic scoring based on AI-generated RICE scoring
      reach: anthropicActionResult.actions[0]?.riceScoring?.reach ?? 50,
      impact: mapImpactToNumeric(
        anthropicActionResult.actions[0]?.riceScoring?.impact ?? 5
      ),
      confidence: anthropicActionResult.actions[0]?.riceScoring?.confidence ?? 70,
      effort: mapEffortToNumeric(
        anthropicActionResult.actions[0]?.riceScoring?.effort ?? 3
      ),
      
      // Store full AI analysis
      aiGeneratedActions: anthropicActionResult.actions ?? [],
      aiAnalysis: {
        fullReasoning: anthropicActionResult.fullReasoning ?? 'No reasoning provided',
        keyInsights: anthropicActionResult.keyInsights ?? [],
        potentialChallenges: anthropicActionResult.potentialChallenges ?? []
      },
      
      // Additional metadata
      categoryArea: anthropicActionResult.actions[0]?.domain ?? 'Unspecified Domain'
    });

    // Save action
    const savedAction = await newAction.save();

    // Link action to insight
    await insight.addAction(savedAction._id as mongoose.Types.ObjectId);

    // Log end of processing
    console.timeEnd(`Action Generation for Insight ${insightId}`);

    res.status(201).json({
      message: 'Action generated successfully',
      action: savedAction,
      triageDetails: triageResult,
      aiAnalysis: anthropicActionResult,
      processingTime: `Action generation completed`
    });

  } catch (error) {
    console.error('❌ Unexpected error in action generation:', error);
    res.status(500).json({ 
      error: 'Unexpected error during action generation', 
      details: error instanceof Error ? error.message : 'Unknown error',
      fullError: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
  }
});

// Helper methods for mapping AI-generated scores to model's scoring
function mapImpactToNumeric(impact: number): 1 | 2 | 3 {
  if (impact > 7) return 3;
  if (impact > 3) return 2;
  return 1;
}

function mapEffortToNumeric(effort: number): 1 | 2 | 3 {
  if (effort > 7) return 3;
  if (effort > 3) return 2;
  return 1;
}

// Get actions for a specific insight
router.get('/insight/:insightId', async (req, res) => {
  try {
    const { insightId } = req.params;

    // Validate insight ID
    if (!mongoose.Types.ObjectId.isValid(insightId)) {
      return res.status(400).json({ 
        error: 'Invalid insight ID' 
      });
    }

    // Find actions for the insight
    const actions = await Action.find({ insight: insightId })
      .sort({ createdAt: -1 });

    res.json({
      count: actions.length,
      actions
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch actions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Update action status
router.patch('/:actionId/status', async (req, res) => {
  try {
    const { actionId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['proposed', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    // Find and update action
    const updatedAction = await Action.findByIdAndUpdate(
      actionId, 
      { 
        status, 
        updatedAt: new Date() 
      }, 
      { new: true }
    );

    if (!updatedAction) {
      return res.status(404).json({ 
        error: 'Action not found' 
      });
    }

    res.json({
      message: 'Action status updated successfully',
      action: updatedAction
    });
  } catch (error) {
    console.error('Error updating action status:', error);
    res.status(500).json({ 
      error: 'Failed to update action status', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Update an existing action
router.patch('/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const {
      description,
      status,
      reach,
      impact,
      confidence,
      effort,
      categoryArea
    } = req.body;

    // Validate action ID
    if (!mongoose.Types.ObjectId.isValid(actionId)) {
      return res.status(400).json({ 
        error: 'Invalid action ID' 
      });
    }

    // Validate status if provided
    const validStatuses = ['proposed', 'in_progress', 'completed', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    // Prepare update object with only provided fields
    const updateData: Partial<IAction> = {};
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (reach !== undefined) updateData.reach = reach;
    if (impact !== undefined) updateData.impact = impact;
    if (confidence !== undefined) updateData.confidence = confidence;
    if (effort !== undefined) updateData.effort = effort;
    if (categoryArea !== undefined) updateData.categoryArea = categoryArea;

    // Add timestamp for last update
    updateData.updatedAt = new Date();

    // Find and update the action
    const updatedAction = await Action.findByIdAndUpdate(
      actionId, 
      updateData, 
      { 
        new: true,  // Return the updated document
        runValidators: true,  // Run model validation on update
        setDefaultsOnInsert: true
      }
    );

    // If findByIdAndUpdate doesn't trigger save middleware, manually save
    if (updatedAction) {
      // Explicitly trigger save middleware to recalculate priority score
      await updatedAction.save();
    }

    // Check if action was found
    if (!updatedAction) {
      return res.status(404).json({ 
        error: 'Action not found' 
      });
    }

    // Log detailed information about the update
    console.log('🔄 Action Updated:', {
      actionId,
      originalData: updateData,
      newPriorityScore: updatedAction.priorityScore,
      reach: updatedAction.reach,
      impact: updatedAction.impact,
      confidence: updatedAction.confidence,
      effort: updatedAction.effort
    });

    res.json({
      message: 'Action updated successfully',
      action: updatedAction
    });
  } catch (error) {
    console.error('Error updating action:', error);
    res.status(500).json({ 
      error: 'Failed to update action', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete an action
router.delete('/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;

    // Validate action ID
    if (!mongoose.Types.ObjectId.isValid(actionId)) {
      return res.status(400).json({ 
        error: 'Invalid action ID' 
      });
    }

    // Find the action to get its associated insight
    const action = await Action.findById(actionId);
    if (!action) {
      return res.status(404).json({ 
        error: 'Action not found' 
      });
    }

    // Delete the action
    const deletedAction = await Action.findByIdAndDelete(actionId);

    // Remove the action reference from the associated insight
    if (action.insight) {
      await Insight.findByIdAndUpdate(
        action.insight, 
        { $pull: { actions: actionId } }
      );
    }

    res.json({
      message: 'Action deleted successfully',
      deletedAction
    });
  } catch (error) {
    console.error('Error deleting action:', error);
    res.status(500).json({ 
      error: 'Failed to delete action', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get a specific action by ID
router.get('/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;

    // Validate action ID
    if (!mongoose.Types.ObjectId.isValid(actionId)) {
      return res.status(400).json({ 
        error: 'Invalid action ID' 
      });
    }

    // Find the action and populate related data
    const action = await Action.findById(actionId)
      .populate({
        path: 'insight',
        populate: {
          path: 'project',
          select: 'name details' // Select only specific project fields
        }
      });

    // Check if action exists
    if (!action) {
      return res.status(404).json({ 
        error: 'Action not found' 
      });
    }

    res.json(action);
  } catch (error) {
    console.error('Error fetching action details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch action details', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router; 