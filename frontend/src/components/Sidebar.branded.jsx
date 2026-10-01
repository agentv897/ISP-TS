import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileSearch, 
  Network, 
  FlaskConical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navItems = [
  {
    section: 'Navigation',
    items: [
      { path: '/',                    label: 'Home',                 icon: <Home size={18} />, badge: null },
    ],
  },
  {
    section: 'Modules',
    items: [
      { path: '/data-extraction',     label: 'Data Extraction',      icon: <FileSearch size={18} />, badge: 'live' },
      { path: '/knowledge-graph',     label: 'Knowledge Graph',      icon: <Network size={18} />,     badge: 'live' },
      { path: '/toxicity-prediction', label: 'Toxicity Prediction',  icon: <FlaskConical size={18} />, badge: 'live' },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ transition: 'width 0.3s ease' }}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="sidebar-toggle-btn"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img src="/hcltech-logo.svg" alt="HCLTech" style={{ width: '100%', height: 'auto', maxWidth: 36 }} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title" style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.8rem', lineHeight: '1.2' }}>ISP - Translational<br/>Research Platform</div>
            <div className="sidebar-brand-sub">Powered by HCLTech</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            {!isCollapsed && <div className="sidebar-section-label">{section.section}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.disabled ? '#' : item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive && !item.disabled ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
                end={item.path === '/'}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span 
                    className={`sidebar-status-dot ${item.badge === 'live' ? 'online' : 'offline'}`} 
                    style={{ marginLeft: 'auto', display: 'inline-block' }}
                    title={item.badge === 'live' ? 'Live' : 'Soon'} 
                  />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <span>
              <span className="sidebar-status-dot online" />
              Platform Online
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>v1.0</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, opacity: 0.5, fontSize: '0.6rem', letterSpacing: '0.08em' }}>© HCLTech</div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
