import React, { useState, useEffect, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

// Define Project interface
interface Project {
  _id: string;
  name: string;
}

// Define interface for insight creation
interface InsightFormData {
  text: string;
  source: 'user_feedback' | 'team_observation' | 'assumption_idea';
  project?: string;
}

// Define error response interface
interface ErrorResponse {
  error?: string;
  message?: string;
}

const CreateInsight: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [formData, setFormData] = useState<InsightFormData>({
    text: '',
    source: 'assumption_idea'
  });

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/projects');
        setProjects(response.data.projects);
        setIsLoadingProjects(false);

        // Check for pre-selected project from URL
        const searchParams = new URLSearchParams(location.search);
        const preSelectedProjectId = searchParams.get('projectId');
        
        if (preSelectedProjectId) {
          // Validate that the project exists in the fetched projects
          const projectExists = response.data.projects.some(
            (project: Project) => project._id === preSelectedProjectId
          );

          if (projectExists) {
            setFormData(prev => ({
              ...prev,
              project: preSelectedProjectId
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setProjectsError(
          axios.isAxiosError(err) 
            ? err.response?.data?.error || 'Failed to fetch projects' 
            : 'An unexpected error occurred'
        );
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [location.search]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add this method inside the CreateInsight component, after handleSubmit
  const generateActionForInsight = async (insightId: string) => {
    try {
      const actionResponse = await axios.post('/actions/generate', { insightId });
      console.log('Action generated:', actionResponse.data);
      return actionResponse.data;
    } catch (err) {
      console.error('Error generating action:', err);
      // Optionally, you could show a toast or notification here
      return null;
    }
  };

  // Modify the handleSubmit method to call generateActionForInsight
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setAiReasoning(null);

    try {
      // Validate form data
      if (!formData.text.trim()) {
        setError('Insight text is required');
        return;
      }

      // Submit insight to backend
      const response = await axios.post('/insights', formData);

      // Show triage result
      const { insight, aiTriageReasoning } = response.data;
      let resultMessage = '';
      switch (insight.triageStatus) {
        case 'passed':
          // Automatically generate action for passed insights
          const actionResult = await generateActionForInsight(insight._id);
          resultMessage = actionResult 
            ? 'Insight passed triage and an action was generated!' 
            : 'Insight passed triage, but action generation failed.';
          break;
        case 'research_needed':
          resultMessage = 'Insight needs further research before optimization.';
          break;
        case 'rejected':
          resultMessage = 'Insight did not meet the triage criteria.';
          break;
        default:
          resultMessage = 'Insight submitted successfully.';
      }

      // Set AI reasoning
      setAiReasoning(aiTriageReasoning);

      // Show result and redirect
      alert(resultMessage);

      // If a project was selected, navigate to that project's detail page
      if (formData.project) {
        navigate(`/project/${formData.project}`);
      } else {
        // Otherwise, go to insights list
        navigate('/insights');
      }
    } catch (err) {
      console.error('Error creating insight:', err);
      
      // Type-safe error handling
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponse>;
        const errorMessage = 
          axiosError.response?.data?.error || 
          axiosError.response?.data?.message || 
          'Failed to create insight. Please try again.';
        
        setError(errorMessage);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="create-insight-container">
      <div className="form-card">
        <h1 className="form-title">Create New Insight</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="insight-form">
          <div className="form-group">
            <label htmlFor="text" className="form-label">Insight Description</label>
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="Describe your insight in detail"
              className="form-input textarea"
              required
              rows={4}
            />
            <small className="form-hint">
              Provide a clear and concise description of your insight
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="source" className="form-label">Source of Insight</label>
            <select
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="form-input select"
              required
            >
              <option value="assumption_idea">Assumption/Idea</option>
              <option value="team_observation">Team Observation</option>
              <option value="user_feedback">User Feedback</option>
            </select>
            <small className="form-hint">
              Select the origin of this insight
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="project" className="form-label">Project (Optional)</label>
            {isLoadingProjects ? (
              <p className="loading-text">Loading projects...</p>
            ) : projectsError ? (
              <p className="error-text">{projectsError}</p>
            ) : (
              <>
                <select
                  id="project"
                  name="project"
                  value={formData.project || ''}
                  onChange={handleChange}
                  className="form-input select"
                >
                  <option value="">Select a project (optional)</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  Associate this insight with a specific project
                </small>
              </>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoadingProjects}
            >
              Create Insight
            </button>
          </div>
        </form>

        {aiReasoning && (
          <div className="ai-reasoning">
            <h3>AI Triage Reasoning</h3>
            <p>{aiReasoning}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateInsight;
