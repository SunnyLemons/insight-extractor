import React, { useState, useEffect, FormEvent } from 'react';
import axios, { AxiosError, isAxiosError } from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/axios';

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

// Add props interface for more flexibility
interface CreateInsightProps {
  onInsightCreated?: (insightId: string) => void;
  initialProjectId?: string;
}

const CreateInsight: React.FC<CreateInsightProps> = ({ 
  onInsightCreated, 
  initialProjectId
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [formData, setFormData] = useState<InsightFormData>({
    text: '',
    source: 'assumption_idea',
    project: initialProjectId
  });

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  // Add loading state for action generation
  const [isGeneratingAction, setIsGeneratingAction] = useState(false);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        
        // Validate response structure
        if (!response.data || !Array.isArray(response.data.projects)) {
          throw new Error('Invalid projects response format');
        }

        setProjects(response.data.projects);
        setIsLoadingProjects(false);

        // Check for pre-selected project from URL or prop
        const searchParams = new URLSearchParams(location.search);
        const preSelectedProjectId = initialProjectId || searchParams.get('projectId');
        
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
        
        // More detailed error logging
        if (axios.isAxiosError(err)) {
          setProjectsError(
            err.response?.data?.error || 
            err.response?.data?.message || 
            'Failed to fetch projects. Please check your connection.'
          );
        } else if (err instanceof Error) {
          setProjectsError(err.message);
        } else {
          setProjectsError('An unexpected error occurred');
        }
        
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [location.search, initialProjectId]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Modify generateActionForInsight method
  const generateActionForInsight = async (insightId: string) => {
    setIsGeneratingAction(true);
    try {
      // Increase timeout for this specific request if needed
      const actionResponse = await api.post('/actions/generate', { insightId }, {
        timeout: 90000 // 90 seconds
      });
      console.log('Action generated:', actionResponse.data);
      return actionResponse.data;
    } catch (err) {
      console.error('Error generating action:', err);
      
      // More detailed error logging
      if (isAxiosError(err)) {
        console.error('Action Generation Error:', {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
          errorType: err.code,
          errorMessage: err.message
        });

        // Provide more context based on error response
        const errorResponse = err.response?.data as { 
          error?: string, 
          details?: string, 
          triageResult?: any 
        };

        const errorMessage = 
          errorResponse?.error || 
          errorResponse?.details || 
          (err.code === 'ECONNABORTED' 
            ? 'Action generation timed out. The process might be taking longer than expected.' 
            : 'Failed to generate action. Please try again.');
        
        // Optional: show error to user
        alert(errorMessage);

        // If triage failed, provide more context
        if (errorResponse?.triageResult) {
          console.warn('Triage Result:', errorResponse.triageResult);
        }
      }
      
      return null;
    } finally {
      setIsGeneratingAction(false);
    }
  };

  // Modify handleSubmit to handle more error scenarios
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setAiReasoning(null);

    try {
      // Validate input
      if (!formData.text.trim()) {
        setError('Insight text is required');
        return;
      }

      // Submit insight to backend
      const response = await api.post('/insights', formData);

      // Show triage result
      const { insight, aiTriageReasoning } = response.data;
      let resultMessage = '';
      let actionResult = null;

      switch (insight.triageStatus) {
        case 'passed':
          // Automatically generate action for passed insights
          try {
            actionResult = await generateActionForInsight(insight._id);
            resultMessage = actionResult 
              ? 'Insight passed triage and an action was generated!' 
              : 'Insight passed triage, but action generation failed.';
          } catch (actionGenError) {
            console.error('Action generation error:', actionGenError);
            resultMessage = 'Insight passed triage, but action generation encountered an error.';
          }
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

      // Call onInsightCreated callback if provided
      if (onInsightCreated) {
        onInsightCreated(insight._id);
      }

      // Show result and redirect
      alert(resultMessage);

      // If a project was selected, navigate to that project's detail page
      if (formData.project) {
        navigate(`/project/${formData.project}`);
      } else {
        // Otherwise, go to insights list
        navigate('/insights');
      }

      // Reset form for inline usage
      setFormData({
        text: '',
        source: 'assumption_idea',
        project: initialProjectId
      });
    } catch (err) {
      console.error('Error creating insight:', err);
      
      // Type-safe error handling
      if (isAxiosError(err)) {
        console.error('Insight Creation Error:', {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        });

        const errorResponse = err.response?.data as ErrorResponse;
        const errorMessage = 
          errorResponse?.error || 
          errorResponse?.message || 
          'Failed to create insight. Please try again.';
        
        // Provide more context about the error
        setError(errorMessage);
        
        // Optional: show more detailed error alert
        alert(`Insight Creation Failed: ${errorMessage}`);
      } else if (err instanceof Error) {
        setError(err.message);
        alert(`Unexpected Error: ${err.message}`);
      } else {
        setError('An unexpected error occurred');
        alert('An unexpected error occurred while creating the insight.');
      }
    }
  };

  // Render form with optional styling based on inline prop
  return (
    <div className="create-insight-container inline-form">
      <div className="form-card">
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="insight-form">
          <div className="form-group">
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="Describe your insight..."
              required
              className="form-input insight-textarea"
              rows={3}
            />
          </div>

          <div className="form-group project-dropdown-container">
            <div className="dropdown-row">
              <div className="form-group">
                <label htmlFor="source" className="form-label">Insight Source</label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="form-input insight-select"
                >
                  <option value="assumption_idea">Assumption/Idea</option>
                  <option value="user_feedback">User Feedback</option>
                  <option value="team_observation">Team Observation</option>
                </select>
              </div>

              {/* Always show project dropdown if multiple projects exist or no initial project */}
              {(projects.length > 1 || !initialProjectId) && (
                <div className="form-group project-dropdown-container">
                  <label htmlFor="project" className="form-label">Select Project</label>
                  <select
                    id="project"
                    name="project"
                    value={formData.project || ''}
                    onChange={handleChange}
                    className="form-input insight-select"
                    required={!initialProjectId}
                  >
                    <option value="">
                      {initialProjectId ? 'Optional Project' : 'Select a Project'}
                    </option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isGeneratingAction}
            >
              {isGeneratingAction ? 'Generating...' : 'Create Insight'}
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