import React from 'react';
import CreateInsight from '../components/CreateInsight';

const CreateInsightPage: React.FC = () => {
  return (
    <div className="create-insight-page">
      <div className="page-header">
        <h1>Create an Insight</h1>
        <p className="page-intro">
          Insights are the building blocks of continuous improvement. 
          Share your observations, feedback, or ideas that can help 
          drive meaningful change in your projects.
        </p>
      </div>
      
      <CreateInsight />
    </div>
  );
};

export default CreateInsightPage; 