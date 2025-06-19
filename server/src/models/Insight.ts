import mongoose from 'mongoose';

// Define the Insight interface with triage scoring fields
export interface IInsight extends mongoose.Document {
  text: string;
  source: 'user_feedback' | 'team_observation' | 'assumption_idea';
  clarity: 'clear' | 'vague';
  impact: 'core_experience' | 'improve_experience' | 'nice_to_have';
  createdAt?: Date;
  project?: mongoose.Types.ObjectId; // Reference to Project
  
  // Triage-related fields
  triageScore?: number;
  triageStatus?: 'pending' | 'passed' | 'rejected' | 'research_needed';
  
  // Actions reference
  actions?: mongoose.Types.ObjectId[]; // Reference to Actions

  // Method to add an action
  addAction(actionId: mongoose.Types.ObjectId | string): Promise<IInsight>;
}

// Create the Insight schema
const InsightSchema = new mongoose.Schema<IInsight>({
  text: {
    type: String,
    required: [true, 'Insight text is required'],
    trim: true
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    enum: ['user_feedback', 'team_observation', 'assumption_idea']
  },
  clarity: {
    type: String,
    required: [true, 'Clarity is required'],
    enum: ['clear', 'vague']
  },
  impact: {
    type: String,
    required: [true, 'Impact level is required'],
    enum: ['core_experience', 'improve_experience', 'nice_to_have']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  triageScore: {
    type: Number,
    default: 0
  },
  triageStatus: {
    type: String,
    enum: ['pending', 'passed', 'rejected', 'research_needed'],
    default: 'pending'
  },
  actions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Action'
  }]
});

// Method to add an action to the insight
InsightSchema.methods.addAction = async function(this: IInsight, actionId: mongoose.Types.ObjectId | string): Promise<IInsight> {
  console.log('addAction method called with actionId:', actionId);
  console.log('Current actions before adding:', this.actions);
  
  // Ensure actions array exists
  this.actions = this.actions || [];
  
  // Convert string to ObjectId if needed
  const objectId = typeof actionId === 'string' 
    ? new mongoose.Types.ObjectId(actionId) 
    : actionId;
  
  // Prevent duplicate actions
  const isDuplicate = this.actions.some((id: mongoose.Types.ObjectId) => id.equals(objectId));
  
  console.log('Is duplicate:', isDuplicate);
  
  if (!isDuplicate) {
    this.actions.push(objectId);
    console.log('Actions after push:', this.actions);
    
    try {
      const savedInsight = await this.save();
      console.log('Insight saved successfully:', savedInsight._id);
      console.log('Saved insight actions:', savedInsight.actions);
      return savedInsight;
    } catch (error) {
      console.error('Error saving insight:', error);
      throw error;
    }
  }
  
  console.log('Returning existing insight without changes');
  return this;
};

// Pre-save middleware to calculate triage score and status
InsightSchema.pre('save', function(next) {
  // Calculate source points
  let sourcePoints = 0;
  switch (this.source) {
    case 'user_feedback':
      sourcePoints = 3;
      break;
    case 'team_observation':
      sourcePoints = 2;
      break;
    case 'assumption_idea':
      sourcePoints = 1;
      break;
  }

  // Calculate impact points
  let impactPoints = 0;
  switch (this.impact) {
    case 'core_experience':
      impactPoints = 3;
      break;
    case 'improve_experience':
      impactPoints = 2;
      break;
    case 'nice_to_have':
      impactPoints = 1;
      break;
  }

  // Calculate total triage score
  const totalScore = sourcePoints + impactPoints;
  this.triageScore = totalScore;

  // Determine triage status
  if (this.clarity === 'clear' && totalScore >= 4) {
    this.triageStatus = 'passed';
  } else if (this.clarity === 'vague' && totalScore >= 4) {
    this.triageStatus = 'research_needed';
  } else {
    this.triageStatus = 'rejected';
  }

  next();
});

// Create and export the Insight model
const Insight = mongoose.model<IInsight>('Insight', InsightSchema);

export default Insight; 