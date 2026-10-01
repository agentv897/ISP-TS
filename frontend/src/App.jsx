import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomePage from './pages/HomePage';
import DataExtractionApp from './modules/data-extraction/DataExtractionApp';
import ToxicityApp from './modules/toxicity/ToxicityApp';
import KnowledgeGraphApp from './modules/knowledge-graph/KnowledgeGraphApp';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function App() {
  const location = useLocation();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ minHeight: '100%' }}
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/data-extraction" element={<DataExtractionApp />} />
                <Route path="/toxicity-prediction" element={<ToxicityApp />} />
                <Route path="/knowledge-graph" element={<KnowledgeGraphApp />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
