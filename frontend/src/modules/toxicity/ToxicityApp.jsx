import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SingleView from './components/SingleView';
import ComparisonView from './components/ComparisonView';
import { 
  Search, 
  Microscope, 
  Beaker, 
  ShieldCheck, 
  Binary, 
  Cpu, 
  Activity,
  AlertCircle
} from 'lucide-react';

/* ─── Error Boundary ─── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Rendering crash caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 border border-red-200 rounded-3xl text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-red-800 mb-2">Rendering Error</h2>
          <p className="text-sm text-red-600 font-medium mb-4">
            {this.state.error?.message || 'An unexpected error occurred while rendering the results.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-red-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-red-700 transition-all"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ToxicityApp = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [drugs, setDrugs] = useState([]);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('Initializing Scanner...');

  useEffect(() => {
    axios.get('/api/kg/drugs')
      .then((r) => setDrugs(r.data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch((e) => console.warn('Drug list unavailable:', e.message));
  }, []);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setStatusLabel('Initializing Scanner...');
      return;
    }

    const intervals = [
      { p: 15, l: 'Calibrating Molecular Framework...' },
      { p: 35, l: 'Scanning Hepatic Biological Targets...' },
      { p: 55, l: 'Extracting Posterior Probabilities...' },
      { p: 75, l: 'Generating Safety Tiers...' },
      { p: 92, l: 'Finalizing Clinical Dossier...' }
    ];

    let currentStep = 0;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const next = prev + Math.floor(Math.random() * 5) + 2;
        
        // Update label based on progress
        if (currentStep < intervals.length && next >= intervals[currentStep].p) {
          setStatusLabel(intervals[currentStep].l);
          currentStep++;
        }
        
        return next > 95 ? 95 : next;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [loading]);

  const validateInput = (input) => {
    if (!input || input.trim().length < 2) return "Please enter a valid drug name or SMILES string.";
    const isSmiles = /^[A-Za-z0-9#\(\)\+=\-\[\]\.\\/\\@]+$/.test(input) && (input.includes('=') || input.includes('(') || input.includes('#') || input.split('').some(c => 'cnops'.includes(c.toLowerCase())));
    if (!isSmiles && input.length < 3 && !/^[A-Za-z]+$/.test(input)) return "Input is too short to be a valid drug name.";
    return null;
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    
    let input = searchQuery;
    if (activeTab === 'multi' && selectedDrugs.length > 0) {
      input = selectedDrugs.join(', ');
    }

    if (!input) return;

    setLoading(true);
    setError(null);
    const validationError = validateInput(input);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 15000; // 15 seconds between retries

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          setStatusLabel(`Engine initializing... Retry ${attempt}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, RETRY_DELAY));
        }
        const response = await axios.post('/api/tox/analyze', {
          input,
          mode: activeTab === 'single' ? 'single' : 'multi'
        }, { timeout: 600000 }); // 10 minute timeout
        const data = response.data;
        
        if (data.type === 'comparison' && activeTab === 'single') {
          setActiveTab('multi');
        } else if (data.Name && activeTab === 'multi') {
          setActiveTab('single');
        }
        
        setResults(data);
        break; // Success — exit retry loop
      } catch (error) {
        console.error(`Analysis attempt ${attempt} failed:`, error);
        const is503 = error.response && error.response.status === 503;

        if (is503 && attempt < MAX_RETRIES) {
          // Backend still initializing — retry automatically
          continue;
        }

        if (error.response && error.response.data && error.response.data.detail) {
          setError(error.response.data.detail);
        } else if (error.code === 'ECONNABORTED') {
          setError("Request timed out. The analysis took longer than expected. Please try again.");
        } else {
          setError("Molecular analysis failed. Please verify that the Toxicity backend is running.");
        }
        break; // Non-retryable error — exit loop
      }
    }
    // Always stop loading after all attempts
    setLoading(false);
  };

  const addDrugToSelection = (drugName) => {
    if (!drugName) return;
    if (activeTab === 'single') {
      setSearchQuery(drugName);
    } else {
      if (!selectedDrugs.includes(drugName)) {
        setSelectedDrugs([...selectedDrugs, drugName]);
      }
    }
  };

  const removeDrugFromSelection = (drugName) => {
    setSelectedDrugs(selectedDrugs.filter(d => d !== drugName));
  };

  const cn = (...inputs) => inputs.filter(Boolean).join(' ');

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 antialiased">
      <div className="bg-white min-h-screen">
        {/* Navigation Tabs */}
        <div className="flex max-w-6xl mx-auto border-b border-slate-100 mb-8 pt-4">
          <button 
            onClick={() => setActiveTab('single')}
            aria-label="Switch to Single Compound Tab"
            className={cn(
              "flex-1 py-4 text-center font-black text-[12px] uppercase tracking-widest transition-all border-b-2 outline-none",
              activeTab === 'single' 
                ? "text-blue-600 border-blue-600 bg-blue-50/30" 
                : "text-slate-400 hover:text-slate-600 border-transparent"
            )}
          >
            Single Compound Intelligence
          </button>
          <button 
            onClick={() => setActiveTab('multi')}
            aria-label="Switch to Multi Compound Tab"
            className={cn(
              "flex-1 py-4 text-center font-black text-[12px] uppercase tracking-widest transition-all border-b-2 outline-none",
              activeTab === 'multi' 
                ? "text-pink-600 border-pink-600 bg-pink-50/30" 
                : "text-slate-400 hover:text-slate-600 border-transparent"
            )}
          >
            Comparative Safety Dossier
          </button>
        </div>

        {/* Workspace */}
        <main className="max-w-6xl mx-auto px-8 pb-20 mt-10">
          {/* Input Panel */}
          <div className="mb-10 px-6 py-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <div className="border-b border-slate-200/60 pb-2 mb-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] flex items-center gap-2">
                   <Microscope size={12} className="text-blue-500" />
                   {activeTab === 'single' ? "Clinical Compound Intelligence" : "Comparative Clinical Safety Dossier"}
                 </span>
              </div>
             
             <form onSubmit={handleAnalyze} className="mt-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Focused Drug</span>
                  </div>
                   <select
                    className="w-full bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-slate-800 font-medium text-[13px] focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer transition-all hover:bg-slate-50"
                    onChange={(e) => addDrugToSelection(e.target.value)}
                    value={activeTab === 'single' ? searchQuery : ''}
                  >
                    <option value="">{activeTab === 'single' ? '-- Choose from Master List --' : '-- Add Drug to Comparison --'}</option>
                    {drugs.map((drug) => (
                      <option key={drug.id} value={drug.name}>
                        {drug.name}
                      </option>
                    ))}
                  </select>
                </div>

                {activeTab === 'multi' && selectedDrugs.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Comparison Group</span>
                      <button 
                        type="button"
                        onClick={() => setSelectedDrugs([])}
                        className="text-[9px] font-bold text-pink-500 hover:text-pink-700 uppercase"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {selectedDrugs.map(drug => (
                         <div key={drug} className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-full border border-pink-100 text-[11px] font-bold animate-in zoom-in-50">
                           {drug}
                           <button type="button" onClick={() => removeDrugFromSelection(drug)} className="hover:text-pink-900 transition-colors">
                             ✕
                           </button>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {activeTab === 'single' ? (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                     <input 
                       type="text" 
                       placeholder="Enter Clinical Drug Name (e.g. Aspirin, Tylenol, Belinostat) or SMILES" 
                       className="flex-1 bg-transparent border-none text-slate-800 placeholder-slate-300 font-mono text-[13px] focus:ring-0 outline-none"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       aria-label="Compound search input"
                     />
                     <button aria-label="Analyze" className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center shrink-0">
                        <span className="mr-2">Analyze Compound</span>
                        <Search size={16} />
                     </button>
                  </div>
                ) : (
                  <>
                    <textarea 
                      placeholder="Enter Multiple Clinical Drug Names (e.g. Aspirin, Caffeine, Belinostat, Ibuprofen)..." 
                      className="w-full h-32 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-slate-800 placeholder-slate-300 font-mono text-[13px] focus:ring-4 focus:ring-pink-50 focus:border-pink-300 transition-all outline-none resize-none mb-4"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-pink-200 flex items-center justify-center">
                       <span className="mr-2">Generate Comparative Safety Dossier</span>
                       <Binary size={18} />
                    </button>
                  </>
                )}
             </form>

             {/* Error Banner */}
             {error && (
               <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                 <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                   <AlertCircle size={20} />
                 </div>
                 <div className="flex-1">
                   <h3 className="text-sm font-black text-red-900 uppercase tracking-tight">System Message</h3>
                   <p className="text-xs text-red-600 font-medium">{error}</p>
                 </div>
                 <button 
                   onClick={() => setError(null)}
                   className="text-red-400 hover:text-red-600 transition-colors p-2"
                 >
                   ✕
                 </button>
               </div>
             )}
          </div>

          {/* Results Area */}
          <div id="results-area" className="animate-fade-in relative min-h-[400px]">
             {loading ? (
               <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center rounded-3xl p-12 overflow-hidden" aria-busy="true">
                 {/* Premium Scanner Effect */}
                 <div className="relative w-full max-w-md">
                    <div className="flex justify-between items-end mb-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Clinical Engine Active</span>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{statusLabel}</h2>
                          <div className="flex items-center gap-2 mt-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg w-fit border border-slate-200">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[11px] font-bold">Estimated Wait: ~3-4 Minutes (Heavy GNN Inference)</span>
                          </div>
                       </div>
                       <span className="text-4xl font-mono font-black text-blue-600 tabular-nums">{progress}%</span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
                       <div 
                         className="h-full bg-blue-600 transition-all duration-500 ease-out relative"
                         style={{ width: `${progress}%` }}
                       >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                       </div>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-3 gap-4">
                       {[
                         { icon: <Activity size={14}/>, label: 'Target Affinity' },
                         { icon: <ShieldCheck size={14}/>, label: 'Safety Profile' },
                         { icon: <Binary size={14}/>, label: 'Inference' }
                       ].map((item, i) => (
                         <div key={i} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-500 ${progress > (i+1)*30 ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                            {item.icon}
                            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <p className="mt-12 text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em] animate-pulse">
                   Synthesizing Posterior Clinical Evidence
                 </p>
               </div>
             ) : results ? (
              <ErrorBoundary key={JSON.stringify(results?.Name || results?.type || 'r')}>
                {activeTab === 'multi' || results.type === 'comparison' ? (
                  <ComparisonView data={(() => {
                    const reports = Array.isArray(results.reports) ? results.reports : (results.Name ? [results] : []);
                    const summary = results.summary || { overview: 'Comparative analysis complete.' };
                    return { ...results, reports, summary };
                  })()} />
                ) : (
                  <SingleView report={results.reports ? results.reports[0] : results} />
                )}
              </ErrorBoundary>
            ) : (
              <div className="flex items-center justify-center py-40 opacity-20 filter grayscale">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔬</div>
                  <p className="font-black uppercase tracking-widest text-[11px]">Ready for clinical inference</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ToxicityApp;
