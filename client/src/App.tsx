import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import pages
import Home from './pages/Home';
import CreateProject from './pages/CreateProject';
import CreateInsight from './pages/CreateInsight';
import ProjectDetail from './pages/ProjectDetail';
import ActionDetail from './pages/ActionDetail';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Dashboard</Link>
            </li>
  
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/insights/create" element={<CreateInsight />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/actions/:id" element={<ActionDetail />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 