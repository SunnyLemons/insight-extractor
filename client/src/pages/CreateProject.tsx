import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

// Define interface for project creation
interface ProjectFormData {
  name: string;
  details: string;
  valueProposition?: string;
  coreFeatures?: string[];
  idealCustomerProfile?: string;
  northStarObjective?: string;
  currentBusinessObjectives?: string[];
}

const CreateProject: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    details: '',
    valueProposition: '',
    coreFeatures: [''],
    idealCustomerProfile: '',
    northStarObjective: '',
    currentBusinessObjectives: ['']
  });

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle array input changes (for core features and business objectives)
  const handleArrayChange = (
    field: 'coreFeatures' | 'currentBusinessObjectives', 
    index: number, 
    value: string
  ) => {
    setFormData(prev => {
      const updatedArray = [...(prev[field] || [])];
      updatedArray[index] = value;
      return {
        ...prev,
        [field]: updatedArray
      };
    });
  };

  // Add new array item
  const addArrayItem = (field: 'coreFeatures' | 'currentBusinessObjectives') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  // Remove array item
  const removeArrayItem = (
    field: 'coreFeatures' | 'currentBusinessObjectives', 
    index: number
  ) => {
    setFormData(prev => {
      const updatedArray = [...(prev[field] || [])];
      updatedArray.splice(index, 1);
      return {
        ...prev,
        [field]: updatedArray
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate form data
      if (!formData.name.trim()) {
        setError('Project name is required');
        return;
      }

      // Prepare payload (filter out empty array items)
      const payload = {
        ...formData,
        coreFeatures: formData.coreFeatures?.filter(feature => feature.trim() !== ''),
        currentBusinessObjectives: formData.currentBusinessObjectives?.filter(obj => obj.trim() !== '')
      };

      // Submit project to backend
      const response = await axios.post('/projects', payload);

      // Redirect to projects list or project detail
      navigate('/');
    } catch (err) {
      console.error('Error creating project:', err);
      
      // Type-safe error handling
      if (axios.isAxiosError(err)) {
        const errorMessage = 
          err.response?.data?.error || 
          err.response?.data?.message || 
          'Failed to create project. Please try again.';
        
        setError(errorMessage);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="create-project-container">
      <div className="form-card">
        <h1 className="form-title">Create New Project</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Project Name *</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              className="form-input"
              required
            />
            <small className="form-hint">
              Choose a clear and concise name for your project
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="details" className="form-label">Project Description *</label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              placeholder="Provide a brief description of the project"
              className="form-input textarea"
              required
              rows={4}
            />
            <small className="form-hint">
              Describe the purpose, goals, and key aspects of your project
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="valueProposition" className="form-label">Value Proposition</label>
            <textarea
              id="valueProposition"
              name="valueProposition"
              value={formData.valueProposition}
              onChange={handleChange}
              placeholder="What unique value does this project provide?"
              className="form-input textarea"
              rows={3}
            />
            <small className="form-hint">
              Explain the unique benefit your project offers to users or stakeholders
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Core Features</label>
            {formData.coreFeatures?.map((feature, index) => (
              <div key={index} className="array-input-group">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleArrayChange('coreFeatures', index, e.target.value)}
                  placeholder="Describe a core feature"
                  className="form-input"
                />
                {index > 0 && (
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('coreFeatures', index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => addArrayItem('coreFeatures')}
              className="add-btn"
            >
              + Add Feature
            </button>
            <small className="form-hint">
              List the key features that define your project
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="idealCustomerProfile" className="form-label">Ideal Customer Profile</label>
            <textarea
              id="idealCustomerProfile"
              name="idealCustomerProfile"
              value={formData.idealCustomerProfile}
              onChange={handleChange}
              placeholder="Describe your target audience"
              className="form-input textarea"
              rows={3}
            />
            <small className="form-hint">
              Who are the primary users or customers for this project?
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="northStarObjective" className="form-label">North Star Objective</label>
            <input
              id="northStarObjective"
              name="northStarObjective"
              value={formData.northStarObjective}
              onChange={handleChange}
              placeholder="Your ultimate project goal"
              className="form-input"
            />
            <small className="form-hint">
              Define the primary long-term objective of your project
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Current Business Objectives</label>
            {formData.currentBusinessObjectives?.map((objective, index) => (
              <div key={index} className="array-input-group">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleArrayChange('currentBusinessObjectives', index, e.target.value)}
                  placeholder="Describe a business objective"
                  className="form-input"
                />
                {index > 0 && (
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('currentBusinessObjectives', index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => addArrayItem('currentBusinessObjectives')}
              className="add-btn"
            >
              + Add Objective
            </button>
            <small className="form-hint">
              List the key business objectives for this project
            </small>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject; 