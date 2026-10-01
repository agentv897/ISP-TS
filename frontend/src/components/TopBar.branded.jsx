import React from 'react';
import { useLocation } from 'react-router-dom';

const routeLabels = {
  '/':                    { label: 'Home',                  parent: null },
  '/data-extraction':     { label: 'Data Extraction',       parent: 'Modules' },
  '/toxicity-prediction': { label: 'Toxicity Prediction',   parent: 'Modules' },
  '/knowledge-graph':     { label: 'Knowledge Graph',       parent: 'Modules' },
};

const TopBar = () => {
  const location = useLocation();
  const route = routeLabels[location.pathname] || { label: 'Page', parent: null };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span>ISP - Translational Research Platform</span>
          {route.parent && (
            <>
              <span className="topbar-breadcrumb-sep">/</span>
              <span>{route.parent}</span>
            </>
          )}
          <span className="topbar-breadcrumb-sep">/</span>
          <span className="topbar-breadcrumb-current">{route.label}</span>
        </div>
      </div>
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src="/hcltech-logo.svg" alt="HCLTech" style={{ height: 16, width: 'auto', opacity: 0.8 }} />
        <div className="topbar-status">
          <span style={{
            width: 7, height: 7,
            background: '#10b981',
            borderRadius: '50%',
            display: 'inline-block',
            boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)',
          }} />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
