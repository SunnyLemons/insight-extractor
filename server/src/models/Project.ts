import mongoose from 'mongoose';

// Define the Project interface
export interface IProject extends mongoose.Document {
  name: string;
  details: string;
  createdAt?: Date;
  insights?: mongoose.Types.ObjectId[]; // Array of insight references

  // New fields for project context
  valueProposition?: string;
  coreFeatures?: string[];
  idealCustomerProfile?: string;
  northStarObjective?: string;
  currentBusinessObjectives?: string[];
}

// Create the Project schema
const ProjectSchema = new mongoose.Schema<IProject>({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters']
  },
  details: {
    type: String,
    required: [true, 'Project details are required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  insights: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insight'
  }],

  // New schema fields
  valueProposition: {
    type: String,
    trim: true,
    maxlength: [500, 'Value proposition cannot exceed 500 characters']
  },
  coreFeatures: [{
    type: String,
    trim: true,
    maxlength: [200, 'Core feature description cannot exceed 200 characters']
  }],
  idealCustomerProfile: {
    type: String,
    trim: true,
    maxlength: [300, 'Ideal customer profile description cannot exceed 300 characters']
  },
  northStarObjective: {
    type: String,
    trim: true,
    maxlength: [300, 'North star objective cannot exceed 300 characters']
  },
  currentBusinessObjectives: [{
    type: String,
    trim: true,
    maxlength: [200, 'Business objective cannot exceed 200 characters']
  }]
});

// Pre-save middleware to add insight to project
ProjectSchema.methods.addInsight = async function(this: IProject, insightId: mongoose.Types.ObjectId | string) {
  if (!this.insights) {
    this.insights = [];
  }
  
  // Convert string to ObjectId if needed
  const objectId = typeof insightId === 'string' 
    ? new mongoose.Types.ObjectId(insightId) 
    : insightId;
  
  // Prevent duplicate insights
  if (!this.insights.some((id: mongoose.Types.ObjectId) => id.equals(objectId))) {
    this.insights.push(objectId);
    await this.save();
  }
};

// Create and export the Project model
const Project = mongoose.model<IProject>('Project', ProjectSchema);

export default Project; 