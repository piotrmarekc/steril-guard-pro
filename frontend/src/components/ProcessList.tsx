import React from 'react';
import { SterilizationProcess } from '../types';
import RiskBadge from './RiskBadge';

interface ProcessListProps {
  processes: SterilizationProcess[];
  onSelect?: (process: SterilizationProcess) => void;
  loading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Szkic',
  INITIAL_DISINFECTING: 'Dezynfekcja',
  PREPARING: 'Przygotowanie',
  PACKAGING: 'Pakowanie',
  STERILIZING: 'Sterylizacja',
  VERIFYING: 'Weryfikacja',
  COMPLETED: 'Zakończony',
  SEALED: 'Zamrożony',
  CANCELLED: 'Anulowany'
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function getHighestRisk(process: SterilizationProcess): string | null {
  if (!process.toolPackages || process.toolPackages.length === 0) return null;
  if (process.toolPackages.some(p => p.riskCategory === 'HIGH')) return 'HIGH';
  if (process.toolPackages.some(p => p.riskCategory === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

const ProcessList: React.FC<ProcessListProps> = ({ processes, onSelect, loading }) => {
  if (loading) {
    return <div className="loading">Ładowanie procesów...</div>;
  }

  if (!processes || processes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128220;</div>
        <div className="empty-state-text">Brak procesów sterylizacji</div>
        <div style={{ marginTop: 8, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Utwórz pierwszy proces klikając "Nowy Proces"
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Nr cyklu</th>
            <th>Data</th>
            <th>Operator</th>
            <th>Status</th>
            <th>Ryzyko</th>
            <th>Pakiety</th>
            <th>Hash integralności</th>
          </tr>
        </thead>
        <tbody>
          {processes.map(process => {
            const highestRisk = getHighestRisk(process);
            return (
              <tr
                key={process.id}
                style={onSelect ? { cursor: 'pointer' } : undefined}
                onClick={() => onSelect && onSelect(process)}
              >
                <td>
                  <strong style={{ fontSize: 16 }}>#{process.cycleNumber}</strong>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {formatDate(process.startTime)}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>
                    {process.operator
                      ? `${process.operator.firstName} ${process.operator.lastName}`
                      : '—'}
                  </div>
                  {process.operator?.role && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {process.operator.role}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${process.status}`}>
                    {STATUS_LABELS[process.status] || process.status}
                  </span>
                </td>
                <td>
                  {highestRisk ? (
                    <RiskBadge risk={highestRisk as any} size="sm" />
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>—</span>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>
                    {process.toolPackages?.length ?? 0}
                  </span>
                  {process.toolPackages && process.toolPackages.length > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>
                      pak.
                    </span>
                  )}
                </td>
                <td>
                  {process.sealHash ? (
                    <span className="seal-hash" title={process.sealHash}>
                      {process.sealHash.slice(0, 16)}...
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProcessList;
