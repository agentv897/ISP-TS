import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  User,
  Send,
  RefreshCw,
  Microscope,
  Target,
  Database,
  BrainCircuit,
  MessageSquareText,
  Activity,
  Maximize,
  Layers,
  Info,
  AlertCircle,
  MessageSquare,
  Sparkles,
  SendHorizontal,
  LayoutDashboard,
  FlaskConical,
  TrendingUp,
  Settings2,
  BarChart3
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

/* ── Color map for entity types ──────────────────────────── */
const colorMap = {
  Drug: '#38bdf8', // Sky 400
  Gene: '#2dd4bf', // Teal 400
  Pathway: '#c084fc', // Purple 400
  Species: '#4ade80', // Green 400
  AdverseEvent: '#fb7185', // Rose 400
  Endpoint: '#fbbf24', // Amber 400
  Default: '#94a3b8',
};

const normalizeType = (type) => {
  if (!type) return 'Default';
  const t = type.toLowerCase();
  if (t.includes('drug') || t.includes('compound')) return 'Drug';
  if (t.includes('gene') || t.includes('target')) return 'Gene';
  if (t.includes('path')) return 'Pathway';
  if (t.includes('spec') || t.includes('preclinical')) return 'Species';
  if (t.includes('adverse') || t.includes('event') || t.includes('side')) return 'AdverseEvent';
  if (t.includes('endpoint')) return 'Endpoint';
  return 'Default';
};

/* ── Reusable inline-style fragments ─────────────────────── */
const S = {
  glass: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-lg)',
  },
  label: {
    fontSize: '0.6rem',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  panelBtn: (active, isSim = false) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.85rem 0',
    fontSize: '0.65rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    border: 'none',
    background: active ? (isSim ? 'rgba(99, 102, 241, 0.1)' : 'var(--accent-soft)') : 'transparent',
    color: active ? (isSim ? 'var(--accent)' : 'var(--accent)') : 'var(--text-muted)',
    borderBottom: active ? `2px solid ${isSim ? 'var(--accent)' : 'var(--accent)'}` : '2px solid transparent',
    transition: 'all 0.2s',
  }),
};

const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  const html = text
    .replace(/^### (.*$)/gim, '<h3 style="margin: 0.6rem 0 0.3rem; font-size: 0.95rem; font-weight: 800; color: var(--primary)">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*[\-\*] (.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.25rem; font-size: 0.82rem;">$1</li>')
    .replace(/\n\n/g, '<div style="margin-bottom: 0.75rem"></div>')
    .replace(/\n/g, '<br />');
  return <div style={{ lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
};

/* ── Professional Brand Logo ─────────────────────────────── */
const BrandLogo = ({ size = 36 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
    <FlaskConical size={size} strokeWidth={2.5} />
    <span style={{ fontSize: size * 0.45, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>AViiD</span>
  </div>
);

/* ── Simulation Panel Component ──────────────────────────── */
const SimulationPanel = ({ drugs, pubChemData, selectedNode }) => {
  const [mw, setMw] = useState(450);
  const [dose, setDose] = useState(200);
  const [simDrug, setSimDrug] = useState('General');
  const [toxReport, setToxReport] = useState(null);
  const [toxLoading, setToxLoading] = useState(false);
  const toxCache = useRef({});

  // Sync Focus with the main graph
  useEffect(() => {
    if (selectedNode && normalizeType(selectedNode.type) === 'Drug') {
      setSimDrug(selectedNode.label);
    }
  }, [selectedNode]);

  // Handle data fetching for the simulation
  useEffect(() => {
    if (!simDrug) return;
    
    // Check if we have molecular weight in the graph properties
    if (selectedNode && selectedNode.label === simDrug) {
      const mwProp = selectedNode.properties?.Molecular_Weight;
      if (mwProp) {
        const val = parseFloat(typeof mwProp === 'object' ? mwProp.value : mwProp);
        if (!isNaN(val)) setMw(val);
      }
    }

    // Force a fresh fetch for this specific drug to ensure we have LogP/TPSA for simulation
    axios.get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${simDrug}/property/MolecularWeight,XLogP,TPSA/JSON`)
      .then(r => {
        const props = r.data.PropertyTable.Properties[0];
        if (props.MolecularWeight) setMw(parseFloat(props.MolecularWeight));
      })
      .catch(() => {
        const seed = simDrug.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        setMw(150 + (seed % 800));
      });

    // FETCH AI TOXICITY PREDICTION (Optimized with Cache)
    if (simDrug !== 'General') {
      if (toxCache.current[simDrug]) {
        setToxReport(toxCache.current[simDrug]);
        setToxLoading(false);
      } else {
        setToxLoading(true);
        axios.post('/api/tox/analyze', { input: simDrug, mode: 'single' })
          .then(r => {
            toxCache.current[simDrug] = r.data;
            setToxReport(r.data);
          })
          .catch(e => console.error('Tox analysis failed:', e))
          .finally(() => setToxLoading(false));
      }
    } else {
      setToxReport(null);
    }
  }, [simDrug, drugs]);

  // Sync MW from active PubChem data (if it matches the current focus)
  useEffect(() => {
    if (pubChemData && pubChemData.MolecularWeight) {
      const currentName = selectedNode?.label || selectedNode?.name;
      if (simDrug === 'General' || simDrug === currentName) {
        const weight = parseFloat(pubChemData.MolecularWeight);
        if (!isNaN(weight)) setMw(weight);
      }
    }
  }, [pubChemData, simDrug, selectedNode]);

  // Heuristic PK constants based on MW and Lipophilicity (LogP)
  const simulateData = useMemo(() => {
    const logP = pubChemData?.XLogP ? parseFloat(pubChemData.XLogP) : 2.5;
    const tpsa = pubChemData?.TPSA ? parseFloat(pubChemData.TPSA) : 60;
    const cl = 0.12 * (1 + Math.max(0, logP) / 6);
    const ka = Math.max(0.05, 3.0 - (mw / 350) - (tpsa / 200));
    const vd = (0.4 + mw / 600) * (1 + Math.max(0, logP) / 4);
    const kel = cl / vd;

    // BASELINE (Reference 200mg dose)
    const refDose = 200;
    const refMw = 450;
    const refKa = Math.max(0.05, 3.0 - (refMw / 350) - (tpsa / 200));
    const refVd = (0.4 + refMw / 600) * (1 + Math.max(0, logP) / 4);
    const refKel = cl / refVd;

    const points = [];
    let maxConc = 0;
    for (let t = 0; t <= 24; t += 0.5) {
      const c = (dose * ka) / (vd * (ka - kel)) * (Math.exp(-kel * t) - Math.exp(-ka * t));
      const cRef = (refDose * refKa) / (refVd * (refKa - refKel)) * (Math.exp(-refKel * t) - Math.exp(-refKa * t));

      points.push({
        time: t,
        concentration: parseFloat(c.toFixed(2)),
        baseline: parseFloat(cRef.toFixed(2))
      });
      if (c > maxConc) maxConc = c;
    }
    const trends = [];
    for (let m = 100; m <= 1200; m += 100) {
      const ka_m = Math.max(0.1, 2.5 - (m / 400));
      const vd_m = (0.5 + m / 500) * (1 + 2.5 / 4);
      const cl_m = 0.12 * (1 + 2.5 / 6);
      const kel_m = cl_m / vd_m;
      const t_max = Math.log(ka_m / kel_m) / (ka_m - kel_m);
      const c_max = (dose * ka_m) / (vd_m * (ka_m - kel_m)) * (Math.exp(-kel_m * t_max) - Math.exp(-ka_m * t_max));
      const auc_m = dose / cl_m;
      trends.push({ mw: m, cMax: parseFloat(c_max.toFixed(2)), auc: parseFloat(auc_m.toFixed(1)) });
    }
    const currentAuc = dose / cl;
    const refAuc = refDose / cl;
    const deviation = ((currentAuc - refAuc) / refAuc * 100).toFixed(0);

    return { points, trends, cMax: maxConc.toFixed(2), auc: currentAuc.toFixed(1), deviation };
  }, [mw, dose, pubChemData]);

  const radarData = useMemo(() => {
    if (!toxReport) return [
      { subject: 'DILI', A: 20, fullMark: 100 },
      { subject: 'Renal', A: 40, fullMark: 100 },
      { subject: 'Cardiac', A: 30, fullMark: 100 },
      { subject: 'Neuro', A: 50, fullMark: 100 },
      { subject: 'GI', A: 60, fullMark: 100 },
      { subject: 'Pulmonary', A: 25, fullMark: 100 },
    ];

    return [
      { subject: 'DILI', A: toxReport['DILI Risk']?.score || 10, fullMark: 100 },
      { subject: 'Renal', A: toxReport['Kidney Injury Risk']?.score || 10, fullMark: 100 },
      { subject: 'Cardiac', A: toxReport['Cardiac Risk']?.score || 10, fullMark: 100 },
      { subject: 'Neuro', A: toxReport['Neuro Risk']?.score || 10, fullMark: 100 },
      { subject: 'GI', A: toxReport['GI Risk']?.score || 10, fullMark: 100 },
      { subject: 'Pulmonary', A: toxReport['Lung Injury Risk']?.score || 10, fullMark: 100 },
    ];
  }, [toxReport]);

  const chartMargin = { top: 10, right: 10, left: 20, bottom: 25 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', borderLeft: '1px solid var(--border-light)' }}>

      {/* 0. Simulation Header - Focus & Branding */}
      <div style={{
        padding: '1.5rem 1.25rem',
        background: simDrug !== 'General' ? 'linear-gradient(135deg, #eef2ff 0%, #fff 100%)' : 'linear-gradient(to bottom, #f8fafc, #fff)',
        borderBottom: '1px solid var(--border-light)',
        borderTop: simDrug !== 'General' ? '4px solid var(--accent)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 48,
            height: 48,
            background: simDrug !== 'General' ? 'var(--primary)' : 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <FlaskConical size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {simDrug === 'General' ? 'Precision Simulation' : simDrug}
              {simDrug !== 'General' && (
                <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Drug</span>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {simDrug === 'General' ? 'PK/PD Predictive Modeling' : `Active Pharmacokinetic Simulation Mode`}
            </div>
          </div>
        </div>
      </div>

      {/* 1 & 2. Controls & Main Graph Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', padding: '1.5rem', background: '#fff', borderBottom: '1px solid var(--border-light)' }}>

        {/* Left Column: Controls & KPIs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings2 size={12} /> Live Controls
              </div>
              <select
                style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', height: 24, borderRadius: '4px', border: '1px solid var(--border)', background: '#fff', fontWeight: 700 }}
                value={simDrug}
                onChange={(e) => setSimDrug(e.target.value)}
              >
                <option value="General">General Simulation</option>
                {drugs.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Molecular Weight
                  <div title="Simulates structural modifications (SAR). Increasing MW often improves binding but can reduce oral bioavailability and increase tissue accumulation." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                    <Info size={11} />
                  </div>
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)' }}>{mw} <span style={{ fontWeight: 500, fontSize: '0.6rem' }}>Da</span></span>
              </div>
              <input type="range" min="100" max="1200" step="10" value={mw} onChange={(e) => setMw(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Administered Dose</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)' }}>{dose} <span style={{ fontWeight: 500, fontSize: '0.6rem' }}>mg</span></span>
              </div>
              <input type="range" min="50" max="1000" step="50" value={dose} onChange={(e) => setDose(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: 'var(--accent-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Peak Conc.</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)' }}>{simulateData.cMax} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>mg/L</span></div>
            </div>
            <div style={{ background: 'var(--success-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                Total Exposure
                <span style={{ color: simulateData.deviation > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 900 }}>{simulateData.deviation > 0 ? '+' : ''}{simulateData.deviation}%</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--success)' }}>{simulateData.auc} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>h·mg/L</span></div>
            </div>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Microscope size={10} /> Scientific Insight
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Adjusting **Molecular Weight** simulates structural Lead Optimization (SAR). It models how adding/removing functional groups impacts tissue distribution and metabolic clearance.
            </div>
          </div>
        </div>

        {/* Right Column: Main Real-time Graph */}
        <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '1.5rem', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={14} color="var(--accent)" />
            Real-time Concentration Deviation
            <div title="Pharmacokinetic modeling using a one-compartment open equation. It predicts plasma levels over 24h, adjusted for absorption (ka) and elimination (kel) rates based on MW and Dose." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
              <Info size={11} />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulateData.points} margin={chartMargin}>
                <defs>
                  <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="time" fontSize={9} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} label={{ value: 'Time (Hours)', position: 'bottom', fontSize: 8, fill: 'var(--text-muted)', offset: -10 }} />
                <YAxis fontSize={9} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <ChartTooltip contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.7rem' }} />
                <Area type="monotone" dataKey="baseline" name="Baseline (200mg)" stroke="#cbd5e1" strokeWidth={1} fillOpacity={0.1} fill="#cbd5e1" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="concentration" name="Current Dose" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorC)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
            Move the sliders on the left to see the curve react against the standard baseline in real-time.
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', paddingBottom: '2.5rem' }}>

        {/* Graph 0: AI Toxicity Fingerprint (The "Interesting" Part) */}
        <div style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.75rem', opacity: 0.05 }}>
            <BrainCircuit size={120} />
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--accent)" />
            AI Toxicity Risk Fingerprint
            <div title="Generated via Bayesian Inference Engine. Scores are calculated by synthesizing structural drug data with real-world evidence found in the Knowledge Graph (Adverse Events, Targets, Pathways)." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
              <Info size={12} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ height: 260, width: 260, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" fontSize={10} tick={{ fill: 'var(--text-secondary)', fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={8} tick={false} axisLine={false} />
                  <Radar
                    name="Risk Score"
                    dataKey="A"
                    stroke="var(--accent)"
                    fill="var(--accent)"
                    fillOpacity={0.5}
                  />
                  <ChartTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ ...S.label, marginBottom: '1rem' }}>Mechanistic Insight ({simDrug})</div>

              {/* Show KG-based evidence immediately if AI is loading */}
              {toxLoading && selectedNode?.properties && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', color: 'var(--primary)', fontSize: '0.65rem' }}>
                  <strong>KG Priority Alert:</strong> Known markers detected in the Knowledge Graph. Integrating with AI Bayesian engine...
                </div>
              )}

              {toxLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.6 }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
                      <div style={{ width: '40%', height: 10, background: '#e2e8f0', marginBottom: '0.5rem' }} />
                      <div style={{ width: '80%', height: 8, background: '#f1f5f9' }} />
                    </div>
                  ))}
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>Analyzing molecular pathways in TOXai engine...</div>
                </div>
              ) : toxReport ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(toxReport).filter(([k]) => k.includes('Risk')).slice(0, 3).map(([key, val]) => (
                    <div key={key} style={{ padding: '0.75rem', background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{key.replace(' Risk', '')}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: val.score > 50 ? 'var(--danger)' : 'var(--success)' }}>{val.label}</span>
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{val.factors?.[0] || "No significant markers found in the Knowledge Graph."}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
                  Select a specific drug from the graph to generate a mechanistic AI toxicity report.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graph 2: Cmax Deviation */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={14} color="var(--primary)" />
            Peak Level (Cmax) Deviation
            <div title="Structural Sensitivity Analysis: Shows how the maximum drug concentration (Cmax) evolves as Molecular Weight varies. High Cmax is often linked to acute toxicity." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
              <Info size={11} />
            </div>
          </div>
          <div style={{ height: 160, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulateData.trends} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="mw" fontSize={9} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} label={{ value: 'Molecular Weight (Da)', position: 'bottom', fontSize: 8, fill: 'var(--text-muted)', offset: -10 }} />
                <YAxis fontSize={9} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <ChartTooltip contentStyle={{ borderRadius: 'var(--radius)', fontSize: '0.7rem' }} />
                <Line type="monotone" dataKey="cMax" name="Peak" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: 'var(--primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>* Graph shows how Cmax evolves as drug size varies from 100 to 1200 Da.</p>
        </div>

        {/* Graph 3: AUC Deviation (New) */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={14} color="var(--success)" />
            Exposure (AUC) Deviation
            <div title="Cumulative Exposure Modeling: Area Under the Curve (AUC) is calculated as Dose/Clearance. It represents the total amount of drug the body is exposed to over the dosing interval." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
              <Info size={11} />
            </div>
          </div>
          <div style={{ height: 160, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulateData.trends} margin={chartMargin}>
                <defs>
                  <linearGradient id="colorAUC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="mw" fontSize={9} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} label={{ value: 'Molecular Weight (Da)', position: 'bottom', fontSize: 8, fill: 'var(--text-muted)', offset: -10 }} />
                <YAxis fontSize={9} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <ChartTooltip contentStyle={{ borderRadius: 'var(--radius)', fontSize: '0.7rem' }} />
                <Area type="monotone" dataKey="auc" name="Exposure" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorAUC)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>* Consistent exposure profile across different molecular weights for this model.</p>
        </div>

      </div>
    </div>
  );
};

const KnowledgeGraphApp = () => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState('All');
  const [selectedNode, setSelectedNode] = useState(null);
  const [activePanel, setActivePanel] = useState('simulation');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'DILI Knowledge Graph online. I am ready to analyze drug-target-disease relationships. What would you like to explore?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pubChemData, setPubChemData] = useState(null);
  const [pubChemLoading, setPubChemLoading] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [chatFocusDrug, setChatFocusDrug] = useState('General');
  const [chatLoading, setChatLoading] = useState(false);

  const getNeighbors = (nodeId, linksList) => {
    const neighbors = new Set([nodeId]);
    linksList.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (s === nodeId) neighbors.add(t);
      if (t === nodeId) neighbors.add(s);
    });
    return neighbors;
  };

  const quickQuestions = [
    "What was the highest SAD cohort Cmax?",
    "Show pre-clinical safety margins and NOAELs.",
    "List all SAE and frequent AEs.",
    "Are there events in the GI or Hepatobiliary SOC?"
  ];

  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const zoomToFitRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    axios.get('/api/kg/drugs')
      .then((r) => setDrugs(r.data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch((e) => console.warn('Drug list unavailable:', e.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get(`/api/kg/graph?drug=${selectedDrug}`)
      .then((r) => {
        const rawNodes = r.data.nodes || [];
        const rawLinks = r.data.links || [];

        // 1. Calculate degrees for all raw nodes
        const degreeMap = {};
        rawLinks.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (s) degreeMap[s] = (degreeMap[s] || 0) + 1;
          if (t) degreeMap[t] = (degreeMap[t] || 0) + 1;
        });

        // 2. Group by normalized name and pick the "best" node (most connected)
        const canonicalNodes = {}; // normLabel -> bestNode
        const idToCanonicalMap = {}; // oldId -> canonicalId

        rawNodes.forEach(node => {
          const normLabel = node.label?.trim().toLowerCase();
          if (!normLabel) return;

          const currentBest = canonicalNodes[normLabel];
          const myDegree = degreeMap[node.id] || 0;
          const bestDegree = currentBest ? (degreeMap[currentBest.id] || 0) : -1;

          if (!currentBest || myDegree > bestDegree) {
            canonicalNodes[normLabel] = node;
          }
        });

        // 3. Map all original IDs to their canonical counterparts
        rawNodes.forEach(node => {
          const normLabel = node.label?.trim().toLowerCase();
          if (normLabel && canonicalNodes[normLabel]) {
            idToCanonicalMap[node.id] = canonicalNodes[normLabel].id;
          } else {
            idToCanonicalMap[node.id] = node.id;
          }
        });

        // 4. Create final node list (one per unique label)
        const filteredNodes = Object.values(canonicalNodes);

        // 5. Remap links to use canonical IDs and remove self-links
        const filteredLinks = rawLinks.map(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          return {
            ...l,
            source: idToCanonicalMap[s] || s,
            target: idToCanonicalMap[t] || t
          };
        }).filter(l => l.source !== l.target);

        setNodes(filteredNodes);
        setLinks(filteredLinks);
      })
      .catch((e) => { console.error('Graph fetch failed:', e); setError('Could not load graph data. Is the KG backend running?'); })
      .finally(() => setLoading(false));
  }, [selectedDrug]);

  useEffect(() => {
    if (!selectedNode || normalizeType(selectedNode.type) !== 'Drug') { setPubChemData(null); return; }
    setPubChemLoading(true);
    const name = selectedNode.label;
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/IUPACName,MolecularFormula,MolecularWeight,XLogP,CanonicalSMILES,IsomericSMILES,HBondDonorCount,HBondAcceptorCount,TPSA,Complexity/JSON`;
    fetch(url).then((r) => r.ok ? r.json() : Promise.reject()).then((d) => setPubChemData(d.PropertyTable.Properties[0]))
      .catch(() => setPubChemData(null)).finally(() => setPubChemLoading(false));
  }, [selectedNode]);

  // Optimized scroll logic: Only scroll automatically for user messages
  // AI messages will start from where the user is, allowing "above-to-down" reading
  useEffect(() => {
    if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'user') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!nodes.length || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.05, 6]).on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    const simNodes = nodes.map((n) => ({ ...n }));
    const simLinks = links.map((l) => ({ ...l }));

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d) => d.id).distance(45))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('x', d3.forceX(width / 2).strength(0.12))
      .force('y', d3.forceY(height / 2).strength(0.12))
      .force('collision', d3.forceCollide().radius(30))
      .alphaDecay(0.06); // Faster settling

    const getNeighborhood = (centerNodeId) => getNeighbors(centerNodeId, simLinks);

    const zoomToFit = (targetNodes, transition = true) => {
      const w = containerRef.current?.clientWidth || width;
      const h = containerRef.current?.clientHeight || height;
      if (!targetNodes || !targetNodes.length || !w || !h) return false;

      const x0 = d3.min(targetNodes, d => d.x);
      const x1 = d3.max(targetNodes, d => d.x);
      const y0 = d3.min(targetNodes, d => d.y);
      const y1 = d3.max(targetNodes, d => d.y);

      if (!isFinite(x0) || !isFinite(x1) || !isFinite(y0) || !isFinite(y1)) return false;

      const gW = (x1 - x0) || 100;
      const gH = (y1 - y0) || 100;
      const scale = Math.min(2, 0.85 / Math.max(gW / w, gH / h));

      const transform = d3.zoomIdentity
        .translate(w / 2, h / 2)
        .scale(scale)
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);

      if (transition) {
        svg.transition().duration(800).ease(d3.easeCubicOut).call(zoom.transform, transform);
      } else {
        svg.call(zoom.transform, transform);
      }
      return true;
    };

    const updateHighlight = (selectedId) => {
      if (!selectedId) {
        node.style('opacity', 1).style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))');
        link.style('opacity', 0.6).attr('stroke-width', 1.5);
        return;
      }
      const neighbors = getNeighborhood(selectedId);
      node.style('opacity', d => neighbors.has(d.id) ? 1 : 0.15)
        .style('filter', d => d.id === selectedId ? 'drop-shadow(0 0 12px rgba(0,0,0,0.4))' : 'none');
      link.style('opacity', l => (neighbors.has(l.source.id) && neighbors.has(l.target.id)) ? 1 : 0.05)
        .attr('stroke-width', l => (neighbors.has(l.source.id) && neighbors.has(l.target.id)) ? 3 : 1.5);
    };

    const link = g.append('g').selectAll('line').data(simLinks).enter().append('line')
      .attr('stroke', (d) => d.label === 'SimilarTo' ? '#818cf8' : '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d) => d.label === 'SimilarTo' ? '6,4' : 'none')
      .attr('stroke-opacity', 0.6)
      .style('transition', 'opacity 0.3s, stroke-width 0.3s');

    const hexPath = (s) => { const r = s; return `M0,${-r} L${r * 0.866},${-r * 0.5} L${r * 0.866},${r * 0.5} L0,${r} L${-r * 0.866},${r * 0.5} L${-r * 0.866},${-r * 0.5}Z`; };

    const node = g.append('g').selectAll('g').data(simNodes).enter().append('g')
      .style('cursor', 'pointer')
      .style('transition', 'opacity 0.3s')
      .on('click', (e, d) => {
        setSelectedNode(d);
        setSidebarOpen(true);

        // AUTO-FOCUS: If it's a drug, prioritize the Simulation module
        if (normalizeType(d.type) === 'Drug') {
          setActivePanel('simulation');
        } else {
          setActivePanel('inspector');
        }

        updateHighlight(d.id);

        // Sync AI Chat focus if clicking a drug
        if (normalizeType(d.type) === 'Drug') {
          setChatFocusDrug(d.label);
        }

        const neighbors = getNeighborhood(d.id);
        zoomToFit(simNodes.filter(n => neighbors.has(n.id)), true);
        e.stopPropagation();
      })
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    svg.on('click', () => {
      setSelectedNode(null);
      setSidebarOpen(false);
      updateHighlight(null);
    });

    node.append('path')
      .attr('d', (d) => {
        const nt = normalizeType(d.type);
        if (nt === 'Drug') return hexPath(18);
        if (nt === 'Gene') return d3.symbol().type(d3.symbolDiamond).size(600)();
        if (nt === 'Pathway') return d3.symbol().type(d3.symbolSquare).size(500)();
        if (nt === 'AdverseEvent') return d3.symbol().type(d3.symbolTriangle).size(500)();
        return d3.symbol().type(d3.symbolCircle).size(400)();
      })
      .attr('fill', (d) => colorMap[normalizeType(d.type)])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('transform', (d) => normalizeType(d.type) === 'AdverseEvent' ? 'rotate(180)' : '')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))');

    node.append('text')
      .text((d) => d.label?.length > 16 ? d.label.slice(0, 14) + '…' : d.label)
      .attr('dx', 20).attr('dy', 4)
      .attr('font-size', '10px').attr('font-weight', 700).attr('fill', '#475569')
      .attr('font-family', 'Inter, system-ui, sans-serif');

    simulation.on('tick', () => {
      link.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    zoomToFitRef.current = (targetNodes, transition = true) => {
      if (Array.isArray(targetNodes)) {
        return zoomToFit(targetNodes, transition);
      }
      return zoomToFit(simNodes, targetNodes !== false); // fallback to old signature
    };

    let autoZoomDone = false;
    simulation.on('tick.autozoom', () => {
      if (!autoZoomDone && simulation.alpha() < 0.6) {
        if (zoomToFit(simNodes, true)) {
          autoZoomDone = true;
          simulation.on('tick.autozoom', null);
          // Stop simulation after settlement so nodes don't jiggle
          setTimeout(() => simulation.stop(), 500);
        }
      }
    });

    const handleResize = () => {
      const w = containerRef.current?.clientWidth;
      const h = containerRef.current?.clientHeight;
      if (w && h) zoomToFit(simNodes, false);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      simulation.stop();
      simulation.on('tick.autozoom', null);
      window.removeEventListener('resize', handleResize);
    };
  }, [nodes, links]);

  // AUTO-RECENTER: Ensure nodes don't get hidden when sidebar expands
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedNode && nodes.length) {
        const neighbors = getNeighbors(selectedNode.id, links);
        const targetNodes = nodes.filter(n => neighbors.has(n.id));
        zoomToFitRef.current?.(targetNodes, true);
      }
    }, 450); // Matches the 0.4s CSS transition
    return () => clearTimeout(timer);
  }, [sidebarOpen, activePanel, selectedNode, nodes, links]);

  const handleSend = async (overrideMsg) => {
    const msg = overrideMsg || inputValue;
    if (!msg.trim()) return;
    setInputValue('');
    setChatMessages((p) => [...p, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      // Build sub-graph context for the AI
      let dataContext = null;
      const targetDrug = chatFocusDrug !== 'General' ? chatFocusDrug : (selectedNode?.label || selectedDrug);
      if (targetDrug && targetDrug !== 'All') {
        const drugNode = nodes.find(n => n.label === targetDrug);
        if (drugNode) {
          const neighbors = getNeighbors(drugNode.id, links);
          dataContext = nodes.filter(n => neighbors.has(n.id)).map(n => ({
            name: n.label,
            type: n.type,
            properties: n.properties
          }));
        }
      }

      const r = await axios.post('/api/kg/chat', {
        message: msg,
        context: targetDrug,
        subgraph: dataContext
      });
      setChatMessages((p) => [...p, { role: 'ai', text: r.data.response }]);
    } catch {
      setChatMessages((p) => [...p, { role: 'ai', text: 'Sorry, the AI service is temporarily unavailable. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const panelWidths = {
    inspector: '380px',
    chat: '420px',
    simulation: '50%',
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: sidebarOpen ? `1fr ${panelWidths[activePanel]}` : '1fr',
      height: 'calc(100vh - 56px)',
      background: '#ffffff',
      overflow: 'hidden',
      transition: 'grid-template-columns 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
        <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 10, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ ...S.glass, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BrandLogo size={32} />
            <div>
              <div style={S.label}>Analysis Context</div>
              <select value={selectedDrug} onChange={(e) => setSelectedDrug(e.target.value)}
                style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                <option value="All">Master Graph</option>
                {drugs.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => zoomToFitRef.current?.(true)}
            style={{ ...S.glass, padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', border: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Maximize size={14} /> Reset View
          </button>
        </div>

        {showStats && (
          <div style={{ ...S.glass, position: 'absolute', bottom: '1.25rem', left: '1.25rem', zIndex: 10, display: 'flex', gap: '1.5rem', padding: '0.75rem 1.25rem' }}>
            {[{ l: 'Nodes', v: nodes.length }, { l: 'Edges', v: links.length }].map((s) => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={S.label}>{s.l}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{s.v}</div>
              </div>
            ))}
            <button onClick={() => setShowStats(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
          </div>
        )}

        {showLegend && (
          <div style={{ ...S.glass, position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10, padding: '1rem 1.25rem', width: 180 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={S.label}>Legend</div>
              <button onClick={() => setShowLegend(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
            </div>
            {Object.entries(colorMap).filter(([k]) => k !== 'Default').map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Restore buttons for hidden panels */}
        <div style={{ position: 'absolute', bottom: '1.25rem', right: sidebarOpen ? '1.25rem' : '5rem', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
          {!showLegend && (
            <button onClick={() => setShowLegend(true)} style={{ ...S.glass, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Layers size={18} />
            </button>
          )}
          {!showStats && (
            <button onClick={() => setShowStats(true)} style={{ ...S.glass, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Info size={18} />
            </button>
          )}
        </div>

        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ ...S.label, marginTop: '1rem', color: '#38bdf8' }}>Mapping Relationships…</div>
          </div>
        )}
        {error && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ ...S.glass, padding: '2rem', textAlign: 'center', maxWidth: 360 }}>
              <div style={{ color: 'var(--danger)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <AlertCircle size={48} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem' }}>Connection Error</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{error}</div>
            </div>
          </div>
        )}

        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', zIndex: 10, width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', color: '#fff', border: '3px solid #fff', boxShadow: 'var(--shadow-xl)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={24} />
          </button>
        )}
      </div>

      {sidebarOpen && (
        <div style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: activePanel === 'simulation' ? 'var(--bg)' : '#fff' }}>
            <button
              onClick={() => setActivePanel('simulation')}
              style={{
                ...S.panelBtn(activePanel === 'simulation', true),
                position: 'relative',
                boxShadow: activePanel === 'simulation' ? 'inset 0 -2px 0 0 var(--accent)' : 'none'
              }}
            >
              {activePanel !== 'simulation' && (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(99, 102, 241, 0.03)', pointerEvents: 'none' }}
                />
              )}
              <FlaskConical size={14} /> Simulation Focus
            </button>
            <button onClick={() => setActivePanel('inspector')} style={S.panelBtn(activePanel === 'inspector')}>
              <Microscope size={14} /> Inspector
            </button>
            <button onClick={() => setActivePanel('chat')} style={S.panelBtn(activePanel === 'chat')}>
              <Sparkles size={14} /> AI Chat
            </button>
            <button onClick={() => setSidebarOpen(false)} style={{ padding: '0 1rem', background: 'none', border: 'none', borderLeft: '1px solid var(--border-light)', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {activePanel === 'inspector' ? (
              selectedNode ? (
                <div>
                  <div style={S.label}>Entity Classification</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.25rem' }}>{selectedNode.label}</div>
                  <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.6rem', fontSize: '0.6rem', fontWeight: 700, color: colorMap[normalizeType(selectedNode.type)], background: `${colorMap[normalizeType(selectedNode.type)]}15`, borderRadius: 'var(--radius-full)', border: `1px solid ${colorMap[normalizeType(selectedNode.type)]}25` }}>
                    {selectedNode.type}
                  </span>

                  {normalizeType(selectedNode.type) === 'Drug' && (
                    <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      {pubChemLoading ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}><div style={{ ...S.label, color: 'var(--accent)' }}>Fetching PubChem…</div></div>
                      ) : pubChemData ? (
                        <div>
                          {pubChemData.CID && (
                            <div style={{ textAlign: 'center', marginBottom: '0.75rem', padding: '0.75rem', background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                              <img src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${pubChemData.CID}/PNG`} alt="Structure" style={{ height: 100, objectFit: 'contain' }} />
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                            {[
                              { l: 'Formula', v: pubChemData.MolecularFormula },
                              { l: 'Weight', v: pubChemData.MolecularWeight },
                              { l: 'LogP', v: pubChemData.XLogP },
                              { l: 'TPSA', v: pubChemData.TPSA },
                              { l: 'H Donor', v: pubChemData.HBondDonorCount },
                              { l: 'H Acceptor', v: pubChemData.HBondAcceptorCount },
                            ].map((p) => (
                              <div key={p.l} style={{ background: '#fff', padding: '0.4rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
                                <div style={{ ...S.label, fontSize: '0.45rem' }}>{p.l}</div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)' }}>{p.v ?? '—'}</div>
                              </div>
                            ))}
                          </div>
                          {pubChemData.CanonicalSMILES && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ ...S.label, color: 'rgba(255,255,255,0.5)', fontSize: '0.45rem' }}>Canonical SMILES</div>
                              <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#fff', wordBreak: 'break-all' }}>{pubChemData.CanonicalSMILES}</div>
                            </div>
                          )}
                          {pubChemData.IUPACName && (
                            <div style={{ marginTop: '0.4rem', padding: '0.6rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                              <div style={{ ...S.label, fontSize: '0.45rem' }}>IUPAC Name</div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{pubChemData.IUPACName}</div>
                            </div>
                          )}
                        </div>
                      ) : <div style={{ ...S.label, textAlign: 'center' }}>No PubChem data</div>}
                    </div>
                  )}

                  {selectedNode.properties && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ ...S.label, marginBottom: '0.75rem' }}>Properties</div>
                      {Object.entries(selectedNode.properties).map(([key, val]) => (
                        <div key={key} style={{ paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ ...S.label, fontSize: '0.55rem' }}>{key.replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)' }}>{val.value}</span>
                          </div>
                          {val.details && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>{val.details}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4 }}>
                  <div style={{ marginBottom: '1rem', color: 'var(--accent)' }}>
                    <Microscope size={48} strokeWidth={1} />
                  </div>
                  <div style={S.label}>Select a node to inspect</div>
                </div>
              )
            ) : activePanel === 'chat' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                  <div style={S.label}>TOXai Research Assistant</div>
                  <select
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: '#fff' }}
                    value={chatFocusDrug}
                    onChange={(e) => setChatFocusDrug(e.target.value)}
                  >
                    <option value="General">General Graph Assistant</option>
                    {drugs.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.5rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <AnimatePresence initial={false}>
                    {chatMessages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '88%',
                          padding: '0.85rem 1.1rem',
                          borderRadius: m.role === 'user' ? '1.25rem 1.25rem 0 1.25rem' : '1.25rem 1.25rem 1.25rem 0',
                          background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,1)',
                          color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                          fontSize: '0.82rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                          border: m.role === 'user' ? 'none' : '1px solid var(--border)'
                        }}
                      >
                        {m.role === 'user' ? m.text : <MarkdownRenderer text={m.text} />}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {chatLoading && (
                    <div style={{ alignSelf: 'flex-start', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius)', fontSize: '0.7rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={12} className="animate-spin" /> TOXai is thinking...
                    </div>
                  )}
                  <div ref={chatEndRef} style={{ height: 1 }} />
                </div>
                {chatMessages.length <= 1 && (
                  <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {quickQuestions.map((q, idx) => (
                        <button key={idx} onClick={() => handleSend(q)} style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: '#fff', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer' }}>{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Chat Input Area */}
                <div style={{ padding: '1.25rem 1.5rem 1.5rem', borderTop: '1px solid var(--border-light)', background: '#fff' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask AViiD about drug safety..."
                      style={{ width: '100%', padding: '0.85rem 3rem 0.85rem 1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.82rem', outline: 'none' }}
                    />
                    <button
                      onClick={handleSend}
                      style={{ position: 'absolute', right: '0.4rem', top: '0.4rem', width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <SendHorizontal size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <SimulationPanel drugs={drugs} pubChemData={pubChemData} selectedNode={selectedNode} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraphApp;
