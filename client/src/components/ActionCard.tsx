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
  isEditing?: boolean;
  onSave?: (action: Action) => void;
  onCancelEdit?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  action, 
  onEdit, 
  onComplete, 
  onDelete, 
  onRepropose,
  variant = 'proposed',
  actionCount = 0,
  isEditing = false,
  onSave,
  onCancelEdit
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // State for editing
  const [editedAction, setEditedAction] = useState<Action>({ ...action });

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

  // Handle input changes during editing
  const handleInputChange = (field: keyof Action, value: number) => {
    console.group('🔢 Input Change Tracking');
    console.log('Field:', field);
    console.log('New Value:', value);
    console.log('Current Edited Action (Before):', editedAction);
    console.trace('Call Stack');
    console.groupEnd();

    // Use functional update to ensure state is correctly updated
    setEditedAction(prev => {
      const updatedAction = {
        ...prev,
        [field]: value
      };

      console.group('🔄 Updated Action State');
      console.log('Previous State:', prev);
      console.log('Updated State:', updatedAction);
      console.groupEnd();

      return updatedAction;
    });
  };

  // Render editing inputs or static values
  const renderMetricInput = (label: string, field: keyof Action, color: string) => {
    // Helper function to safely convert value to string
    const formatValue = (value: unknown): string => {
      // Handle different types of values
      if (value === undefined) return 'N/A';
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'string') return value;
      
      // For complex types, return a placeholder or stringify
      return 'Complex Value';
    };

    // Determine if the field is a valid numeric input field
    const isNumericField = 
      field === 'reach' || 
      field === 'impact' || 
      field === 'confidence' || 
      field === 'effort';

    if (isEditing && isNumericField) {
      return (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <strong>{label}</strong>
          <input 
            type="number"
            value={formatValue(editedAction[field])}
            onChange={(e) => {
              // Log the input change for debugging
              console.log('📊 Metric Input Change:', {
                field,
                rawValue: e.target.value,
                parsedValue: Number(e.target.value),
                currentEditedAction: editedAction
              });

              // Only update if it's a numeric field
              if (isNumericField) {
                handleInputChange(field, Number(e.target.value));
              }
            }}
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: '1.2em',
              color: color,
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '4px'
            }}
            min={1}
            max={10}
          />
        </div>
      );
    }
    
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '8px',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        <strong>{label}</strong>
        <div style={{ fontSize: '1.2em', color: color }}>
          {formatValue(action[field])}
        </div>
      </div>
    );
  };

  // Render action buttons based on variant
  const renderActionButtons = () => {
    const buttons = [];

    if (variant === 'proposed') {
      if (onEdit && !isEditing) {
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

      if (isEditing) {
        buttons.push(
          <button 
            key="save"
            onClick={() => {
              if (onSave) {
                console.group('💾 Saving Action');
                console.log('Current Edited Action:', editedAction);
                console.log('Original Action:', action);
                console.groupEnd();

                // Merge edited action with original action
                const updatedAction = {
                  ...action,
                  ...editedAction
                };

                onSave(updatedAction);
                setIsMenuOpen(false);
              }
            }}
            style={{
              width: '100%', 
              textAlign: 'left', 
              backgroundColor: 'transparent', 
              border: 'none',
              padding: '10px 15px',
              cursor: 'pointer',
              color: '#28a745'
            }}
          >
            Save
          </button>
        );

        buttons.push(
          <button 
            key="cancel"
            onClick={() => {
              if (onCancelEdit) {
                onCancelEdit();
                setIsMenuOpen(false);
              }
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
            Cancel
          </button>
        );
      }

      if (onComplete && !isEditing) {
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

    if (onDelete && !isEditing) {
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
      {isEditing ? (
        <textarea 
          value={editedAction.description}
          onChange={(e) => setEditedAction(prev => ({
            ...prev,
            description: e.target.value
          }))}
          style={{
            width: '100%',
            marginBottom: '15px', 
            color: '#333',
            fontStyle: 'italic',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px'
          }}
          rows={3}
        />
      ) : (
        <p style={{ 
          marginBottom: '15px', 
          color: '#333',
          fontStyle: 'italic'
        }}>
          {action.description}
        </p>
      )}

      {/* Metrics Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '15px'
      }}>
        {renderMetricInput('Reach', 'reach', '#007bff')}
        {renderMetricInput('Impact', 'impact', '#28a745')}
        {renderMetricInput('Confidence', 'confidence', '#ffc107')}
        {renderMetricInput('Effort', 'effort', '#dc3545')}
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