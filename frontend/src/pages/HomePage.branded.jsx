import React from 'react';
import { useNavigate } from 'react-router-dom';

const modules = [
  {
    id: 'data-extraction',
    path: '/data-extraction',
    title: 'Data Extraction',
    description: 'Upload Investigator Brochure PDFs and extract structured clinical data through a 9-stage AI pipeline with real-time progress, LLM-as-a-judge evaluation, and Excel export.',
    icon: '📄',
    iconBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    accentStart: '#3b82f6',
    accentEnd: '#1d4ed8',
    status: 'active',
    tech: ['GPT-4o', 'Azure DI', 'SSE Pipeline'],
  },
  {
    id: 'knowledge-graph',
    path: '/knowledge-graph',
    title: 'Knowledge Graph',
    description: 'Visualize and explore drug-target-disease relationships through an interactive biomedical knowledge graph with entity resolution and pathway analysis.',
    icon: '🕸️',
    iconBg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    accentStart: '#8b5cf6',
    accentEnd: '#6d28d9',
    status: 'active',
    tech: ['D3.js', 'Spanner', 'Vertex AI'],
  },
  {
    id: 'toxicity-prediction',
    path: '/toxicity-prediction',
    title: 'Toxicity Prediction',
    description: 'Analyze molecular compounds for organ-level toxicity using Bayesian risk scoring, DeepChem Tox21 neural inference, FDA FAERS clinical data, and structural toxicophore detection.',
    icon: '🧪',
    iconBg: 'linear-gradient(135deg, #ec4899, #be185d)',
    accentStart: '#ec4899',
    accentEnd: '#be185d',
    status: 'active',
    tech: ['DeepChem', 'RDKit', 'FAERS API'],
  },
];

const stats = [
  { value: '9', label: 'Pipeline Stages' },
  { value: '12', label: 'Tox21 Targets' },
  { value: '6', label: 'Organ Systems' },
  { value: '∞', label: 'Compounds' },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="home-hero" style={{ animation: 'fadeInUp 0.6s ease-out' }}>

        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 800, 
          letterSpacing: '-0.02em', 
          color: 'var(--primary)',
          lineHeight: '1.2'
        }}>
          ISP - Translational Research Platform
        </h1>
        <p>
          An AI-powered translational research platform by HCLTech for Multi-Omics and Multi Modal extraction, 
          molecular toxicity prediction, and biomedical knowledge graph exploration.
        </p>
      </div>

      {/* Module Cards */}
      <div className="modules-grid">
        {modules.map((mod, i) => (
          <div
            key={mod.id}
            className={`module-card ${mod.disabled ? 'disabled' : ''}`}
            style={{
              '--card-accent': mod.accentStart,
              '--card-accent-end': mod.accentEnd,
              animation: `fadeInUp ${0.4 + i * 0.1}s ease-out`,
            }}
            onClick={() => !mod.disabled && navigate(mod.path)}
          >
            <div className="module-card-icon" style={{ background: mod.iconBg }}>
              <span style={{ filter: 'grayscale(0)' }}>{mod.icon}</span>
            </div>
            <div className={`module-card-status ${mod.status === 'active' ? 'active' : 'coming-soon'}`}>
              <span style={{
                width: 5, height: 5,
                borderRadius: '50%',
                background: mod.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                display: 'inline-block',
              }} />
              {mod.status === 'active' ? 'Active' : 'Coming Soon'}
            </div>
            <h3>{mod.title}</h3>
            <p>{mod.description}</p>
            <div className="module-card-footer">
              <div className="module-card-tech">
                {mod.tech.map((t) => <span key={t}>{t}</span>)}
              </div>
              <div className="module-card-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Stats */}
      <div className="home-stats" style={{ animation: 'fadeInUp 0.7s ease-out' }}>
        {stats.map((s) => (
          <div key={s.label} className="home-stat">
            <div className="home-stat-value">{s.value}</div>
            <div className="home-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
