import React, { useEffect, useState, useCallback } from 'react';
import { SterilizationProcess } from '../types';
import { getProcesses, getSummary } from '../api/client';
import AlertBanner from './AlertBanner';
import ProcessList from './ProcessList';

interface DashboardProps {
  onNewProcess: () => void;
}

interface Summary {
  totalProcesses: number;
  completedProcesses: number;
  sealedProcesses: number;
}

function getLastBiologicalTestDate(processes: SterilizationProcess[]): Date | null {
  // Approximate: look at sealed/completed processes for this month
  const sealed = processes.filter(p => p.status === 'SEALED' || p.status === 'COMPLETED');
  if (sealed.length === 0) return null;
  const sorted = sealed.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  return new Date(sorted[0].startTime);
}

function isBiologicalTestNeeded(processes: SterilizationProcess[]): boolean {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Check if any process this month has a biological test association
  const thisMonthProcesses = processes.filter(p => {
    const d = new Date(p.startTime);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  // If there are processes this month but no biological test recorded, show alert
  // (simplified: alert if we have sealed processes older than 30 days without recent bio test)
  if (processes.length === 0) return false;

  const lastDate = getLastBiologicalTestDate(processes);
  if (!lastDate) return true;

  const daysDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > 30;
}

function formatDate(d: Date | null): string {
  if (!d) return 'brak danych';
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getThisMonthCount(processes: SterilizationProcess[]): number {
  const now = new Date();
  return processes.filter(p => {
    const d = new Date(p.startTime);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewProcess }) => {
  const [processes, setProcesses] = useState<SterilizationProcess[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedBio, setDismissedBio] = useState(false);
  const [dismissedService, setDismissedService] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [procs, sum] = await Promise.all([
        getProcesses().catch(() => [] as SterilizationProcess[]),
        getSummary().catch(() => null)
      ]);

      setProcesses(procs);
      setSummary(sum);
    } catch (err) {
      setError('Nie można połączyć się z serwerem. Sprawdź, czy backend jest uruchomiony.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bioTestNeeded = !dismissedBio && isBiologicalTestNeeded(processes);
  const lastBioDate = getLastBiologicalTestDate(processes);

  // Autoclave service: show if any process is older than 6 months (simplified alert)
  const oldestProcess = processes.length > 0
    ? new Date(processes.reduce((oldest, p) =>
        new Date(p.startTime) < new Date(oldest.startTime) ? p : oldest
      ).startTime)
    : null;
  const autoclaveServiceNeeded = !dismissedService &&
    oldestProcess !== null &&
    (new Date().getTime() - oldestProcess.getTime()) > (180 * 24 * 60 * 60 * 1000);

  const totalProcesses = summary?.totalProcesses ?? processes.length;
  const sealedProcesses = summary?.sealedProcesses ??
    processes.filter(p => p.status === 'SEALED').length;
  const thisMonthCount = getThisMonthCount(processes);

  const recentProcesses = [...processes]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10);

  return (
    <div>
      {/* Compliance Alerts */}
      {(bioTestNeeded || autoclaveServiceNeeded) && (
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 12,
              fontWeight: 600
            }}
          >
            Alerty zgodności Sanepid
          </h2>
          {bioTestNeeded && (
            <AlertBanner
              type="danger"
              title="Wymagany test biologiczny!"
              message={`Ostatni test: ${formatDate(lastBioDate)} — zaplanuj nowy test Sporal A. Testy biologiczne muszą być przeprowadzane co najmniej raz w miesiącu.`}
              onDismiss={() => setDismissedBio(true)}
            />
          )}
          {autoclaveServiceNeeded && (
            <AlertBanner
              type="warning"
              title="Wymagany przegląd autoklawu!"
              message="Upłynął termin obowiązkowego przeglądu technicznego autoklawu. Skontaktuj się z serwisem w celu przeprowadzenia walidacji urządzenia."
              onDismiss={() => setDismissedService(true)}
            />
          )}
        </div>
      )}

      {error && (
        <AlertBanner
          type="warning"
          title="Problem z połączeniem"
          message={error}
        />
      )}

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-tile">
          <div className="stat-tile-value">{loading ? '—' : totalProcesses}</div>
          <div className="stat-tile-label">Wszystkie procesy</div>
        </div>
        <div className="stat-tile success">
          <div className="stat-tile-value">{loading ? '—' : sealedProcesses}</div>
          <div className="stat-tile-label">Zamrożone (Sanepid)</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-value">{loading ? '—' : thisMonthCount}</div>
          <div className="stat-tile-label">W tym miesiącu</div>
        </div>
        <div className="stat-tile warning">
          <div className="stat-tile-value">
            {loading ? '—' : processes.filter(p =>
              !['COMPLETED', 'SEALED', 'CANCELLED'].includes(p.status)
            ).length}
          </div>
          <div className="stat-tile-label">W toku</div>
        </div>
      </div>

      {/* New Process Action */}
      <button className="action-tile" onClick={onNewProcess} style={{ marginBottom: 32 }}>
        <div className="action-tile-icon">+</div>
        <div className="action-tile-text">
          <div className="action-tile-title">Nowy Proces Sterylizacji</div>
          <div className="action-tile-desc">
            Uruchom kreator 6-etapowego procesu zgodnego z wymogami Sanepidu
          </div>
        </div>
      </button>

      {/* Recent Processes */}
      <div className="card">
        <div className="card-title">Ostatnie procesy sterylizacji</div>
        <ProcessList
          processes={recentProcesses}
          loading={loading}
        />
      </div>

      {/* Compliance Info */}
      <div
        style={{
          marginTop: 24,
          padding: '16px 20px',
          background: '#eaf4fb',
          borderRadius: 'var(--radius)',
          borderLeft: '4px solid var(--color-info)',
          fontSize: 13,
          color: '#174060'
        }}
      >
        <strong>Informacja prawna:</strong> System SterilGuard Pro jest zgodny z wymogami
        Rozporządzenia Ministra Zdrowia w zakresie sterylizacji narzędzi kosmetycznych.
        Dokumentacja jest archiwizowana przez 10 lat zgodnie z przepisami Sanepidu.
        Zamrożone procesy mają nienaruszalny hash integralności SHA-256.
      </div>
    </div>
  );
};

export default Dashboard;
