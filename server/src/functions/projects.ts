import { createHandler } from '../utils/serverlessHandler';
import Project from '../models/Project';

// Handler for getting all projects
const getProjects = async (event: any, context: any) => {
  // Check if it's a GET request
  if (event.httpMethod !== 'GET') {
    throw new Error('Method Not Allowed');
  }

  try {
    // Fetch all projects
    const projects = await Project.find({}).lean();
    
    return {
      projects,
      count: projects.length
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
};

// Handler for creating a new project
const createProject = async (event: any, context: any) => {
  // Check if it's a POST request
  if (event.httpMethod !== 'POST') {
    throw new Error('Method Not Allowed');
  }

  // Parse the request body
  if (!event.body) {
    throw new Error('Request body is required');
  }

  try {
    const projectData = JSON.parse(event.body);
    
    // Create a new project
    const newProject = new Project(projectData);
    await newProject.save();

    return {
      message: 'Project created successfully',
      project: newProject.toObject()
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
};

// Export the handler based on the HTTP method
export const handler = createHandler(async (event, context) => {
  switch (event.httpMethod) {
    case 'GET':
      return getProjects(event, context);
    case 'POST':
      return createProject(event, context);
    default:
      throw new Error('Method Not Allowed');
  }
}); 