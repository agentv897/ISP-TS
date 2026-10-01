import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileSearch, 
  Network, 
  FlaskConical 
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

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-icon">✧</div>
          <div className="sidebar-brand-title" style={{ fontWeight: 800, letterSpacing: '0.5px' }}>TOXai</div>
          <div className="sidebar-brand-sub">Advanced AI Intelligence Suite</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.disabled ? '#' : item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive && !item.disabled ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`
                }
                end={item.path === '/'}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`sidebar-badge ${item.badge}`}>
                    {item.badge === 'soon' ? 'Soon' : 'Live'}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <span>
            <span className="sidebar-status-dot online" />
            Platform Online
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
