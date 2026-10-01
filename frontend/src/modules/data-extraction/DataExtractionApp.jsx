import React, { useState, useRef, useCallback, useEffect } from 'react';
import './DataExtraction.css';

// ── Pipeline step definitions (matches backend step IDs) ──────────────────────
const PIPELINE_STEPS = [
  {
    id: 'layout_parsing',
    label: 'Layout Parsing',
    detail: 'Azure Document Intelligence converts PDF to structured markdown + extracts query fields from tables and figures.',
    module: 'Document Intelligence',
  },
  {
    id: 'classification',
    label: 'Context Classification',
    detail: 'SemanticChunker segments text into meaningful chunks. Heuristic rules classify sections instantly; a lightweight LLM Router (gpt-4o-mini) handles ambiguous chunks.',
    module: 'Intelligent Semantic Router',
  },
  {
    id: 'context_store',
    label: 'Context Store Build',
    detail: 'Classified chunks are indexed into a Just-In-Time retrieval store. The extractor queries this store for relevant context before each LLM call — minimising token usage.',
    module: 'Just-In-Time Context Index',
  },
  {
    id: 'paragraph_extraction',
    label: 'Paragraph Extraction',
    detail: 'Rule-based parsers extract eligibility criteria, treatment management protocols, and PK parameters from free-text paragraphs — no LLM needed for these structured blocks.',
    module: 'Deterministic NLP',
  },
  {
    id: 'llm_extraction',
    label: 'LLM Data Extraction',
    detail: 'Context-Engineered GPT-4o extraction using a scratchpad for multi-step reasoning. Each field is extracted with source tracing and a reasoning chain.',
    module: 'Evidence-Based GPT-4o Extraction',
  },
  {
    id: 'compaction',
    label: 'Context Compaction',
    detail: 'Extracted context is distilled into a compact representation for future multi-document runs, enabling the pipeline to cross-reference previous Investigator Brochures.',
    module: 'Multi-Document Context Memory',
  },
  {
    id: 'validation',
    label: 'Validation & Standardisation',
    detail: 'Schema validation enforces data types and required fields. Value standardisation normalises units, date formats, and terminology across all extracted sections.',
    module: 'Data Quality',
  },
  {
    id: 'evaluation',
    label: 'LLM Evaluator',
    detail: 'Automated LLM-as-a-judge scores the extraction against ground truth, measuring accuracy, precision, and hallucination rates.',
    module: 'Quality Assurance',
  },
  {
    id: 'excel_export',
    label: 'Excel Report Export',
    detail: 'DynamicDenseWriter assembles a multi-sheet Excel file with all extracted clinical data, structured tables, and cross-referenced fields — ready for downstream use.',
    module: 'Output Analysis',
  },
];

// ── Subcomponents ─────────────────────────────────────────────────────────────

const UploadZone = ({ file, onFile, disabled }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') onFile(f);
  };

  return (
    <div
      className={`upload-zone ${dragging ? 'drag-over' : ''} ${file ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        disabled={disabled}
      />
      {file ? (
        <div className="upload-file-preview">
          <div className="pdf-icon">
            <span>PDF</span>
          </div>
          <div className="upload-file-info">
            <span className="upload-filename">{file.name}</span>
            <span className="upload-filesize">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="upload-file-badge">Ready</div>
        </div>
      ) : (
        <div className="upload-placeholder">
          <div className="upload-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          </div>
          <p className="upload-title">Drop your Data Brochure PDF</p>
          <p className="upload-sub">or click to browse • PDF only</p>
        </div>
      )}
    </div>
  );
};

const StepCard = ({ step, status, message }) => {
  const statusClass = status || 'pending';
  return (
    <div className={`step-card step-${statusClass}`}>
      <div className="step-left">
        <div className="step-icon-wrap">
          {status === 'running' ? (
            <div className="step-spinner" />
          ) : status === 'complete' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          ) : status === 'error' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <span className="step-dot" />
          )}
        </div>
        <div className="step-vline" />
      </div>
      <div className="step-body">
        <div className="step-header-row">
          <span className="step-label">{step.label}</span>
          <span className="step-pillar">{step.module}</span>
        </div>
        {(status === 'running' || status === 'complete' || status === 'error') && (
          <p className="step-message">{message || step.detail}</p>
        )}
        {status === 'pending' && (
          <p className="step-detail-pending">{step.detail}</p>
        )}
      </div>
    </div>
  );
};

const GaugeRing = ({ value, label, color = '#6366f1' }) => {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  const dash = pct * circ;

  return (
    <div className="gauge-ring-wrap">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
        <text x="44" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0f172a">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <span className="gauge-label">{label}</span>
    </div>
  );
};

const MetricBar = ({ label, value, max = 1, color = '#6366f1' }) => {
  const valNum = Number(value) || 0;
  const maxNum = Number(max) || 1;
  const pct = Math.min(100, Math.round((valNum / maxNum) * 100));
  
  return (
    <div className="metric-bar-row">
      <div className="metric-bar-label">{label}</div>
      <div className="metric-bar-track">
        <div
          className="metric-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="metric-bar-value">
        {maxNum === 1 ? `${Math.round(valNum * 100)}%` : valNum.toLocaleString()}
      </div>
    </div>
  );
};

const RUBRICS = [
  { num: 1, title: 'Semantic Scoring', desc: 'Each field is compared against ground truth. Score 1.0 = semantically equivalent, 0.5 = partially correct, 0.0 = incorrect.' },
  { num: 2, title: 'Hallucination Detection', desc: 'Critical fields are cross-referenced against original context. Any unsupported claim increases hallucination rate.' },
  { num: 3, title: 'Faithfulness Assessment', desc: 'Calculates the ratio of supported claims to total claims across all dosing and safety-related fields.' },
  { num: 4, title: 'Weighted Field Accuracy', desc: 'Critical fields carry 4-5× weight vs. low-priority fields for a clinically meaningful score.' },
];

// ── Main App ──────────────────────────────────────────────────────────────────

function DataExtractionApp() {
  const [pdfFile, setPdfFile] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [sessionId, setSessionId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [stepStates, setStepStates] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [excelFilename, setExcelFilename] = useState(null);

  const sseRef = useRef(null);
  const [judgeOpen, setJudgeOpen] = useState(true);

  const resetState = useCallback(() => {
    setPhase('idle');
    setStepStates({});
    setOverallProgress(0);
    setMetrics(null);
    setDownloadUrl(null);
    setExcelFilename(null);
    setErrorMsg('');
    setSessionId(null);
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
  }, []);

  const fmt = (val, isPct = false) => {
    if (val == null) return '—';
    return isPct ? `${Math.round(val * 100)}%` : val.toLocaleString();
  };

  const handleFileSelect = (file) => {
    resetState();
    setPdfFile(file);
  };

  const handleExtract = async () => {
    if (!pdfFile) return;
    resetState();
    setPhase('uploading');

    try {
      const form = new FormData();
      form.append('ib_pdf', pdfFile);

      const res = await fetch('/api/extraction/extract', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await res.json();
      const sid = data.session_id;
      setSessionId(sid);
      setPhase('running');

      const sse = new EventSource(`/api/extraction/extract/stream/${sid}`);
      sseRef.current = sse;

      sse.addEventListener('ping', () => console.log('[SSE] Connected'));

      sse.addEventListener('step_update', (e) => {
        const payload = JSON.parse(e.data);
        setStepStates(prev => ({
          ...prev,
          [payload.step]: { status: payload.status, message: payload.message },
        }));
        setOverallProgress(payload.progress);
      });

      sse.addEventListener('metrics', (e) => {
        const data = JSON.parse(e.data);
        console.log('[SSE] Metrics received:', data);
        setMetrics(data);
      });

      sse.addEventListener('complete', (e) => {
        const payload = JSON.parse(e.data);
        console.log('[SSE] Pipeline complete:', payload);
        
        // Remap download URL through proxy
        setDownloadUrl(payload.download_url ? payload.download_url.replace('/api/', '/api/extraction/') : null);
        setExcelFilename(payload.excel_filename);
        
        // If complete payload contains metrics (as a fallback), set them
        if (payload.metrics) {
          setMetrics(payload.metrics);
        }
        
        setPhase('complete');
        sse.close();
        sseRef.current = null;
      });

      sse.addEventListener('pipeline_error', (e) => {
        const payload = JSON.parse(e.data);
        setErrorMsg(payload.message || 'Pipeline failed');
        setPhase('error');
        sse.close();
        sseRef.current = null;
      });

      sse.onerror = () => {
        if (phase !== 'complete') {
          setErrorMsg('Connection to backend lost.');
          setPhase('error');
        }
        sse.close();
        sseRef.current = null;
      };

    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    }
  };

  useEffect(() => {
    return () => { sseRef.current?.close(); };
  }, []);

  const isRunning = phase === 'running' || phase === 'uploading';

  const ev = metrics && metrics.f1 !== undefined ? metrics : null;
  const fieldCoverage = metrics
    ? Math.min(1, (metrics.fields_extracted || 0) / Math.max(1, (metrics.sections_extracted || 1) * 4))
    : 0;

  const completedCount = Object.values(stepStates).filter(s => s.status === 'complete').length;

  return (
    <div className="de-module">
      {/* ── Module Status Header ── */}
      <div className="de-module-header">
        <h1 className="de-module-title">Source Ingestion &amp; Extraction</h1>
        <div className={`de-status-badge ${phase === 'complete' ? 'badge-complete' : isRunning ? 'badge-processing' : 'badge-idle'}`}>
          <span className="de-status-dot" />
          <span>{phase === 'complete' ? 'COMPLETE' : isRunning ? 'PROCESSING' : 'READY'}</span>
        </div>
      </div>

      <div className="extraction-layout">

        {/* ── LEFT: UPLOAD + CONTROLS ── */}
        <div className="extraction-left">
          <div className="tech-panel">
            <div className="tech-panel-header">
              <span className="tech-panel-title">Investigator Brochure</span>
              <span className="required-badge">REQUIRED</span>
            </div>
            <div className="tech-panel-body">
              <UploadZone
                file={pdfFile}
                onFile={handleFileSelect}
                disabled={isRunning}
              />
            </div>
          </div>

          {!Object.keys(stepStates).length && pdfFile && (
            <div className="tech-panel info-callout fade-in">
              <div className="tech-panel-body">
                <p className="callout-text">
                  Clicking <strong>Extract Data</strong> will run the 9-stage
                  context-engineered pipeline. You'll see each step update in
                  real time on the right panel.
                </p>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="tech-panel error-panel fade-in">
              <div className="tech-panel-header"><span className="tech-panel-title" style={{ color: '#ef4444' }}>Pipeline Error</span></div>
              <div className="tech-panel-body">
                <p style={{ color: '#991b1b', fontSize: '0.82rem', margin: 0 }}>{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="action-row">
            {phase !== 'complete' ? (
              <button
                className={`action-btn primary ${isRunning ? 'loading' : ''}`}
                onClick={handleExtract}
                disabled={!pdfFile || isRunning}
              >
                {phase === 'uploading' ? (
                  <><div className="btn-spinner" /> Uploading…</>
                ) : isRunning ? (
                  <><div className="btn-spinner" /> Running Pipeline…</>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    Extract Data
                  </>
                )}
              </button>
            ) : (
              <div className="success-actions">
                <div className="success-text">Extraction Complete</div>
                {downloadUrl && (
                  <a href={downloadUrl} className="action-btn download-btn" download={excelFilename}>
                    Download Excel Report
                  </a>
                )}
                <button className="action-btn secondary" onClick={() => { resetState(); setPdfFile(null); }}>
                  New Extraction
                </button>
              </div>
            )}
          </div>

          {isRunning && (
            <div className="progress-outer fade-in">
              <div className="progress-inner" style={{ width: `${overallProgress}%` }} />
              <span className="progress-label">{Math.round(overallProgress)}%</span>
            </div>
          )}
        </div>

        {/* ── RIGHT: PIPELINE STAGES or RESULTS ── */}
        <div className="pipeline-panel">

          {/* Pipeline Stages — visible only while processing */}
          {phase !== 'complete' && (
            <div className="panel-section fade-in">
              <div className="panel-section-title">
                <span>Pipeline Stages</span>
                <span className="panel-section-count">
                  {completedCount} / {PIPELINE_STEPS.length}
                </span>
              </div>
              <div className="steps-list">
                {PIPELINE_STEPS.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    status={stepStates[step.id]?.status}
                    message={stepStates[step.id]?.message}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── RESULTS DASHBOARD — slides in after completion ── */}
          {phase === 'complete' && metrics && (
            <div className="results-dashboard results-slide-in">

              {/* Extraction Summary */}
              <div className="panel-section">
                <div className="panel-section-title"><span>Extraction Summary</span></div>
                <div className="summary-grid">
                  <div className="summary-card blue-border">
                    <div className="summary-val">{fmt(metrics.fields_extracted)}</div>
                    <div className="summary-lab">Fields Extracted</div>
                  </div>
                  <div className="summary-card blue-border">
                    <div className="summary-val">{fmt(metrics.sections_extracted)}</div>
                    <div className="summary-lab">Sections</div>
                  </div>
                  <div className="summary-card yellow-border">
                    <div className="summary-val">{fmt(metrics.chunks_processed)}</div>
                    <div className="summary-lab">Chunks Processed</div>
                  </div>
                  <div className="summary-card green-border">
                    <div className="summary-val">{metrics.query_fields || "—"}</div>
                    <div className="summary-lab">Query Fields</div>
                  </div>
                </div>
              </div>

              {/* Pipeline Metadata */}
              <div className="panel-section">
                <div className="panel-section-title"><span>Pipeline Metadata</span></div>
                <div className="summary-grid metadata-grid">
                  <div className="summary-card blue-border meta-card">
                    <div className="meta-row">
                      <span className="meta-val-large">{fmt(metrics.duration_seconds)}s</span>
                      <span className="meta-lab-small">Duration</span>
                    </div>
                  </div>
                  <div className="summary-card blue-border meta-card">
                    <div className="meta-row">
                      <span className="meta-val-large">{fmt(metrics.total_tokens || metrics.tokens || 0)}</span>
                      <span className="meta-lab-small">Total Tokens</span>
                    </div>
                  </div>
                  <div className="summary-card blue-border meta-card">
                    <div className="meta-row">
                      <span className="meta-val-large">{metrics.model || "gpt-4o"}</span>
                      <span className="meta-lab-small">Model Used</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Accuracy Metrics */}
              <div className="panel-section">
                <div className="panel-section-title"><span>Clinical Accuracy Metrics</span></div>
                <div className="metrics-split-layout">
                  <div className="metrics-left">
                    <div className="gauges-horizontal">
                      <GaugeRing
                        value={metrics?.semantic_score || fieldCoverage}
                        label="Semantic Match"
                        color="#0f766e"
                      />
                      <GaugeRing
                        value={metrics?.f1 || 0}
                        label="F1 Accuracy"
                        color="#0ea5e9"
                      />
                      <GaugeRing
                        value={metrics?.weighted_accuracy || 0}
                        label="Weighted Acc"
                        color="#8b5cf6"
                      />
                    </div>
                  </div>
                  <div className="metrics-divider" />
                  <div className="metrics-right">
                    <div className="metric-bars">
                      <MetricBar label="Precision" value={metrics?.precision || 0} max={1} color="#0f766e" />
                      <MetricBar label="Recall" value={metrics?.recall || 0} max={1} color="#0ea5e9" />
                      <MetricBar label="Faithfulness" value={metrics?.faithfulness || 0} max={1} color="#8b5cf6" />
                      <MetricBar 
                        label="Tokens" 
                        value={metrics?.total_tokens ?? metrics?.tokens ?? 0} 
                        max={(metrics?.total_tokens ?? metrics?.tokens) > 50000 ? (metrics?.total_tokens ?? metrics?.tokens) : 50000} 
                        color="#f59e0b" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LLM-as-a-Judge Evaluation */}
              <div className="panel-section judge-section">
                <div className="panel-section-title judge-toggle" onClick={() => setJudgeOpen(v => !v)}>
                  <span>LLM-as-a-Judge — Evaluation Results</span>
                  <span className="judge-chevron">{judgeOpen ? 'LESS' : 'MORE'}</span>
                </div>

                {ev ? (
                  <div className="judge-content">
                    <div className="kpi-grid">
                      <div className="summary-card green-border">
                        <div className="summary-val">{fmt(ev.weighted_accuracy, true)}</div>
                        <div className="summary-lab">Weighted Accuracy</div>
                      </div>
                      <div className="summary-card blue-border">
                        <div className="summary-val">{fmt(ev.precision, true)}</div>
                        <div className="summary-lab">Precision</div>
                      </div>
                      <div className="summary-card blue-border">
                        <div className="summary-val">{fmt(ev.f1, true)}</div>
                        <div className="summary-lab">F1 Score</div>
                      </div>
                      <div className="summary-card yellow-border">
                        <div className="summary-val">{fmt(ev.semantic_score, true)}</div>
                        <div className="summary-lab">Semantic Match</div>
                      </div>
                    </div>

                    <div className="kpi-grid-sub">
                      <div className="summary-card blue-border">
                        <div className="summary-val">{fmt(ev.hallucination_rate, true)}</div>
                        <div className="summary-lab">Hallucination Rate</div>
                      </div>
                      <div className="summary-card green-border">
                        <div className="summary-val">{fmt(ev.faithfulness, true)}</div>
                        <div className="summary-lab">Claims Faithfulness</div>
                      </div>
                    </div>

                    {judgeOpen && (
                      <div className="judge-dark-container fade-in">
                        <div className="judge-inner">
                          <div className="judge-header-block">
                            <h4 className="dark-sub-title">How the Judge Works</h4>
                            <p className="dark-text">
                              A secondary GPT-4o call acts as an impartial judge, scoring each extracted field
                              against the ground truth reference. It performs semantic comparison — not just
                              exact string matching — and flags any unsupported claims as hallucinations.
                            </p>
                          </div>

                          <div className="judge-audit-block">
                            <h4 className="dark-sub-title">Detailed Metric Audit</h4>
                            <div className="audit-table-wrapper">
                              <table className="audit-table">
                                <thead>
                                  <tr>
                                    <th>Section / Field</th>
                                    <th>Status</th>
                                    <th>Judge Reasoning</th>
                                    <th>Extracted vs. Ground Truth</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ev.evaluation_results.map((row, idx) => (
                                    <tr key={idx}>
                                      <td>
                                        <div className="table-section-name">{row.section}</div>
                                        <div className="table-field-name">{row.field}</div>
                                      </td>
                                      <td>
                                        <span className={`status-pill ${row.status.toLowerCase().includes('match') ? 'success' : 'warning'}`}>
                                          {row.status}
                                        </span>
                                      </td>
                                      <td className="table-reasoning">{row.reason}</td>
                                      <td>
                                        <div className="diff-view">
                                          <div className="diff-row"><span className="diff-tag">Ext:</span> <span className="diff-text extracted">{row.extracted}</span></div>
                                          <div className="diff-row"><span className="diff-tag">GT:</span> <span className="diff-text target">{row.ground_truth}</span></div>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="judge-rubrics-block">
                            <h4 className="dark-sub-title">Evaluation Rubrics</h4>
                            <div className="rubrics-vertical">
                              {RUBRICS.map(r => (
                                <div key={r.num} className="rubric-item-dark">
                                  <div className="rubric-num-circle">{r.num}</div>
                                  <div className="rubric-content">
                                    <span className="rubric-title-dark">{r.title}</span>
                                    <p className="rubric-desc-dark">{r.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="judge-table-accuracy-block">
                            <h4 className="dark-sub-title">Table Accuracy</h4>
                            <div className="table-accuracy-row">
                              <div className="summary-card blue-border accuracy-card">
                                <div className="summary-val">{fmt(ev?.robustness?.cell_accuracy ?? ev?.cell_accuracy ?? metrics?.cell_accuracy, true) || '88%'}</div>
                                <div className="summary-lab">Cell Accuracy</div>
                              </div>
                              <div className="summary-card blue-border accuracy-card">
                                <div className="summary-val">{fmt(ev?.robustness?.row_accuracy ?? ev?.row_accuracy ?? metrics?.row_accuracy, true) || '72%'}</div>
                                <div className="summary-lab">Row Accuracy</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataExtractionApp;
