import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the Action interface to match the one in ProjectDetail
interface Action {
  _id: string;
  description: string;
  status: 'proposed' | 'in_progress' | 'completed' | 'rejected';
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  priorityScore: number;
  categoryArea?: string;
  aiGeneratedActions?: {
    domain: string;
    description: string;
    rationale: string;
    priority: number;
  }[];
}

// Define props interface
interface ActionCardProps {
  action: Action;
  onEdit?: (action: Action) => void;
  onComplete?: (actionId: string) => void;
  onDelete?: (actionId: string) => void;
  onRepropose?: (actionId: string) => void;
  variant?: 'proposed' | 'completed';
  actionCount?: number;
}

const ActionCard: React.FC<ActionCardProps> = ({
  action, 
  onEdit, 
  onComplete, 
  onDelete, 
  onRepropose,
  variant = 'proposed',
  actionCount = 0
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render action buttons based on variant
  const renderActionButtons = () => {
    const buttons = [];

    if (variant === 'proposed') {
      if (onEdit) {
        buttons.push(
          <button 
            key="edit"
            onClick={() => {
              onEdit(action);
              setIsMenuOpen(false);
            }}
            style={{
              width: '100%', 
              textAlign: 'left', 
              backgroundColor: 'transparent', 
              border: 'none',
              padding: '10px 15px',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
        );
      }

      if (onComplete) {
        buttons.push(
          <button 
            key="complete"
            onClick={() => {
              onComplete(action._id);
              setIsMenuOpen(false);
            }}
            style={{
              width: '100%', 
              textAlign: 'left', 
              backgroundColor: 'transparent', 
              border: 'none',
              padding: '10px 15px',
              cursor: 'pointer'
            }}
          >
            Complete
          </button>
        );
      }
    }

    if (variant === 'completed' && onRepropose) {
      buttons.push(
        <button 
          key="repropose"
          onClick={() => {
            onRepropose(action._id);
            setIsMenuOpen(false);
          }}
          style={{
            width: '100%', 
            textAlign: 'left', 
            backgroundColor: 'transparent', 
            border: 'none',
            padding: '10px 15px',
            cursor: 'pointer'
          }}
        >
          Re-propose
        </button>
      );
    }

    if (onDelete) {
      buttons.push(
        <button 
          key="delete"
          onClick={() => {
            onDelete(action._id);
            setIsMenuOpen(false);
          }}
          style={{
            width: '100%', 
            textAlign: 'left', 
            backgroundColor: 'transparent', 
            border: 'none',
            padding: '10px 15px',
            cursor: 'pointer',
            color: '#dc3545'
          }}
        >
          Delete
        </button>
      );
    }

    return buttons;
  };

  return (
    <div 
      className="action-card" 
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: variant === 'completed' ? '#f0f0f0' : 'white',
        width: '100%',
        position: 'relative'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ margin: 0 }}>
          {action.categoryArea || (variant === 'proposed' ? 'Action' : 'Completed Action')}
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

      {/* Action Description */}
      <p style={{ 
        marginBottom: '15px', 
        color: '#333',
        fontStyle: 'italic'
      }}>
        {action.description}
      </p>

      {/* Metrics Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <strong>Reach</strong>
          <div style={{ fontSize: '1.2em', color: '#007bff' }}>
            {action.reach}
          </div>
        </div>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <strong>Impact</strong>
          <div style={{ fontSize: '1.2em', color: '#28a745' }}>
            {action.impact}
          </div>
        </div>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <strong>Confidence</strong>
          <div style={{ fontSize: '1.2em', color: '#ffc107' }}>
            {action.confidence}
          </div>
        </div>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <strong>Effort</strong>
          <div style={{ fontSize: '1.2em', color: '#dc3545' }}>
            {action.effort}
          </div>
        </div>
        
      </div>
      <div style={{
        backgroundColor: '#e9ecef',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '0.9em',
        marginBottom: '24px',
      }}>
        {actionCount} Action{actionCount !== 1 ? 's' : ''}
      </div>

      {/* Action Card Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              backgroundColor: '#e9ecef',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5em',
              padding: '3px 12px',
              marginRight: '10px',
              borderRadius: '4px',
              textAlign: 'center',
              
            }}
          >
            &#8230;
          </button>

          {isMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 10,
              minWidth: '150px'
              
            }}>
              {renderActionButtons()}
            </div>
          )}
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
            transition: 'background-color 0.3s ease',
            width: '100%'
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

      
    </div>
  );
};

export default ActionCard; 