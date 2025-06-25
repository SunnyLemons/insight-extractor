import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import './App.css';
import api from './services/axios';
import Logo from './components/Logo';

// Import pages
import Home from './pages/Home';
import CreateProject from './pages/CreateProject';
import CreateInsight from './components/CreateInsight';
import ProjectDetail from './pages/ProjectDetail';
import ActionDetail from './pages/ActionDetail';
import CreateInsightPage from './pages/CreateInsightPage';

// Define Project interface
interface Project {
  _id: string;
  name: string;
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data.projects);
      } catch (err) {
        console.error('Error fetching projects for sidebar:', err);
      }
    };

    fetchProjects();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2>
              <NavLink to='/' style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Logo width={83} height={31} />
              </NavLink>
            </h2>
          </div>
          <ul className="sidebar-nav">
            <li>
              <NavLink 
                to="/insights/create-page" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Create Insight
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/projects/create" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Create Project
              </NavLink>
            </li>
            <li className="nav-section-header">Projects</li>
            {projects.map(project => (
              <li key={project._id}>
                <NavLink 
                  to={`/project/${project._id}`} 
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  {project.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects/create" element={<CreateProject />} />
            <Route path="/insights/create" element={<CreateInsight initialProjectId={undefined} />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/actions/:id" element={<ActionDetail />} />
            <Route path="/insights/create-page" element={<CreateInsightPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 