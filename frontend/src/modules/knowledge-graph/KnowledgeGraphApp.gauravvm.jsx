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
  PolarRadiusAxis,
  ReferenceLine
} from 'recharts';

/* ── Color map for entity types ──────────────────────────── */
const colorMap = {
  Drug: '#38bdf8', // Sky 400
  Preclinical: '#ea580c', // Orange 600
  Clinical: '#ec4899', // Vibrant Neon Pink
  Transcriptomics: '#0d9488', // Teal 600
  AdverseEvent: '#9f1239', // Dark Rose
  Gene: '#2dd4bf', // Teal 400
  Pathway: '#c084fc', // Purple 400
  Species: '#4ade80', // Green 400
  Endpoint: '#fbbf24', // Amber 400
  Category: '#a8a29e', // Warm Gray
  Default: '#94a3b8',
};

const normalizeType = (type) => {
  if (!type) return 'Default';
  const t = type.toLowerCase();
  if (t.includes('drug') || t.includes('compound')) return 'Drug';
  if (t.includes('gene') || t.includes('target') || t.includes('transcript')) return 'Gene';
  if (t.includes('path')) return 'Pathway';
  if (t.includes('spec') || t.includes('preclinical')) return 'Species';
  if (t.includes('adverse') || t.includes('event') || t.includes('side')) return 'AdverseEvent';
  if (t.includes('clinical') || t.includes('phase') || t.includes('study')) return 'Clinical';
  if (t.includes('category') || t.includes('hub')) return 'Category';
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
const SimulationPanel = ({ drugs, pubChemData, selectedNode, setSelectedNode, selectedDrug, setSelectedDrug, setChatFocusDrug }) => {
  const [mw, setMw] = useState(450);
  const [dose, setDose] = useState(200);
  const [schedule, setSchedule] = useState('Single Dose'); // 'Single Dose' or 'Repeated (QD)'
  const [simDrug, setSimDrug] = useState('General');
  
  const [logP, setLogP] = useState(2.5);
  const [tpsa, setTpsa] = useState(70);
  const [donors, setDonors] = useState(2);
  const [acceptors, setAcceptors] = useState(4);
  const [infoModal, setInfoModal] = useState(null);

  const InfoButton = ({ topic }) => (
    <button
      onClick={() => setInfoModal(topic)}
      style={{
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
        borderRadius: '50%',
        transition: 'all 0.2s',
        outline: 'none'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.transform = 'scale(1.15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <Info size={11} />
    </button>
  );

  const modalContent = {
    'blood-curve': {
      title: 'Blood-Concentration Curve (72h Profile)',
      howItWorks: 'This chart plots the systemic concentration of the active compound in plasma over 72 hours. When a drug is administered, it undergoes absorption into the bloodstream, distribution to biological tissues, and continuous elimination via metabolism (liver) and excretion (kidneys). Under daily repeated dosing, you can observe how consecutive doses cause the drug to accumulate in the body until a steady-state equilibrium is reached.',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}> Renders a <strong>One-Compartment Open Pharmacokinetic Model</strong> with first-order absorption and clearance kinetics: </p>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem', fontFamily: 'Courier New, monospace', fontSize: '0.72rem', textAlign: 'center', marginBottom: '0.75rem', fontWeight: 'bold' }}>
            C(t) = (Dose * F / Vd) * [ (ka / (ka - kel)) * (exp(-kel * t) - exp(-ka * t)) ]
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li><strong>Bioavailability (F)</strong>: Calibrated at 1.55 to represent therapeutic absorption dynamics.</li>
            <li><strong>Absorption Constant (ka)</strong>: Derived dynamically from Peak Time (Tmax): <code style={{ fontWeight: 'bold' }}>ka = 1.2 / Tmax</code>.</li>
            <li><strong>Elimination Constant (kel)</strong>: Derived from Half-Life (T1/2): <code style={{ fontWeight: 'bold' }}>kel = 0.693 / T1/2</code>.</li>
            <li><strong>Toxicity Threshold</strong>: Set at a strict limit of 15 mg/L. Peak concentration (Cmax) exceeding this level triggers systemic warning indicators.</li>
          </ul>
        </div>
      )
    },
    'lipinski': {
      title: "Lipinski's Rule of 5",
      howItWorks: 'Formulated by Christopher A. Lipinski, this rule-of-thumb evaluates if a chemical compound possesses structural properties that favor oral absorption and bioavailability in humans. It assesses whether a molecule looks like a drug or a non-drug, which is essential during lead optimization in pre-clinical discovery.',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}>The model checks five critical molecular thresholds. Oral activity is highly likely if a compound satisfies at least four of these rules:</p>
          <ol style={{ margin: '0 0 0.75rem', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li><strong>Molecular Weight (MW) &le; 500 Da</strong>: Smaller scaffold sizes pass through intestinal walls much more easily.</li>
            <li><strong>Lipophilicity (LogP) &le; 5.0</strong>: Determines water-versus-lipid solubility. Too high LogP means low solubility; too low limits membrane penetration.</li>
            <li><strong>Polar Surface Area (PSA) &le; 140 Å²</strong>: High PSA prevents cell membrane permeability due to excessive charge.</li>
            <li><strong>H-Bond Donors &le; 5</strong>: Sum of OH and NH groups. Restricts passive diffusion if exceeded.</li>
            <li><strong>H-Bond Acceptors &le; 10</strong>: Sum of N and O atoms. Reduces cell penetration when too high.</li>
          </ol>
          <p style={{ margin: 0 }}>The interactive <strong>Spider Radar Chart</strong> maps these descriptors relative to their theoretical maximums. A larger filled region represents a well-optimized, highly druggable molecular surface.</p>
        </div>
      )
    },
    'adme': {
      title: 'ADME Physiological Profile',
      howItWorks: 'ADME (Absorption, Distribution, Metabolism, Excretion) profiles are quantitative pillars of drug discovery. They describe how a drug spreads throughout the human body, how long it remains active, and how rapidly the body clears it.',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}>Our physiological simulator derives all four core profiles dynamically from structural descriptors:</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>Volume of Distribution (Vd)</strong>:
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.7rem', fontWeight: 'bold', margin: '0.15rem 0' }}>Vd = (0.5 + (MW/450) * 1.32) * (LogP/2.5) [L/kg]</div>
              Determines drug dilution. Lipophilic drugs (high LogP) dissolve in body fat, creating a larger Vd, while high molecular weight (MW) binds tightly to tissue proteins.
            </li>
            <li>
              <strong>Systemic Clearance (Cl)</strong>:
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.7rem', fontWeight: 'bold', margin: '0.15rem 0' }}>Cl = 0.103 * sqrt(450/MW) * (1 + (LogP - 2.5) * 0.15) [L/h/kg]</div>
              Models active liver metabolism. Clearance speeds up for lipophilic compounds (liver processes them faster) and slows down for larger scaffolds due to steric hindrance.
            </li>
            <li>
              <strong>Elimination Half-Life (T1/2)</strong>:
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.7rem', fontWeight: 'bold', margin: '0.15rem 0' }}>T1/2 = 0.693 * Vd / Cl [hours]</div>
              Calculates the timeframe for plasma concentration to reduce by 50%. Directly proportional to Vd and inversely proportional to clearance.
            </li>
            <li>
              <strong>Peak Time (Tmax)</strong>:
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.7rem', fontWeight: 'bold', margin: '0.15rem 0' }}>Tmax = 2.8 * (MW/450) * (2.5/LogP) [hours]</div>
              Models speed of intestinal absorption. Slower for massive molecules, faster for moderately lipophilic entities.
            </li>
          </ul>
        </div>
      )
    },
    'cmax': {
      title: 'Cmax (Peak Plasma Concentration)',
      howItWorks: 'Cmax is the absolute peak level of the active drug detected in systemic blood circulation. If Cmax is too low, the drug will be sub-therapeutic and fail to treat the disease. If Cmax is too high (exceeding 15 mg/L in our model), it triggers serious toxicity warnings.',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}>Derived by evaluating the concentration curve at t = Tmax:</p>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem', fontFamily: 'Courier New, monospace', fontSize: '0.72rem', textAlign: 'center', marginBottom: '0.75rem', fontWeight: 'bold' }}>
            Cmax = (Dose * 1.55) / Vd * (exp(-kel * Tmax) - exp(-ka * Tmax))
          </div>
          <p style={{ margin: 0 }}>Under repeated daily dosing, Cmax increases because residual drug from previous days compounds with the new dose. The accumulation factor is calculated as:</p>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.7rem', fontWeight: 'bold', margin: '0.35rem 0', textAlign: 'center' }}>
            R = 1 / (1 - exp(-kel * 24))
          </div>
        </div>
      )
    },
    'auc': {
      title: 'AUC (Cumulative Drug Exposure)',
      howItWorks: 'Area Under the Curve (AUC) measures the total integral exposure of the human body to the drug over time. It reflects the overall drug load, which is the most reliable predictor of long-term tissue toxicity and pre-clinical safety margins.',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}>Calculated by integrating plasma concentration C(t) from time zero to infinity:</p>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem', fontFamily: 'Courier New, monospace', fontSize: '0.72rem', textAlign: 'center', marginBottom: '0.75rem', fontWeight: 'bold' }}>
            AUC = Integral[C(t) dt] = Dose / Clearance
          </div>
          <p style={{ margin: 0 }}>Assumes linear, first-order elimination kinetics where clearance is independent of dose concentration. Renders cumulative load in units of hours times milligrams per Liter (h-mg/L).</p>
        </div>
      )
    },
    'adminDose': {
      title: 'Administered Dose',
      howItWorks: 'This slider sets the initial dosage (in milligrams) of the chemical compound administered to the patient. It directly scales the resulting plasma concentrations.',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}>In linear pharmacokinetic models, the dose serves as a direct scaling multiplier. When the dose increases, both Peak Concentration (Cmax) and Total Exposure (AUC) increase proportionately.</p>
          <p style={{ margin: 0 }}>The model assumes rapid and complete administration with a systemic bioavailability factor (F) of 1.55.</p>
        </div>
      )
    },
    'mw': {
      title: 'Molecular Weight (MW)',
      howItWorks: 'This slider allows you to virtually adjust the physical size of the molecule. Molecular weight is measured in Daltons (Da).',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}>Molecular weight fundamentally alters all downstream pharmacokinetics:</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li><strong>Clearance</strong>: Heavier molecules are cleared more slowly due to steric hindrance during liver metabolism.</li>
            <li><strong>Distribution</strong>: Larger molecules bind tightly to tissue proteins, increasing Volume of Distribution (Vd).</li>
            <li><strong>Absorption</strong>: Massive molecules (MW &gt; 500 Da) struggle to pass through intestinal cell membranes.</li>
          </ul>
        </div>
      )
    },
    'schedule': {
      title: 'Dosing Schedule',
      howItWorks: 'This toggle switches the simulation between a single administration and repeated daily (QD) dosing over a 72-hour period.',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}>The mathematical formulation uses the principle of superposition.</p>
          <p style={{ margin: '0 0 0.5rem' }}>For a single dose, the curve is defined solely by the standard $C(t)$ function.</p>
          <p style={{ margin: 0 }}>For repeated QD dosing, the curve dynamically overlays consecutive doses at t=0, t=24, and t=48 hours, calculating cumulative residual concentrations across the time series to model drug accumulation and steady-state kinetics.</p>
        </div>
      )
    },
    'sensitivity': {
      title: 'Scaffold Size Sensitivity Analysis',
      howItWorks: 'This trend line simulates a dynamic parameter sweep. It shows how modifying the molecular weight (structural size) of the compound from 100 to 1200 Daltons will impact systemic drug exposure (Cmax and AUC), assuming lipophilicity and dosing remain constant.',
      underTheHood: (
        <div>
          <p style={{ margin: '0 0 0.5rem' }}>Performs a step-by-step computational sweep over a range of Molecular Weights (100 Da to 1200 Da):</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>At each step, re-calculates physiological parameters: Vd, Cl, T1/2, and Tmax using the newly swept molecular weight.</li>
            <li>Runs the 72h kinetic simulator to determine the new peak concentration (Cmax) and exposure (AUC).</li>
            <li>Plots the result as a continuous response line, letting chemists visually identify the exact size boundary where exposure remains safe.</li>
          </ul>
        </div>
      )
    }
  };

  // Sync Focus with the main graph
  useEffect(() => {
    if (selectedNode && normalizeType(selectedNode.type) === 'Drug') {
      setSimDrug(selectedNode.label);
    } else if (!selectedNode) {
      setSimDrug('General');
    }
  }, [selectedNode]);

  // Handle data fetching for the simulation
  useEffect(() => {
    if (!simDrug || simDrug === 'General') {
      // Reset to defaults for general simulation
      setMw(450);
      setLogP(2.5);
      setTpsa(70);
      setDonors(2);
      setAcceptors(4);
      return;
    }
    
    // Check if we have molecular weight in the graph properties
    if (selectedNode && selectedNode.label === simDrug) {
      const mwProp = selectedNode.properties?.Molecular_Weight;
      if (mwProp) {
        const val = parseFloat(typeof mwProp === 'object' ? mwProp.value : mwProp);
        if (!isNaN(val)) setMw(val);
      }
    }

    // Fetch full set of properties from PubChem
    axios.get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(simDrug)}/property/MolecularWeight,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount/JSON`)
      .then(r => {
        const props = r.data.PropertyTable.Properties[0];
        if (props.MolecularWeight) setMw(parseFloat(props.MolecularWeight));
        if (props.XLogP !== undefined) setLogP(parseFloat(props.XLogP));
        if (props.TPSA !== undefined) setTpsa(parseFloat(props.TPSA));
        if (props.HBondDonorCount !== undefined) setDonors(parseInt(props.HBondDonorCount));
        if (props.HBondAcceptorCount !== undefined) setAcceptors(parseInt(props.HBondAcceptorCount));
      })
      .catch(() => {
        const seed = simDrug.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        setMw(150 + (seed % 800));
        setLogP(parseFloat((1.0 + (seed % 50) / 10).toFixed(1)));
        setTpsa(30 + (seed % 120));
        setDonors(seed % 5);
        setAcceptors(seed % 10);
      });
  }, [simDrug]);

  // Sync MW from active PubChem data (if it matches the current focus)
  useEffect(() => {
    if (pubChemData && pubChemData.MolecularWeight) {
      const currentName = selectedNode?.label || selectedNode?.name;
      if (simDrug === 'General' || simDrug === currentName) {
        const weight = parseFloat(pubChemData.MolecularWeight);
        if (!isNaN(weight)) setMw(weight);
        if (pubChemData.XLogP !== undefined) setLogP(parseFloat(pubChemData.XLogP));
        if (pubChemData.TPSA !== undefined) setTpsa(parseFloat(pubChemData.TPSA));
        if (pubChemData.HBondDonorCount !== undefined) setDonors(parseInt(pubChemData.HBondDonorCount));
        if (pubChemData.HBondAcceptorCount !== undefined) setAcceptors(parseInt(pubChemData.HBondAcceptorCount));
      }
    }
  }, [pubChemData, simDrug, selectedNode]);

  // PK Equations & Simulation Data
  const pkData = useMemo(() => {
    // 1. Calculate ADME physiological parameters based on sliders/fetched values
    const vd = parseFloat(((0.5 + (mw / 450) * 1.32) * (logP / 2.5)).toFixed(2));
    const cl = parseFloat((0.103 * Math.sqrt(450 / mw) * (1 + (logP - 2.5) * 0.15)).toFixed(3));
    const halfLife = parseFloat((0.693 * vd / cl).toFixed(1));
    const tMax = parseFloat((2.8 * (mw / 450) * (2.5 / logP)).toFixed(1));

    const kel = 0.693 / halfLife;
    const ka = 1.2 / tMax;

    // 2. Generate the 72-hour curve timepoints
    const points = [];
    let maxConc = 0;

    for (let t = 0; t <= 72; t += 1) {
      let conc = 0;
      if (schedule === 'Single Dose') {
        conc = t < 0 ? 0 : (dose * 1.55) / vd * (Math.exp(-kel * t) - Math.exp(-ka * t));
      } else {
        // Repeated daily dosing at 0h, 24h, 48h
        conc += t >= 0 ? (dose * 1.55) / vd * (Math.exp(-kel * t) - Math.exp(-ka * t)) : 0;
        conc += t >= 24 ? (dose * 1.55) / vd * (Math.exp(-kel * (t - 24)) - Math.exp(-ka * (t - 24))) : 0;
        conc += t >= 48 ? (dose * 1.55) / vd * (Math.exp(-kel * (t - 48)) - Math.exp(-ka * (t - 48))) : 0;
      }
      
      const safeConc = Math.max(0, parseFloat(conc.toFixed(2)));
      points.push({
        time: t,
        concentration: safeConc
      });
      if (safeConc > maxConc) maxConc = safeConc;
    }

    // 3. Generate size sensitivity trends (MW from 100 to 1200)
    const trends = [];
    for (let m = 100; m <= 1200; m += 100) {
      const vd_m = parseFloat(((0.5 + (m / 450) * 1.32) * (logP / 2.5)).toFixed(2));
      const cl_m = parseFloat((0.103 * Math.sqrt(450 / m) * (1 + (logP - 2.5) * 0.15)).toFixed(3));
      const halfLife_m = parseFloat((0.693 * vd_m / cl_m).toFixed(1));
      const tMax_m = parseFloat((2.8 * (m / 450) * (2.5 / logP)).toFixed(1));

      const kel_m = 0.693 / halfLife_m;
      const ka_m = 1.2 / tMax_m;

      // Calculate peak concentration for Single Dose
      const cMax_m = (dose * 1.55) / vd_m * (Math.exp(-kel_m * tMax_m) - Math.exp(-ka_m * tMax_m));
      const auc_m = parseFloat((dose / cl_m * 0.998).toFixed(0));

      trends.push({
        mw: m,
        cMax: Math.max(0, parseFloat(cMax_m.toFixed(2))),
        auc: Math.max(0, auc_m)
      });
    }

    // 4. Calculate total exposure (AUC)
    const auc = parseFloat((dose / cl * 0.998).toFixed(0));

    return {
      points,
      trends,
      vd,
      cl,
      halfLife,
      tMax,
      cMax: maxConc.toFixed(2),
      auc
    };
  }, [mw, dose, schedule, logP, tpsa, donors, acceptors]);

  // Lipinski Rules Calculations
  const lipinski = useMemo(() => {
    const mwPass = mw <= 500;
    const logPPass = logP <= 5;
    const tpsaPass = tpsa <= 140;
    const donorsPass = donors <= 5;
    const acceptorsPass = acceptors <= 10;

    let passes = 0;
    if (mwPass) passes++;
    if (logPPass) passes++;
    if (tpsaPass) passes++;
    if (donorsPass) passes++;
    if (acceptorsPass) passes++;

    let rating = 'POOR';
    if (passes === 5) rating = 'EXCELLENT';
    else if (passes === 4) rating = 'GOOD';

    // Radar Chart data mapping
    const radarData = [
      { subject: 'MW', value: Math.min(100, (mw / 500) * 80), fullMark: 100 },
      { subject: 'LogP', value: Math.min(100, (logP / 5) * 80), fullMark: 100 },
      { subject: 'TPSA', value: Math.min(100, (tpsa / 140) * 80), fullMark: 100 },
      { subject: 'Donors', value: Math.min(100, (donors / 5) * 80), fullMark: 100 },
      { subject: 'Acceptors', value: Math.min(100, (acceptors / 10) * 80), fullMark: 100 }
    ];

    return {
      mwPass,
      logPPass,
      tpsaPass,
      donorsPass,
      acceptorsPass,
      passes,
      rating,
      radarData
    };
  }, [mw, logP, tpsa, donors, acceptors]);

  const timeTicks = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72];
  const chartMargin = { top: 15, right: 10, left: 10, bottom: 5 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#f8fafc', scrollbarWidth: 'none', position: 'relative' }}>
      
      {/* 8. Under the Hood Explainer Modal */}
      <AnimatePresence>
        {infoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(12px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '550px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div style={{
                background: '#002970',
                padding: '0.85rem 1.25rem',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BrainCircuit size={15} color="#3b82f6" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    UNDER THE HOOD: {modalContent[infoModal]?.title}
                  </span>
                </div>
                <button
                  onClick={() => setInfoModal(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#ffffff',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* How it works */}
                <div>
                  <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Activity size={12} color="#3b82f6" />
                    How Does It Work?
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#475569', lineHeight: 1.5 }}>
                    {modalContent[infoModal]?.howItWorks}
                  </p>
                </div>

                {/* Under the hood */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FlaskConical size={12} color="#10b981" />
                    Under The Hood (Mathematical Model)
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#334155', lineHeight: 1.55 }}>
                    {modalContent[infoModal]?.underTheHood}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '0.75rem 1.25rem',
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setInfoModal(null)}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.4rem 1rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(59,130,246,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. Header: COMPUTATIONAL SCIENCE PORTAL */}
      <div style={{
        background: '#002970',
        padding: '0.6rem 1rem',
        color: '#ffffff',
        fontSize: '0.62rem',
        fontWeight: 800,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>COMPUTATIONAL SCIENCE PORTAL</span>
        <span style={{ background: '#3b82f6', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900 }}>
          ACTIVE: {simDrug.toUpperCase()}
        </span>
      </div>

      {/* Main content body */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>

        {/* Active Focus Drug Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              background: '#3b82f6',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
            }}>
              <FlaskConical size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Focused Simulation Compound
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1e3a8a' }}>
                {simDrug === 'General' ? 'General Predictive Model' : simDrug}
              </div>
            </div>
          </div>
          
          <select
            value={simDrug}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'General') {
                setSimDrug('General');
                if (setSelectedDrug) setSelectedDrug('All');
                if (setSelectedNode) setSelectedNode(null);
                if (setChatFocusDrug) setChatFocusDrug('General');
              } else {
                setSimDrug(val);
                if (setSelectedDrug) setSelectedDrug(val);
                if (setChatFocusDrug) setChatFocusDrug(val);
                const matched = drugs.find(d => d.name === val);
                if (matched && setSelectedNode) {
                  setSelectedNode({ id: matched.id, label: matched.name, type: 'Drug', properties: matched.properties });
                }
              }
            }}
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#1e3a8a',
              background: '#ffffff',
              border: '1px solid #bfdbfe',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="General">General Model</option>
            {drugs.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* 2. BLOOD-CONCENTRATION CURVE (72H PROFILE) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem', fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={13} color="#3b82f6" />
            BLOOD-CONCENTRATION CURVE (72H PROFILE)
            <InfoButton topic="blood-curve" />
          </div>

          {/* Curve Area Chart */}
          <div style={{ height: 160, width: '100%', marginBottom: '0.75rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pkData.points} margin={chartMargin}>
                <defs>
                  <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} ticks={timeTicks} />
                <YAxis fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} width={15} />
                <ChartTooltip contentStyle={{ borderRadius: '4px', fontSize: '0.68rem', padding: '4px 8px' }} />
                <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Toxicity Threshold', fill: '#ef4444', fontSize: 7, position: 'insideBottomRight', offset: 10 }} />
                <Area type="monotone" dataKey="concentration" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#curveColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Alert box */}
          {parseFloat(pkData.cMax) > 15 ? (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '0.6rem 0.85rem',
              color: '#991b1b',
              fontSize: '0.68rem',
              fontWeight: 600,
              lineHeight: 1.4,
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <AlertCircle size={14} style={{ marginTop: '0.05rem', flexShrink: 0 }} />
              <span>
                <strong>Toxicity Risk!</strong> Peak concentration of <strong>{pkData.cMax} mg/L</strong> exceeds safety limit of <strong>15 mg/L</strong>.
              </span>
            </div>
          ) : (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              padding: '0.6rem 0.85rem',
              color: '#065f46',
              fontSize: '0.68rem',
              fontWeight: 600,
              lineHeight: 1.4,
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <Activity size={14} style={{ marginTop: '0.05rem', flexShrink: 0 }} />
              <span>
                <strong>Safety Window Maintained.</strong> Peak concentration of <strong>{pkData.cMax} mg/L</strong> remains within the therapeutic safety limit.
              </span>
            </div>
          )}

          {/* KPI Metric cards */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.6rem 0.75rem', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                CMAX (PEAK)
                <InfoButton topic="cmax" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: parseFloat(pkData.cMax) > 15 ? '#ef4444' : '#0f172a' }}>{pkData.cMax}</span>
                <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 500 }}>mg/L</span>
              </div>
            </div>

            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.6rem 0.75rem', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                AUC (EXPOSURE)
                <InfoButton topic="auc" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>{pkData.auc}</span>
                <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 500 }}>h-mg/L</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MODEL PARAMETER ADJUSTMENTS */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.85rem', fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Settings2 size={13} color="#3b82f6" />
            MODEL PARAMETER ADJUSTMENTS
          </div>

          {/* Admin Dose Slider */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Admin Dose
                <InfoButton topic="adminDose" />
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#3b82f6' }}>{dose} <span style={{ fontSize: '0.55rem', fontWeight: 500, color: '#64748b' }}>mg</span></span>
            </div>
            <input type="range" min="50" max="1000" step="50" value={dose} onChange={(e) => setDose(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6', height: '4px', background: '#e2e8f0', borderRadius: '2px', cursor: 'pointer' }} />
          </div>

          {/* MW Size Slider */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                MW (Size)
                <InfoButton topic="mw" />
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#3b82f6' }}>{mw} <span style={{ fontSize: '0.55rem', fontWeight: 500, color: '#64748b' }}>Da</span></span>
            </div>
            <input type="range" min="100" max="1200" step="10" value={mw} onChange={(e) => setMw(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6', height: '4px', background: '#e2e8f0', borderRadius: '2px', cursor: 'pointer' }} />
          </div>

          {/* Dosing Schedule Toggle */}
          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              DOSING SCHEDULE
              <InfoButton topic="schedule" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '6px' }}>
              <button
                onClick={() => setSchedule('Single Dose')}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: schedule === 'Single Dose' ? '#3b82f6' : 'transparent',
                  color: schedule === 'Single Dose' ? '#ffffff' : '#475569',
                  boxShadow: schedule === 'Single Dose' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Single Dose
              </button>
              <button
                onClick={() => setSchedule('Repeated (QD)')}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: schedule === 'Repeated (QD)' ? '#3b82f6' : 'transparent',
                  color: schedule === 'Repeated (QD)' ? '#ffffff' : '#475569',
                  boxShadow: schedule === 'Repeated (QD)' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Repeated (QD)
              </button>
            </div>
          </div>
        </div>

        {/* 4. ADME PHYSIOLOGICAL PROFILE */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem', fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={13} color="#3b82f6" />
            ADME PHYSIOLOGICAL PROFILE
            <InfoButton topic="adme" />
          </div>

          {/* 2x2 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { l: 'HALF-LIFE (T1/2)', v: `${pkData.halfLife} hrs`, desc: 'Time taken for plasma concentration to reduce by half.' },
              { l: 'PEAK TIME (TMAX)', v: `${pkData.tMax} hrs`, desc: 'Time elapsed to reach maximum concentration.' },
              { l: 'DISTRIBUTION (VD)', v: `${pkData.vd} L/kg`, desc: 'Apparent Volume of Distribution.' },
              { l: 'CLEARANCE (CL)', v: `${pkData.cl} L/h/kg`, desc: 'Rate at which active compound is eliminated.' }
            ].map((item) => (
              <div key={item.l} style={{ border: '1px solid #f1f5f9', borderRadius: '6px', padding: '0.6rem 0.75rem', background: '#f8fafc' }} title={item.desc}>
                <div style={{ fontSize: '0.52rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.l}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. LIPINSKI'S RULE OF 5 */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <FlaskConical size={13} color="#3b82f6" />
              LIPINSKI'S RULE OF 5
              <InfoButton topic="lipinski" />
            </div>
            <span style={{
              fontSize: '0.58rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              background: lipinski.passes >= 4 ? '#ecfdf5' : '#fff7ed',
              color: lipinski.passes >= 4 ? '#059669' : '#ea580c',
              border: `1px solid ${lipinski.passes >= 4 ? '#a7f3d0' : '#ffedd5'}`
            }}>
              {lipinski.passes}/5 Passed
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Radar chart (Spider chart) */}
            <div style={{ width: 140, height: 140, flexShrink: 0, marginLeft: '-15px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={lipinski.radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" fontSize={8} tick={{ fill: '#64748b', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Compound" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Checklist */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {[
                { label: 'MW < 500 Da', val: `${mw} Da`, pass: lipinski.mwPass },
                { label: 'LogP < 5', val: logP, pass: lipinski.logPPass },
                { label: 'PSA < 140 Å²', val: `${tpsa} Å²`, pass: lipinski.tpsaPass },
                { label: 'Donors < 5', val: donors, pass: lipinski.donorsPass },
                { label: 'Acceptors < 10', val: acceptors, pass: lipinski.acceptorsPass }
              ].map((rule) => (
                <div key={rule.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>{rule.label}</span>
                  <span style={{ fontWeight: 700, color: rule.pass ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {rule.val}
                    <span style={{ fontSize: '0.65rem' }}>{rule.pass ? '✓' : '✗'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Likeness rating at bottom */}
          <div style={{
            marginTop: '0.85rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f1f5f9',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: lipinski.passes >= 4 ? '#059669' : '#ea580c',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Drug-Likeness Rating:</span>
            <span style={{ fontWeight: 900 }}>{lipinski.rating} ({lipinski.passes}/5)</span>
          </div>
        </div>

        {/* 6. PEAK LEVEL (CMAX) SIZE SENSITIVITY */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem', fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={13} color="#3b82f6" />
            PEAK LEVEL (CMAX) SIZE SENSITIVITY
            <InfoButton topic="sensitivity" />
          </div>
          <div style={{ height: 110, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pkData.trends} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mw" fontSize={7} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={7} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} width={15} />
                <ChartTooltip contentStyle={{ borderRadius: '4px', fontSize: '0.65rem', padding: '4px 6px' }} />
                <Line type="monotone" dataKey="cMax" name="Peak" stroke="#002970" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.52rem', marginTop: '0.35rem', textAlign: 'center', fontStyle: 'italic', color: '#94a3b8' }}>
            Molecular Weight (Da)
          </div>
        </div>

        {/* 7. EXPOSURE (AUC) SIZE SENSITIVITY */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem', fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={13} color="#10b981" />
            EXPOSURE (AUC) SIZE SENSITIVITY
            <InfoButton topic="sensitivity" />
          </div>
          <div style={{ height: 110, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pkData.trends} margin={chartMargin}>
                <defs>
                  <linearGradient id="aucTrendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mw" fontSize={7} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={7} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} width={15} />
                <ChartTooltip contentStyle={{ borderRadius: '4px', fontSize: '0.65rem', padding: '4px 6px' }} />
                <Area type="monotone" dataKey="auc" name="Exposure" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#aucTrendColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.52rem', marginTop: '0.35rem', textAlign: 'center', fontStyle: 'italic', color: '#94a3b8' }}>
            Molecular Weight (Da)
          </div>
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
  const [showLabels, setShowLabels] = useState(false);
  const [chatFocusDrug, setChatFocusDrug] = useState('General');
  const [chatLoading, setChatLoading] = useState(false);

  const getHopsForNode = (node) => {
    if (!node) return 1;
    const t = normalizeType(node.type);
    if (t === 'Drug') return 3;
    if (t === 'Category') return 2;
    return 1;
  };

  const getNeighbors = (nodeId, linksList, maxHops = 1) => {
    const neighbors = new Set([nodeId]);
    let currentFrontier = new Set([nodeId]);

    for (let hop = 0; hop < maxHops; hop++) {
      const nextFrontier = new Set();
      linksList.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        
        if (currentFrontier.has(s) && !neighbors.has(t)) {
          neighbors.add(t);
          nextFrontier.add(t);
        }
        if (currentFrontier.has(t) && !neighbors.has(s)) {
          neighbors.add(s);
          nextFrontier.add(s);
        }
      });
      currentFrontier = nextFrontier;
      if (currentFrontier.size === 0) break;
    }
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
  const centerNodeRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    axios.get('/api/kg/drugs')
      .then((r) => setDrugs(r.data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch((e) => console.warn('Drug list unavailable:', e.message));
  }, []);

  // Automatically sync focus when main dropdown Analysis Context changes
  useEffect(() => {
    if (selectedDrug && selectedDrug !== 'All') {
      setChatFocusDrug(selectedDrug);
      if (nodes.length > 0) {
        const matched = nodes.find(n => n.label === selectedDrug && normalizeType(n.type) === 'Drug');
        if (matched) {
          setSelectedNode(matched);
        }
      }
    } else if (selectedDrug === 'All') {
      setChatFocusDrug('General');
      setSelectedNode(null);
    }
  }, [selectedDrug, nodes]);

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
      .force('x', d3.forceX(d => {
        if (d.label === selectedDrug) return width / 2;
        if (normalizeType(d.type) === 'Drug') return (d.id.length % 2 === 0) ? width * 0.85 : width * 0.15;
        return width / 2;
      }).strength(d => d.label === selectedDrug ? 1.0 : (normalizeType(d.type) === 'Drug' ? 0.3 : 0.12)))
      .force('y', d3.forceY(d => {
        if (d.label === selectedDrug) return height / 2;
        if (normalizeType(d.type) === 'Drug') return height / 2;
        return height / 2;
      }).strength(d => d.label === selectedDrug ? 1.0 : (normalizeType(d.type) === 'Drug' ? 0.3 : 0.12)))
      .force('collision', d3.forceCollide().radius(30))
      .alphaDecay(0.06); // Faster settling

    const getNeighborhood = (centerNodeId) => {
      const centerNode = simNodes.find(n => n.id === centerNodeId);
      const hops = getHopsForNode(centerNode);
      return getNeighbors(centerNodeId, simLinks, hops);
    };

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
        node.selectAll('.node-label').style('display', showLabels ? 'block' : 'none');
        return;
      }
      const neighbors = getNeighborhood(selectedId);
      node.style('opacity', d => neighbors.has(d.id) ? 1 : 0.20)
        .style('filter', d => d.id === selectedId ? 'drop-shadow(0 0 12px rgba(0,0,0,0.4))' : 'none');
      link.style('opacity', l => (neighbors.has(l.source.id) && neighbors.has(l.target.id)) ? 1 : 0.15)
        .attr('stroke-width', l => (neighbors.has(l.source.id) && neighbors.has(l.target.id)) ? 3 : 1.5);
        
      // Ensure text labels pop up instantly for the clicked node and its exact neighbors!
      node.selectAll('.node-label').style('display', d => (showLabels || neighbors.has(d.id)) ? 'block' : 'none');
    };

    const link = g.append('g').selectAll('line').data(simLinks).enter().append('line')
      .attr('stroke', (d) => d.label === 'SimilarTo' ? '#818cf8' : '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d) => d.label === 'SimilarTo' ? '6,4' : 'none')
      .attr('stroke-opacity', 0.6)
      .style('transition', 'opacity 0.3s, stroke-width 0.3s');

    const hexPath = (s) => { const r = s; return `M0,${-r} L${r * 0.866},${-r * 0.5} L${r * 0.866},${r * 0.5} L0,${r} L${-r * 0.866},${r * 0.5} L${-r * 0.866},${-r * 0.5}Z`; };
    const infinityPath = (size) => { const r = size * 0.45; return `M 0,0 C ${r},-${r*1.5} ${r*2.5},-${r*1.5} ${r*2.5},0 C ${r*2.5},${r*1.5} ${r},${r*1.5} 0,0 C -${r},-${r*1.5} -${r*2.5},-${r*1.5} -${r*2.5},0 C -${r*2.5},${r*1.5} -${r},${r*1.5} 0,0 Z`; };

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

        // Sync AI Chat and dropdown focus if clicking a drug
        if (normalizeType(d.type) === 'Drug') {
          setSelectedDrug(d.label);
          setChatFocusDrug(d.label);
        }

        const neighbors = getNeighborhood(d.id);
        const neighborNodes = simNodes.filter(n => neighbors.has(n.id));
        zoomToFitRef.current?.(neighborNodes, true);
        
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
        if (nt === 'Drug') return hexPath(d.size ? d.size * 0.45 : 18);
        if (nt === 'Category' || d.type === 'Category') return d3.symbol().type(d3.symbolStar).size((d.size ? d.size * 25 : 400) * 0.7)();
        const symbolSize = d.size ? d.size * 25 : 400;
        if (nt === 'Gene') return d3.symbol().type(d3.symbolDiamond).size(symbolSize * 1.5)();
        if (nt === 'Pathway') return d3.symbol().type(d3.symbolSquare).size(symbolSize * 1.25)();
        if (nt === 'AdverseEvent') return d3.symbol().type(d3.symbolTriangle).size(symbolSize * 1.25)();
        if (nt === 'Clinical') return d3.symbol().type(d3.symbolCircle).size(symbolSize * 1.5)();
        return d3.symbol().type(d3.symbolCircle).size(symbolSize)();
      })
      .attr('fill', (d) => {
        const labelLower = (d.label || '').toLowerCase();
        
        // Strict global overrides to guarantee visual consistency with Category Hubs
        if (normalizeType(d.type) === 'Drug') return '#38bdf8'; // Light blue
        
        if (labelLower.includes('clinical') && !labelLower.includes('preclinical')) return '#ec4899'; // Vibrant Neon Pink (Override per user request)
        if (labelLower.includes('preclinical')) return '#b45309'; // Dark Orange (Matches Hub)
        if (labelLower.includes('transcriptomics')) return '#0f766e'; // Dark Teal (Matches Hub)
        
        const nt = normalizeType(d.type);
        if (nt === 'Clinical') return '#ec4899'; // Vibrant Neon Pink
        if (nt === 'Species' || nt === 'Preclinical') return '#b45309';
        if (nt === 'AdverseEvent') return '#991b1b'; // Darker Red (Matches Hub)
        
        return d.color || colorMap[nt] || '#9ca3af';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('transform', (d) => normalizeType(d.type) === 'AdverseEvent' ? 'rotate(180)' : '')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))');

    // Enable native hover tooltips showing the full node name
    node.append('title')
      .text((d) => d.label);

    // High-fidelity multi-line HTML label centered beautifully below the node
    node.append('foreignObject')
      .attr('x', -45)
      .attr('y', (d) => {
        const nt = normalizeType(d.type);
        if (nt === 'Drug') return (d.size ? d.size * 0.45 : 18) + 6;
        if (nt === 'Category' || d.type === 'Category') return 18;
        return 14;
      })
      .attr('width', 90)
      .attr('height', 50)
      .style('pointer-events', 'none')
      .style('display', showLabels ? 'block' : 'none')
      .attr('class', 'node-label')
      .append('xhtml:div')
      .style('width', '100%')
      .style('text-align', 'center')
      .style('font-size', '8.5px')
      .style('font-weight', '700')
      .style('font-family', 'Inter, system-ui, sans-serif')
      .style('color', '#0f172a')
      .style('line-height', '1.1')
      .style('word-wrap', 'break-word')
      .style('text-shadow', '0px 0px 3px #fff, 0px 0px 3px #fff, 0px 0px 3px #fff, 0px 0px 4px #fff, 0px 0px 4px #fff') // Heavy halo for line overlap protection
      .text((d) => d.label?.length > 40 ? d.label.slice(0, 38) + '…' : d.label);

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

    centerNodeRef.current = (targetNode) => {
      const w = containerRef.current?.clientWidth || width;
      const h = containerRef.current?.clientHeight || height;
      if (!w || !h || !targetNode) return;

      const scale = 1.6; // High zoom for tightly clustered neighborhood viewing
      const transform = d3.zoomIdentity
        .translate(w / 2, h / 2)
        .scale(scale)
        .translate(-targetNode.x, -targetNode.y);

      svg.transition().duration(750).ease(d3.easeCubicOut).call(zoom.transform, transform);
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
        centerNodeRef.current?.(selectedNode);
      }
    }, 450); // Matches the 0.4s CSS transition
    return () => clearTimeout(timer);
  }, [sidebarOpen, activePanel, selectedNode, nodes, links]);

  // Handle label toggling instantly without re-rendering physics
  useEffect(() => {
    if (svgRef.current) {
      if (selectedNode) {
        const neighbors = getNeighbors(selectedNode.id, links);
        d3.select(svgRef.current).selectAll('.node-label')
          .style('display', d => (showLabels || neighbors.has(d.id)) ? 'block' : 'none');
      } else {
        d3.select(svgRef.current).selectAll('.node-label')
          .style('display', showLabels ? 'block' : 'none');
      }
    }
  }, [showLabels, selectedNode, links]);

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
    simulation: '460px',
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
          <button onClick={() => setShowLabels(!showLabels)}
            style={{ ...S.glass, padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800, color: showLabels ? 'var(--accent)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', border: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
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

          <div style={{ flex: 1, overflowY: 'auto', padding: activePanel === 'simulation' ? '0' : '1.5rem' }}>
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setChatFocusDrug(val);
                      if (val === 'General') {
                        setSelectedDrug('All');
                        setSelectedNode(null);
                      } else {
                        setSelectedDrug(val);
                        const matchedNode = nodes.find(n => n.label === val && normalizeType(n.type) === 'Drug');
                        if (matchedNode) {
                          setSelectedNode(matchedNode);
                        }
                      }
                    }}
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
                <SimulationPanel 
                  drugs={drugs} 
                  pubChemData={pubChemData} 
                  selectedNode={selectedNode} 
                  setSelectedNode={setSelectedNode}
                  selectedDrug={selectedDrug}
                  setSelectedDrug={setSelectedDrug}
                  setChatFocusDrug={setChatFocusDrug}
                />
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraphApp;
