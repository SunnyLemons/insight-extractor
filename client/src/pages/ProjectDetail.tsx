import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import '../App.css';

// Define interfaces
interface Insight {
  _id: string;
  text: string;
  source: 'user_feedback' | 'team_observation' | 'assumption_idea';
  clarity: 'clear' | 'vague';
  impact: 'core_experience' | 'improve_experience' | 'nice_to_have';
  createdAt: string;
  project?: string;
  triageScore?: number;
  triageStatus?: 'pending' | 'passed' | 'rejected' | 'research_needed';
  actions?: Action[];
}

interface Action {
  _id: string;
  insight: string;
  description: string;
  status: 'proposed' | 'in_progress' | 'completed' | 'rejected';
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  priorityScore: number;
  categoryArea?: string;
  generatedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Add aiGeneratedActions to the interface
  aiGeneratedActions?: {
    domain: string;
    description: string;
    rationale: string;
    priority: number;
  }[];
}

interface Project {
  _id: string;
  name: string;
  details: string;
  createdAt: string;
  insights?: Insight[];
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedAction, setEditedAction] = useState<Partial<Action>>({});
  
  // New state for tab management
  const [activeTab, setActiveTab] = useState<'insights' | 'actions' | 'completed'>('actions');

  // Add new state for filters
  const [categoryAreaFilter, setCategoryAreaFilter] = useState<string[]>([]);
  const [domainFilter, setDomainFilter] = useState<string[]>([]);

  // Add new state for sorting
  const [sortOrder, setSortOrder] = useState<'high-to-low' | 'low-to-high'>('high-to-low');

  const fetchProjectDetails = async () => {
    try {
      // Fetch project details
      const projectResponse = await axios.get(`/projects/${id}`);
      const projectData = projectResponse.data;
      setProject(projectData);

      // Fetch insights for the project with their actions
      const insightsResponse = await axios.get(`/insights?project=${id}`);
      
      console.log('Full insights response:', insightsResponse.data);

      // Determine the correct insights array
      const insightsArray = insightsResponse.data.insights || 
        (Array.isArray(insightsResponse.data) ? insightsResponse.data : []);

      console.log('Processed insights array:', insightsArray);

      // Fetch actions for each insight
      const insightsWithDetails = await Promise.all(
        insightsArray.map(async (insight: Insight) => {
          try {
            // Fetch full insight details
            const insightDetailResponse = await axios.get(`/insights/${insight._id}`);
            const insightWithActions = {
              ...insightDetailResponse.data,
              actions: [] // Will be populated if actions exist
            };

            // Fetch actions for the insight if they exist
            try {
              console.log(`Attempting to fetch actions for insight ${insight._id}`);
              const actionsResponse = await axios.get(`/actions/insight/${insight._id}`);
              console.log(`Actions response for insight ${insight._id}:`, actionsResponse.data);
              
              // Determine the correct actions array
              const actionsArray = actionsResponse.data.actions || 
                (Array.isArray(actionsResponse.data) ? actionsResponse.data : []);

              console.log(`Processed actions for insight ${insight._id}:`, actionsArray);

              insightWithActions.actions = actionsArray;
            } catch (actionsError) {
              console.error(`Error fetching actions for insight ${insight._id}:`, actionsError);
              // If the error is an axios error, log more details
              if (axios.isAxiosError(actionsError)) {
                console.error('Axios error details:', {
                  response: actionsError.response,
                  request: actionsError.request,
                  message: actionsError.message
                });
              }
            }

            return insightWithActions;
          } catch (detailError) {
            console.error(`Error fetching details for insight ${insight._id}:`, detailError);
            return insight;
          }
        })
      );

      console.log('Insights with details:', insightsWithDetails);
      setInsights(insightsWithDetails);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const handleEditAction = (action: Action) => {
    setEditingActionId(action._id);
    setEditedAction({ ...action });
  };

  const handleCancelEdit = () => {
    setEditingActionId(null);
    setEditedAction({});
  };

  const handleSaveAction = async () => {
    if (!editingActionId) return;

    try {
      // Prepare the update payload
      const updatePayload = {
        description: editedAction.description,
        status: editedAction.status,
        reach: editedAction.reach,
        impact: editedAction.impact,
        confidence: editedAction.confidence,
        effort: editedAction.effort,
        categoryArea: editedAction.categoryArea
      };

      // Send update to backend
      const response = await axios.patch(`/actions/${editingActionId}`, updatePayload);

      // Refresh project details to reflect changes
      await fetchProjectDetails();

      // Reset editing state
      setEditingActionId(null);
      setEditedAction({});
    } catch (error) {
      console.error('Error updating action:', error);
      alert('Failed to update action. Please try again.');
    }
  };

  const handleInputChange = (field: keyof Action, value: string | number) => {
    setEditedAction(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddInsight = () => {
    // Navigate to create insight page with project ID pre-selected
    navigate(`/insights/create?projectId=${id}`);
  };

  const handleCompleteAction = async (actionId: string) => {
    try {
      // Send request to update action status to 'completed'
      const response = await axios.patch(`/actions/${actionId}/status`, { 
        status: 'completed' 
      });

      // Refresh project details to reflect changes
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error completing action:', error);
      alert('Failed to complete action. Please try again.');
    }
  };

  const handleReproposedAction = async (actionId: string) => {
    try {
      // Send request to update action status back to 'proposed'
      const response = await axios.patch(`/actions/${actionId}/status`, { 
        status: 'proposed' 
      });

      // Refresh project details to reflect changes
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error re-proposing action:', error);
      alert('Failed to re-propose action. Please try again.');
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      // Confirm deletion
      const confirmDelete = window.confirm('Are you sure you want to delete this action?');
      
      if (!confirmDelete) return;

      // Send delete request
      await axios.delete(`/actions/${actionId}`);

      // Refresh project details
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error deleting action:', error);
      alert('Failed to delete action. Please try again.');
    }
  };

  const handleDeleteInsight = async (insightId: string) => {
    try {
      // Confirm deletion
      const confirmDelete = window.confirm('Are you sure you want to delete this insight and its associated actions?');
      
      if (!confirmDelete) return;

      // Send delete request
      await axios.delete(`/insights/${insightId}`);

      // Refresh project details
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error deleting insight:', error);
      alert('Failed to delete insight. Please try again.');
    }
  };

  // Function to extract unique category areas and domains
  const extractUniqueCategories = (insights: Insight[]) => {
    const categoryAreas = new Set<string>();
    const domains = new Set<string>();

    insights.forEach(insight => {
      (insight.actions || []).forEach(action => {
        if (action.categoryArea) {
          categoryAreas.add(action.categoryArea);
        }
        // Safely extract domains
        if (action.aiGeneratedActions && action.aiGeneratedActions.length > 0) {
          action.aiGeneratedActions.forEach(genAction => {
            if (genAction?.domain) {
              domains.add(genAction.domain);
            }
          });
        }
      });
    });

    return {
      categoryAreas: Array.from(categoryAreas).sort(),
      domains: Array.from(domains).sort()
    };
  };

  // Extract unique categories when insights change
  const uniqueCategories = React.useMemo(() => {
    return extractUniqueCategories(insights);
  }, [insights]);

  // Sorting function for actions
  const sortActions = (actions: Action[]) => {
    return [...actions].sort((a, b) => {
      // Ensure priorityScore exists and is a number
      const priorityA = a.priorityScore || 0;
      const priorityB = b.priorityScore || 0;

      // Sort based on current sort order
      return sortOrder === 'high-to-low' 
        ? priorityB - priorityA 
        : priorityA - priorityB;
    });
  };

  // Render filter section with dropdowns
  const renderFilterSection = () => {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px', 
          marginBottom: '20px',
          backgroundColor: '#f9f9f9',
          padding: '15px',
          borderRadius: '8px',
          alignItems: 'center'
        }}
      >
        {/* Category Area Filter Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
          <label 
            htmlFor="category-area-select" 
            style={{ 
              marginBottom: '5px', 
              fontWeight: 'bold' 
            }}
          >
            Category Area
          </label>
          <select
            id="category-area-select"
            value={categoryAreaFilter[0] || ''}
            onChange={(e) => {
              const selectedValue = e.target.value;
              setCategoryAreaFilter(
                selectedValue 
                  ? [selectedValue] 
                  : []
              );
            }}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Categories</option>
            {uniqueCategories.categoryAreas.map(category => (
              <option 
                key={category} 
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Domain Filter Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
          <label 
            htmlFor="domain-select" 
            style={{ 
              marginBottom: '5px', 
              fontWeight: 'bold' 
            }}
          >
            Domains
          </label>
          <select
            id="domain-select"
            value={domainFilter[0] || ''}
            onChange={(e) => {
              const selectedValue = e.target.value;
              setDomainFilter(
                selectedValue 
                  ? [selectedValue] 
                  : []
              );
            }}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Domains</option>
            {uniqueCategories.domains.map(domain => (
              <option 
                key={domain} 
                value={domain}
              >
                {domain}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          height: '100%' 
        }}>
          <button
            onClick={() => {
              setCategoryAreaFilter([]);
              setDomainFilter([]);
            }}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              height: 'fit-content'
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Filter Summary */}
        {(categoryAreaFilter.length > 0 || domainFilter.length > 0) && (
          <div 
            style={{ 
              marginLeft: 'auto', 
              display: 'flex', 
              alignItems: 'center',
              gap: '10px',
              color: '#6c757d'
            }}
          >
            <span>
              {categoryAreaFilter.length > 0 && `Category: ${categoryAreaFilter[0]}`}
              {categoryAreaFilter.length > 0 && domainFilter.length > 0 && ' | '}
              {domainFilter.length > 0 && `Domain: ${domainFilter[0]}`}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render sorting section
  const renderSortSection = () => {
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          marginBottom: '15px' 
        }}
      >
        <label 
          htmlFor="sort-select" 
          style={{ 
            marginRight: '10px', 
            fontWeight: 'bold' 
          }}
        >
          Sort by Priority:
        </label>
        <select
          id="sort-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'high-to-low' | 'low-to-high')}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ced4da',
            backgroundColor: 'white'
          }}
        >
          <option value="high-to-low">Highest to Lowest</option>
          <option value="low-to-high">Lowest to Highest</option>
        </select>
      </div>
    );
  };

  // Update filter actions to work with single-select
  const filterActions = (actions: Action[], status: 'proposed' | 'completed') => {
    return actions.filter(action => {
      // Check status first
      if (action.status !== status) return false;

      // Check category area filter
      const categoryAreaMatch = 
        categoryAreaFilter.length === 0 || 
        (action.categoryArea && action.categoryArea === categoryAreaFilter[0]);

      // Check domain filter
      const domainMatch = 
        domainFilter.length === 0 || 
        (action.aiGeneratedActions && 
         action.aiGeneratedActions.some(genAction => 
           genAction?.domain && genAction.domain === domainFilter[0]
         ));

      return categoryAreaMatch && domainMatch;
    });
  };

  if (isLoading) return <div>Loading project details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!project) return <div>No project found</div>;

  return (
    <div className="App">
      <div className="project-detail">
        <div className="project-header">
          <h1>{project.name}</h1>
          <button 
            onClick={handleAddInsight}
            className="add-insight-btn"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: '15px'
            }}
          >
            + Add Insight
          </button>
        </div>
        
        <div className="project-info">
          <p>{project.details}</p>
          <div className="project-metadata">
            <small>
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </small>
          </div>
        </div>

        {/* Tab Navigation */}
        <div 
          className="tab-navigation" 
          style={{ 
            display: 'flex', 
            marginBottom: '20px', 
            borderBottom: '1px solid #e0e0e0' 
          }}
        >
          <button
            onClick={() => setActiveTab('actions')}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: activeTab === 'actions' ? '#007bff' : 'white',
              color: activeTab === 'actions' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: activeTab === 'completed' ? '#007bff' : 'white',
              color: activeTab === 'completed' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'insights' ? '#007bff' : 'white',
              color: activeTab === 'insights' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            All insights
          </button>
        </div>

        {/* Actions Tab Content */}
        {activeTab === 'actions' && (
          <div className="actions-section">
            <h2>Project Actions</h2>
            
            {/* Add filter and sort sections */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              {renderFilterSection()}
              {renderSortSection()}
            </div>

            {insights.some(
              insight => 
                insight.actions &&
                Array.isArray(insight.actions) &&
                filterActions(insight.actions, 'proposed').length > 0
            ) ? (
              <div className="actions-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: '16px' 
              }}>
                {sortActions(
                  insights.flatMap(insight => 
                    filterActions(insight.actions || [], 'proposed')
                  )
                ).map(action => (
                  <div 
                    key={action._id} 
                    className="action-card" 
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      backgroundColor: 'white',
                      width: '100%'
                    }}
                  >
                    {editingActionId === action._id ? (
                      // Editing mode
                      <div>
                        <input 
                          type="text"
                          value={editedAction.description || ''}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          style={{ width: '100%', marginBottom: '10px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <button onClick={handleSaveAction}>Save</button>
                          <button onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <h3 style={{ margin: 0 }}>
                            {action.categoryArea || 'Action'}
                          </h3>
                          <span 
                            style={{ 
                              backgroundColor: '#f0f0f0', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              fontSize: '0.8em'
                            }}
                          >
                            Priority Score: {action.priorityScore}
                          </span>
                        </div>
                        
                        {/* Main Action Description */}
                        <p style={{ 
                          marginBottom: '15px', 
                          color: '#333' 
                        }}>
                          {action.description}
                        </p>
                        
                        {/* Action Card Footer */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '15px',
                          borderTop: '1px solid #e0e0e0',
                          paddingTop: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <span style={{
                              backgroundColor: '#e9ecef',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8em'
                            }}>
                              Reach: {action.reach}
                            </span>
                            <span style={{
                              backgroundColor: '#e9ecef',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8em'
                            }}>
                              Impact: {action.impact}
                            </span>
                          </div>
                          <button
                            style={{
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              transition: 'background-color 0.3s ease'
                            }}
                            onClick={() => navigate(`/actions/${action._id}`)}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#0056b3';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#007bff';
                            }}
                          >
                            View Details
                          </button>
                        </div>
                        
                        {/* AI Generated Actions Section */}
                        {action.aiGeneratedActions && action.aiGeneratedActions.length > 0 && (
                          <div style={{
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px',
                            padding: '15px',
                            marginTop: '15px'
                          }}>
                            <h4 style={{ 
                              marginTop: 0, 
                              marginBottom: '10px', 
                              color: '#007bff' 
                            }}>
                              Recommended Actions
                            </h4>
                            {action.aiGeneratedActions.map((aiAction, index) => (
                              <div 
                                key={index} 
                                style={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '6px',
                                  padding: '12px',
                                  marginBottom: '10px'
                                }}
                              >
                                <div style={{
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  marginBottom: '8px'
                                }}>
                                  <h5 style={{ 
                                    margin: 0, 
                                    color: '#333' 
                                  }}>
                                    {aiAction.domain}
                                  </h5>
                                  <span style={{
                                    backgroundColor: '#e9ecef',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.7em'
                                  }}>
                                    Priority: {aiAction.priority}
                                  </span>
                                </div>
                                
                                <p style={{ 
                                  marginBottom: '8px', 
                                  color: '#666' 
                                }}>
                                  {aiAction.description}
                                </p>
                                
                                <div style={{
                                  backgroundColor: '#f1f3f5',
                                  borderRadius: '4px',
                                  padding: '10px',
                                  fontSize: '0.9em',
                                  color: '#495057'
                                }}>
                                  <strong>Rationale:</strong> {aiAction.rationale}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between' 
                        }}>
                          <div>
                            <button 
                              onClick={() => handleEditAction(action)}
                              style={{ marginRight: '8px' }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleCompleteAction(action._id)}
                              style={{ marginRight: '8px' }}
                            >
                              Complete
                            </button>
                            <button 
                              onClick={() => handleDeleteAction(action._id)}
                              style={{ 
                                backgroundColor: '#ff4d4d', 
                                color: 'white' 
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No proposed actions match the current filters.</p>
            )}
          </div>
        )}

        {/* Completed Actions Tab Content */}
        {activeTab === 'completed' && (
          <div className="completed-actions-section">
            <h2>Completed Actions</h2>
            
            {/* Add filter and sort sections */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              {renderFilterSection()}
              {renderSortSection()}
            </div>

            {insights.some(
              insight => 
                insight.actions &&
                Array.isArray(insight.actions) &&
                filterActions(insight.actions, 'completed').length > 0
            ) ? (
              <div className="actions-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: '16px' 
              }}>
                {insights.flatMap(insight => 
                  sortActions(filterActions(insight.actions || [], 'completed'))
                    .map(action => (
                      <div 
                        key={action._id} 
                        className="action-card" 
                        style={{
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '16px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          backgroundColor: '#f0f0f0',
                          width: '100%'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <h3 style={{ margin: 0 }}>
                            {action.categoryArea || 'Completed Action'}
                          </h3>
                          <span 
                            style={{ 
                              backgroundColor: '#e0e0e0', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              fontSize: '0.8em'
                            }}
                          >
                            Priority: {action.priorityScore}
                          </span>
                        </div>
                        <p style={{ marginBottom: '10px' }}>
                          {action.description}
                        </p>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '8px',
                          marginBottom: '10px'
                        }}>
                          <div>
                            <strong>Reach:</strong> {action.reach}
                          </div>
                          <div>
                            <strong>Impact:</strong> {action.impact}
                          </div>
                          <div>
                            <strong>Confidence:</strong> {action.confidence}
                          </div>
                          <div>
                            <strong>Effort:</strong> {action.effort}
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between' 
                        }}>
                          <div>
                            <button 
                              onClick={() => handleReproposedAction(action._id)}
                            >
                              Re-propose
                            </button>
                            <button 
                              onClick={() => handleDeleteAction(action._id)}
                              style={{ 
                                backgroundColor: '#ff4d4d', 
                                color: 'white',
                                marginLeft: '8px'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            ) : (
              <p>No completed actions match the current filters.</p>
            )}
          </div>
        )}

        {/* Insights Tab Content */}
        {activeTab === 'insights' && (
          <div className="insights-section">
            {insights.length > 0 ? (
              <table className="insights-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f4f4f4' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Insight</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Source</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Clarity</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Impact</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Triage Score</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Triage Status</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.map(insight => (
                    <tr key={insight._id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{insight.text}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {insight.source === 'user_feedback' ? 'User Feedback' : 
                         insight.source === 'team_observation' ? 'Team Observation' : 
                         'Assumption/Idea'}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        {insight.clarity === 'clear' ? 'Clear' : 'Vague'}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        {insight.impact === 'core_experience' ? 'Core Experience' : 
                         insight.impact === 'improve_experience' ? 'Improve Experience' : 
                         'Nice to Have'}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        {insight.triageScore !== undefined ? insight.triageScore : 'N/A'}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        <span 
                          style={{
                            padding: '5px 10px',
                            borderRadius: '4px',
                            color: 'white',
                            fontWeight: 'bold',
                            backgroundColor: 
                              insight.triageStatus === 'passed' ? '#28a745' :
                              insight.triageStatus === 'research_needed' ? '#ffc107' :
                              insight.triageStatus === 'pending' ? '#17a2b8' :
                              '#dc3545'
                          }}
                        >
                          {insight.triageStatus === 'passed' ? 'Passed' : 
                           insight.triageStatus === 'research_needed' ? 'Needs Research' : 
                           insight.triageStatus === 'pending' ? 'Pending' :
                           'Rejected'}
                        </span>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        <button 
                          onClick={() => navigate(`/insights/${insight._id}`)}
                          style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            marginRight: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteInsight(insight._id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '8px' 
              }}>
                <p>No insights have been added to this project yet.</p>
                <button 
                  onClick={handleAddInsight}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '15px'
                  }}
                >
                  + Add First Insight
                </button>
              </div>
            )}
          </div>
        )}

        <Link 
          to="/" 
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px'
          }}
        >
          Back to Projects
        </Link>

        <Link 
          to={`/projects/${id}/edit`} 
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            display: 'inline-block',
            marginTop: '15px'
          }}
        >
          Edit Project
        </Link>
      </div>
    </div>
  );
};

export default ProjectDetail; 