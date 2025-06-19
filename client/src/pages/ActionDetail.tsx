import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/axios';
import '../App.css';

interface Project {
  _id: string;
  name: string;
  details: string;
}

interface Insight {
  _id: string;
  text: string;
  project?: Project;
  source: 'user_feedback' | 'team_observation' | 'assumption_idea';
}

interface Action {
  _id: string;
  insight: Insight;
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
}

const ActionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [action, setAction] = useState<Action | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActionDetails = async () => {
      try {
        const response = await api.get(`/actions/${id}`);
        setAction(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching action details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load action details');
        setIsLoading(false);
      }
    };

    fetchActionDetails();
  }, [id]);

  if (isLoading) return <div>Loading action details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!action) return <div>No action found</div>;

  return (
    <div className="App">
      <div className="action-detail-container" style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Project Context Section */}
        {action.insight && action.insight.project && (
          <div style={{
            backgroundColor: '#f0f8ff',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#007bff' }}>
                Project: {action.insight.project.name}
              </h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>
                {action.insight.project.details}
              </p>
            </div>
            <Link 
              to={`/project/${action.insight.project._id}`}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                padding: '8px 15px',
                borderRadius: '4px'
              }}
            >
              View Project
            </Link>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 style={{ margin: 0, color: '#007bff' }}>
            {action.categoryArea || 'Action Details'}
          </h1>
          <span style={{
            backgroundColor: '#f0f0f0',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}>
            Priority Score: {action.priorityScore}
          </span>
        </div>

        {/* Insight Section */}
        {action.insight && (
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ marginTop: 0, color: '#333' }}>Related Insight</h2>
            <p style={{ fontSize: '1em', lineHeight: '1.5' }}>
              {action.insight.text}
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '10px'
            }}>
              <span>
                <strong>Source:</strong> {
                  action.insight.source === 'user_feedback' ? 'User Feedback' :
                  action.insight.source === 'team_observation' ? 'Team Observation' :
                  'Assumption/Idea'
                }
              </span>
            </div>
          </div>
        )}

        {/* Main Action Details */}
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Summary</h2>
          <p style={{ fontSize: '1.1em', lineHeight: '1.6' }}>
            {action.description}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginTop: '20px'
          }}>
            <div>
              <strong>Status:</strong> 
              <span style={{
                marginLeft: '10px',
                backgroundColor: 
                  action.status === 'proposed' ? '#17a2b8' :
                  action.status === 'in_progress' ? '#ffc107' :
                  action.status === 'completed' ? '#28a745' : '#dc3545',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.9em'
              }}>
                {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
              </span>
            </div>
            <div><strong>Generated By:</strong> {action.generatedBy}</div>
            <div><strong>Reach:</strong> {action.reach}</div>
            <div><strong>Impact:</strong> {action.impact}</div>
            <div><strong>Confidence:</strong> {action.confidence}</div>
            <div><strong>Effort:</strong> {action.effort}</div>
          </div>
        </div>

        {/* AI Generated Actions */}
        {action.aiGeneratedActions && action.aiGeneratedActions.length > 0 && (
          <div style={{
            backgroundColor: '#f0f8ff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ marginTop: 0, color: '#007bff' }}>Recommended Actions</h2>
            {action.aiGeneratedActions.map((aiAction, index) => (
              <div 
                key={index} 
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  padding: '15px',
                  marginBottom: '15px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h3 style={{ margin: 0, color: '#333' }}>{aiAction.domain}</h3>
                  <span style={{
                    backgroundColor: '#e9ecef',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8em'
                  }}>
                    Priority: {aiAction.priority}
                  </span>
                </div>
                
                <p style={{ marginBottom: '10px', color: '#666' }}>
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

        {/* AI Analysis */}
        {action.aiAnalysis && (
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h2 style={{ marginTop: 0, color: '#333' }}>AI Analysis</h2>
            {action.aiAnalysis.fullReasoning && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Full Reasoning:</strong>
                <p>{action.aiAnalysis.fullReasoning}</p>
              </div>
            )}
            {action.aiAnalysis.keyInsights && action.aiAnalysis.keyInsights.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Key Insights:</strong>
                <ul style={{ paddingLeft: '20px' }}>
                  {action.aiAnalysis.keyInsights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            {action.aiAnalysis.potentialChallenges && action.aiAnalysis.potentialChallenges.length > 0 && (
              <div>
                <strong>Potential Challenges:</strong>
                <ul style={{ paddingLeft: '20px' }}>
                  {action.aiAnalysis.potentialChallenges.map((challenge, index) => (
                    <li key={index}>{challenge}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px'
        }}>
          <div>
            <strong>Created:</strong> {new Date(action.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Last Updated:</strong> {new Date(action.updatedAt).toLocaleString()}
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px'
        }}>
          <Link 
            to="/projects" 
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              padding: '10px 15px',
              borderRadius: '4px'
            }}
          >
            Back to Projects
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActionDetail; 