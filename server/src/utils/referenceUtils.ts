import mongoose, { Types } from 'mongoose';
import { IProject } from '../models/Project';

/**
 * Robust project reference extraction utility
 * Handles multiple input types and provides consistent project ID extraction
 */
export async function extractProjectReference(
  reference: 
    | Types.ObjectId 
    | string 
    | { _id?: Types.ObjectId | string } 
    | IProject 
    | null 
    | undefined,
  fallbackOptions?: {
    textMatchFields?: string[];
    textMatchQuery?: string;
  }
): Promise<Types.ObjectId | null> {
  // Logging setup
  const logContext = {
    inputType: typeof reference,
    inputValue: reference ? JSON.stringify(reference) : 'null/undefined'
  };

  console.group('🔍 Project Reference Extraction');
  console.log('Extraction Context:', logContext);

  try {
    // Direct ObjectId check
    if (reference instanceof Types.ObjectId) {
      console.log('✅ Direct ObjectId Extraction');
      return reference;
    }

    // String ID check
    if (typeof reference === 'string' && Types.ObjectId.isValid(reference)) {
      console.log('✅ String ID Extraction');
      return new Types.ObjectId(reference);
    }

    // Nested object with _id check
    if (reference && typeof reference === 'object') {
      const nestedId = (reference as { _id?: Types.ObjectId | string })._id;
      
      if (nestedId instanceof Types.ObjectId) {
        console.log('✅ Nested ObjectId Extraction');
        return nestedId;
      }
      
      if (typeof nestedId === 'string' && Types.ObjectId.isValid(nestedId)) {
        console.log('✅ Nested String ID Extraction');
        return new Types.ObjectId(nestedId);
      }
    }

    // Fallback: Text-based matching
    if (fallbackOptions?.textMatchQuery) {
      const Project = mongoose.model('Project');
      
      const textMatchQuery = fallbackOptions.textMatchFields 
        ? {
            $or: fallbackOptions.textMatchFields.map(field => ({
              [field]: { $regex: fallbackOptions.textMatchQuery, $options: 'i' }
            }))
          }
        : { 
            $or: [
              { name: { $regex: fallbackOptions.textMatchQuery, $options: 'i' } },
              { details: { $regex: fallbackOptions.textMatchQuery, $options: 'i' } }
            ]
          };

      const matchedProject = await Project.findOne(textMatchQuery);
      
      if (matchedProject) {
        console.log('✅ Text-Based Project Match', {
          projectId: matchedProject._id,
          matchedField: Object.keys(textMatchQuery.$or[0])[0]
        });
        return matchedProject._id;
      }
    }

    console.warn('❌ No Valid Project Reference Found', logContext);
    return null;
  } catch (error) {
    console.error('❌ Project Reference Extraction Error', {
      error,
      ...logContext
    });
    return null;
  } finally {
    console.groupEnd();
  }
}

/**
 * Validate that a project reference exists
 */
export async function validateProjectReference(
  projectId: Types.ObjectId | string | null | undefined
): Promise<boolean> {
  if (!projectId) return false;

  try {
    const Project = mongoose.model('Project');
    const projectObjectId = projectId instanceof Types.ObjectId 
      ? projectId 
      : new Types.ObjectId(projectId);
    
    const project = await Project.findById(projectObjectId);
    return !!project;
  } catch {
    return false;
  }
} 