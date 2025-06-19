import mongoose from 'mongoose';

// Define the Action interface
export interface IAction extends mongoose.Document {
  insight: mongoose.Types.ObjectId; // Reference to parent Insight
  
  // RICE Scoring
  reach: number; // 0-100 scale of users potentially reached
  impact: 1 | 2 | 3; // 1-low, 2-medium, 3-high impact
  confidence: number; // 0-100% confidence score
  effort: 1 | 2 | 3; // 1-low, 2-medium, 3-high effort
  priorityScore?: number; // Calculated RICE score
  
  // Additional metadata
  description: string;
  status: 'proposed' | 'in_progress' | 'completed' | 'rejected';
  generatedBy: 'ai' | 'human';
  
  // Enhanced AI-generated context
  aiGeneratedActions?: {
    domain: string;
    description: string;
    rationale: string;
    priority: number;
  }[];
  
  aiAnalysis?: {
    fullReasoning?: string;
    keyInsights?: string[];
    potentialChallenges?: string[];
  };
  
  // New data points
  categoryArea?: string; // AI-generated category
  businessPriority?: string; // To be captured later
  
  // Tracking and context
  assignedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the Action schema
const ActionSchema = new mongoose.Schema<IAction>({
  insight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insight',
    required: [true, 'Action must be linked to an insight']
  },
  
  // RICE Scoring Fields
  reach: {
    type: Number,
    required: [true, 'Reach is required'],
    min: [0, 'Reach must be between 0-100'],
    max: [100, 'Reach must be between 0-100']
  },
  impact: {
    type: Number,
    required: [true, 'Impact is required'],
    enum: [1, 2, 3]
  },
  confidence: {
    type: Number,
    required: [true, 'Confidence is required'],
    min: [0, 'Confidence must be between 0-100'],
    max: [100, 'Confidence must be between 0-100']
  },
  effort: {
    type: Number,
    required: [true, 'Effort is required'],
    enum: [1, 2, 3]
  },
  priorityScore: {
    type: Number
  },
  
  // Additional metadata
  description: {
    type: String,
    required: [true, 'Action description is required'],
    trim: true,
    maxlength: [500, 'Action description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['proposed', 'in_progress', 'completed', 'rejected'],
    default: 'proposed'
  },
  generatedBy: {
    type: String,
    enum: ['ai', 'human'],
    default: 'ai'
  },
  
  // Enhanced AI-generated context
  aiGeneratedActions: [
    {
      domain: String,
      description: String,
      rationale: String,
      priority: Number
    }
  ],
  
  aiAnalysis: {
    fullReasoning: String,
    keyInsights: [String],
    potentialChallenges: [String]
  },
  
  // New data points
  categoryArea: {
    type: String,
    trim: true
  },
  businessPriority: {
    type: String,
    trim: true
  },
  
  // Tracking and context
  assignedTo: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate RICE priority score
ActionSchema.pre('save', function(next) {
  // Log the current state of the document before calculation
  console.log('🔍 Pre-save Document State:', {
    _id: this._id,
    originalReach: this.reach,
    originalImpact: this.impact,
    originalConfidence: this.confidence,
    originalEffort: this.effort,
    originalPriorityScore: this.priorityScore,
    isModified: {
      reach: this.isModified('reach'),
      impact: this.isModified('impact'),
      confidence: this.isModified('confidence'),
      effort: this.isModified('effort')
    }
  });

  // RICE Score Calculation: (Reach * Impact * Confidence) / Effort
  // Ensure all required fields are present and valid
  const reach = Math.max(0, Math.min(100, this.reach || 50));
  const impact = Math.max(1, Math.min(3, this.impact || 1));
  const confidence = Math.max(0, Math.min(100, this.confidence || 70));
  const effort = Math.max(1, Math.min(3, this.effort || 1));

  // Validate inputs
  if (reach >= 0 && impact > 0 && confidence >= 0 && effort > 0) {
    // Calculate priority score with more nuanced scaling
    const newPriorityScore = Math.round(
      (reach * 
       (impact * 30) * // Scale impact to 30-90 range
       (confidence / 100)) / 
      (effort * 30) // Scale effort to 30-90 range
    );

    // Normalize priority score to 0-100 range
    const normalizedPriorityScore = Math.max(0, Math.min(100, newPriorityScore));

    // Force update the priority score
    this.priorityScore = normalizedPriorityScore;

    // Optional: Add some logging for debugging
    console.log('🧮 Priority Score Calculation:', {
      reach,
      impact,
      scaledImpact: impact * 30,
      confidence,
      effort,
      scaledEffort: effort * 30,
      calculatedScore: newPriorityScore,
      normalizedScore: normalizedPriorityScore,
      previousScore: this.priorityScore
    });
  } else {
    // If invalid inputs, set priority score to 0
    this.priorityScore = 0;
    console.warn('⚠️ Invalid inputs for priority score calculation', {
      reach,
      impact,
      confidence,
      effort
    });
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Static method to generate AI-powered action with RICE scoring
ActionSchema.statics.generateAIAction = async function(
  insightId: mongoose.Types.ObjectId, 
  aiService: any
): Promise<IAction> {
  try {
    // Fetch the original insight
    const insight = await mongoose.model('Insight').findById(insightId);
    
    if (!insight) {
      throw new Error('Insight not found');
    }

    // Use AI service to generate action with RICE scoring
    const aiActionResult = await aiService.generateActionFromInsight(insight);

    // Create new action
    const newAction = new this({
      insight: insightId,
      description: aiActionResult.description,
      
      // RICE Scoring
      reach: aiActionResult.reach || 50, // Default to moderate reach
      impact: aiActionResult.impact || 2, // Default to medium impact
      confidence: aiActionResult.confidence || 70, // Default to high confidence
      effort: aiActionResult.effort || 2, // Default to medium effort
      
      // Additional metadata
      status: 'proposed',
      generatedBy: 'ai',
      
      // New data points
      categoryArea: aiActionResult.categoryArea,
      businessPriority: '' // To be filled later
    });

    // Save and return
    return await newAction.save();
  } catch (error) {
    console.error('Error generating AI action:', error);
    throw error;
  }
};

// Create and export the Action model
const Action = mongoose.model<IAction>('Action', ActionSchema);

export default Action; 