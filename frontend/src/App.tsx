import React, { useState, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import SterilizationWizard from './components/SterilizationWizard';
import ProcessList from './components/ProcessList';
import { SterilizationProcess } from './types';
import { getProcesses } from './api/client';

type View = 'dashboard' | 'wizard' | 'history';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [historyProcesses, setHistoryProcesses] = useState<SterilizationProcess[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleNewProcess = useCallback(() => {
    setView('wizard');
  }, []);

  const handleWizardComplete = useCallback((_process: SterilizationProcess) => {
    setView('dashboard');
  }, []);

  const handleWizardCancel = useCallback(() => {
    setView('dashboard');
  }, []);

  const handleHistoryTab = useCallback(async () => {
    setView('history');
    setHistoryLoading(true);
    try {
      const procs = await getProcesses();
      setHistoryProcesses(procs);
    } catch {
      setHistoryProcesses([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            SterilGuard Pro
            <span className="app-logo-badge">Sanepid</span>
          </div>
          <nav className="app-nav">
            <button
              className={`app-nav-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
              type="button"
            >
              Panel Glowny
            </button>
            <button
              className={`app-nav-btn ${view === 'wizard' ? 'active' : ''}`}
              onClick={handleNewProcess}
              type="button"
            >
              Nowy Proces
            </button>
            <button
              className={`app-nav-btn ${view === 'history' ? 'active' : ''}`}
              onClick={handleHistoryTab}
              type="button"
            >
              Historia
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {view === 'dashboard' && (
          <Dashboard onNewProcess={handleNewProcess} />
        )}

        {view === 'wizard' && (
          <SterilizationWizard
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}

        {view === 'history' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24
              }}
            >
              <h1
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 800,
                  color: 'var(--color-primary)'
                }}
              >
                Historia procesow sterylizacji
              </h1>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleHistoryTab}
                type="button"
              >
                Odswiez
              </button>
            </div>
            <div className="card">
              <ProcessList
                processes={historyProcesses}
                loading={historyLoading}
              />
            </div>
            <div
              style={{
                marginTop: 20,
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: 'var(--radius)',
                fontSize: 13,
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)'
              }}
            >
              Dokumentacja sterylizacji jest archiwizowana przez <strong>10 lat</strong> zgodnie
              z wymogami Sanepidu. Zamrozone procesy posiadaja hash integralnosci SHA-256
              uniemozliwiajacy modyfikacje.
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
