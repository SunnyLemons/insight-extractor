import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Define Project interface
interface Project {
  _id: string;
  name: string;
  details: string;
  createdAt: string;
  insights?: any[];
  insightsCount: number;
}

const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/projects');
        
        setProjects(response.data.projects);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(
          axios.isAxiosError(err) 
            ? err.response?.data?.error || 'Failed to fetch projects' 
            : 'An unexpected error occurred'
        );
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="home-container loading">
        <h1>Loading Projects...</h1>
        <p>Fetching your insights</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container error">
        <h1>Error</h1>
        <p>{error}</p>
        <div className="home-actions">
          <button onClick={() => window.location.reload()}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1>Insight Extractor</h1>
      <p>Capture, triage, and optimize your product insights</p>
      
      <div className="home-actions">
        <Link to="/projects/create" className="action-button">Create Project</Link>
        <Link to="/insights/create" className="action-button">Create Insight</Link>
      </div>

      <div className="projects-section">
        <h2>Your Projects</h2>
        {projects.length === 0 ? (
          <div className="no-projects">
            <p>No projects found. Create your first project!</p>
          </div>
        ) : (
          <div className="project-list">
            {projects.map(project => (
              <Link 
                key={project._id} 
                to={`/project/${project._id}`} 
                className="project-card"
              >
                <div className="project-card-content">
                  <h3>{project.name}</h3>
                  <p>{project.details}</p>
                  <div className="project-card-footer">
                    <small>
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </small>
                    <small>
                      Insights: {project.insightsCount || 0}
                    </small>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 