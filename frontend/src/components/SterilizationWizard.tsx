import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  RiskCategory,
  SterilizationProcess,
  ToolPackage,
  PhysicalParameters,
  TestResult
} from '../types';
import {
  getUsers,
  createProcess,
  updateProcessStatus,
  addToolPackage,
  addChemicalIndicator,
  sealProcess
} from '../api/client';
import RiskBadge from './RiskBadge';
import AlertBanner from './AlertBanner';

interface SterilizationWizardProps {
  onComplete?: (process: SterilizationProcess) => void;
  onCancel?: () => void;
}

// ---- Step definitions ----
const STEPS = [
  { id: 1, label: 'Inicjacja', shortLabel: '1' },
  { id: 2, label: 'Dezynfekcja', shortLabel: '2' },
  { id: 3, label: 'Przygotowanie', shortLabel: '3' },
  { id: 4, label: 'Pakowanie', shortLabel: '4' },
  { id: 5, label: 'Autoklaw', shortLabel: '5' },
  { id: 6, label: 'Weryfikacja', shortLabel: '6' }
];

const TOTAL_STEPS = STEPS.length;

// ---- Risk tile definitions ----
const RISK_TILES: Array<{
  risk: RiskCategory;
  icon: string;
  label: string;
  desc: string;
  required: string;
}> = [
  {
    risk: 'HIGH',
    icon: '!',
    label: 'WYSOKIE',
    desc: 'Naruszenie ciągłości tkanek (iniekcje, zabiegi inwazyjne)',
    required: 'Wymagana sterylizacja w autoklawie 134°C'
  },
  {
    risk: 'MEDIUM',
    icon: '~',
    label: 'SREDNIE',
    desc: 'Kontakt z błonami śluzowymi (narzędzia do manicure, pedicure)',
    required: 'Wymagana sterylizacja w autoklawie 134°C'
  },
  {
    risk: 'LOW',
    icon: 'OK',
    label: 'NISKIE',
    desc: 'Kontakt z nieuszkodzoną skórą (nożyczki, grzebienie)',
    required: 'Wystarczy dezynfekcja wysokiego poziomu'
  }
];

const CHECKLIST_ITEMS = [
  'Mycie narzędzi pod bieżącą wodą',
  'Dokładne suszenie po myciu',
  'Kontrola wizualna — brak uszkodzeń mechanicznych'
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function addMonthsToDate(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// ---- Main component ----
const SterilizationWizard: React.FC<SterilizationWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<RiskCategory | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);

  // Created process
  const [process, setProcess] = useState<SterilizationProcess | null>(null);

  // Step 2 - Timer
  const [timerDuration, setTimerDuration] = useState(30); // minutes
  const [timerInput, setTimerInput] = useState('30');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(30 * 60); // seconds
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3 - Checklist
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    CHECKLIST_ITEMS.map(() => false)
  );

  // Step 4 - Packages
  const [packages, setPackages] = useState<ToolPackage[]>([]);
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgCount, setPkgCount] = useState(1);
  const [pkgRisk, setPkgRisk] = useState<RiskCategory>('HIGH');
  const [addingPackage, setAddingPackage] = useState(false);

  // Step 5 - Physical parameters
  const [physTemp, setPhysTemp] = useState('134');
  const [physPressure, setPhysPressure] = useState('270');
  const [physTime, setPhysTime] = useState('18');
  const [physCycle, setPhysCycle] = useState<'GRAVITY' | 'VACUUM' | 'PREVAC'>('VACUUM');
  const [physErrors, setPhysErrors] = useState<Record<string, string>>({});

  // Step 6 - Chemical indicator
  const [indicatorType, setIndicatorType] = useState('Typ V');
  const [indicatorResult, setIndicatorResult] = useState<TestResult | null>(null);
  const [indicatorNotes, setIndicatorNotes] = useState('');
  const [indicatorPhoto, setIndicatorPhoto] = useState<File | null>(null);

  // Load users on mount
  useEffect(() => {
    getUsers()
      .then(u => setUsers(u))
      .catch(() => setError('Nie można załadować listy operatorów'))
      .finally(() => setUsersLoading(false));
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            setTimerDone(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerRemaining]);

  const startTimer = useCallback(() => {
    const mins = parseInt(timerInput, 10);
    if (isNaN(mins) || mins < 1) return;
    setTimerDuration(mins);
    setTimerRemaining(mins * 60);
    setTimerDone(false);
    setTimerRunning(true);
  }, [timerInput]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerDone(false);
    const mins = parseInt(timerInput, 10) || 30;
    setTimerRemaining(mins * 60);
  }, [timerInput]);

  // ---- Navigation ----
  const canGoNext = useCallback((): boolean => {
    switch (step) {
      case 1:
        return !!selectedOperatorId && !!selectedRisk;
      case 2:
        return timerDone;
      case 3:
        return checkedItems.every(Boolean);
      case 4:
        return packages.length > 0;
      case 5: {
        const temp = parseFloat(physTemp);
        const pressure = parseFloat(physPressure);
        const time = parseFloat(physTime);
        return temp >= 134 && pressure > 0 && time >= 15;
      }
      case 6:
        return indicatorResult !== null;
      default:
        return false;
    }
  }, [step, selectedOperatorId, selectedRisk, timerDone, checkedItems, packages, physTemp, physPressure, physTime, indicatorResult]);

  const handleNext = async () => {
    setError(null);

    if (step === 1) {
      await handleCreateProcess();
    } else if (step === 2 || step === 3) {
      await handleAdvanceStatus();
    } else if (step === 4) {
      await handleAdvanceStatus();
    } else if (step === 5) {
      await handleAdvanceWithParams();
    } else if (step === 6) {
      await handleComplete();
    }
  };

  // Step 1: Create process
  const handleCreateProcess = async () => {
    if (!selectedOperatorId || !selectedRisk) return;
    setSubmitting(true);
    try {
      const created = await createProcess({ operatorId: selectedOperatorId });
      setProcess(created);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Błąd tworzenia procesu');
    } finally {
      setSubmitting(false);
    }
  };

  // Generic status advance
  const handleAdvanceStatus = async () => {
    if (!process) return;
    setSubmitting(true);
    try {
      const updated = await updateProcessStatus(process.id);
      setProcess(updated);
      setStep(s => s + 1);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Błąd aktualizacji statusu');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 5: Advance with physical parameters
  const handleAdvanceWithParams = async () => {
    if (!process) return;

    const errs: Record<string, string> = {};
    const temp = parseFloat(physTemp);
    const pressure = parseFloat(physPressure);
    const time = parseFloat(physTime);

    if (isNaN(temp) || temp < 134) errs.temp = 'Temperatura musi wynosić co najmniej 134°C';
    if (isNaN(pressure) || pressure <= 0) errs.pressure = 'Ciśnienie jest wymagane';
    if (isNaN(time) || time < 15) errs.time = 'Czas sterylizacji musi wynosić co najmniej 15 minut';

    if (Object.keys(errs).length > 0) {
      setPhysErrors(errs);
      return;
    }
    setPhysErrors({});

    setSubmitting(true);
    try {
      const updated = await updateProcessStatus(process.id, {
        temperature: temp,
        pressure,
        time,
        cycleType: physCycle
      });
      setProcess(updated);
      setStep(s => s + 1);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Błąd parametrów fizycznych');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 6: Complete and seal
  const handleComplete = async () => {
    if (!process || indicatorResult === null) return;
    setSubmitting(true);
    try {
      // Add chemical indicator
      await addChemicalIndicator(process.id, {
        type: indicatorType,
        result: indicatorResult,
        position: 'Komora autoklawu'
      });

      // Advance status to COMPLETED
      const completed = await updateProcessStatus(
        process.id,
        undefined,
        indicatorNotes || undefined
      );
      setProcess(completed);

      // Seal the process
      const operatorId = process.operator?.id ?? selectedOperatorId;
      const sealResult = await sealProcess(process.id, operatorId);

      if (sealResult.process) {
        setProcess(sealResult.process);
        if (onComplete) {
          onComplete(sealResult.process);
        }
      }

      setStep(7); // Done
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Błąd finalizacji procesu');
    } finally {
      setSubmitting(false);
    }
  };

  // Add package (Step 4)
  const handleAddPackage = async () => {
    if (!process || !pkgDescription.trim()) return;
    setAddingPackage(true);
    setError(null);
    try {
      const pkg = await addToolPackage(process.id, {
        description: pkgDescription.trim(),
        count: pkgCount,
        riskCategory: pkgRisk
      });
      setPackages(prev => [...prev, pkg]);
      setPkgDescription('');
      setPkgCount(1);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Błąd dodawania pakietu');
    } finally {
      setAddingPackage(false);
    }
  };

  const selectedOperator = users.find(u => u.id === selectedOperatorId);

  // ---- Completed screen ----
  if (step === 7 && process) {
    return (
      <div className="wizard-container">
        <div
          style={{
            background: 'var(--color-success)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 32px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>OK</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Proces zamrożony!
          </h2>
          <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 24 }}>
            Cykl #{process.cycleNumber} został pomyślnie zakończony i zamrożony zgodnie
            z wymogami Sanepidu.
          </p>
          {process.sealHash && (
            <div
              style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                margin: '0 auto',
                maxWidth: 500,
                marginBottom: 24
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hash integralności SHA-256
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                {process.sealHash}
              </div>
            </div>
          )}
          <button
            className="btn btn-outline"
            style={{ borderColor: 'white', color: 'white', minHeight: 52 }}
            onClick={onCancel}
          >
            Powrót do Panelu
          </button>
        </div>
      </div>
    );
  }

  // ---- Wizard ----
  return (
    <div className="wizard-container">
      {/* Header */}
      <div className="wizard-header">
        <div className="wizard-title">Proces Sterylizacji</div>
        <div className="wizard-subtitle">
          Krok {step} z {TOTAL_STEPS} — {STEPS[step - 1]?.label}
        </div>
        <div className="wizard-progress">
          {STEPS.map((s, idx) => (
            <div
              key={s.id}
              className={`wizard-step-dot ${
                idx + 1 < step ? 'done' : idx + 1 === step ? 'active' : ''
              }`}
              title={s.label}
            />
          ))}
        </div>
      </div>

      {/* Process info bar (shown from step 2+) */}
      {process && step > 1 && (
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderTop: 'none', padding: '12px 32px' }}>
          <div className="process-info-bar">
            <div className="process-info-item">
              <span className="process-info-label">Nr cyklu</span>
              <span className="process-info-value">#{process.cycleNumber}</span>
            </div>
            <div className="process-info-item">
              <span className="process-info-label">Operator</span>
              <span className="process-info-value">
                {process.operator
                  ? `${process.operator.firstName} ${process.operator.lastName}`
                  : '—'}
              </span>
            </div>
            {selectedRisk && (
              <div className="process-info-item">
                <span className="process-info-label">Kategoria ryzyka</span>
                <span className="process-info-value">
                  <RiskBadge risk={selectedRisk} size="sm" />
                </span>
              </div>
            )}
            <div className="process-info-item">
              <span className="process-info-label">Status</span>
              <span className={`status-badge status-${process.status}`}>
                {process.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="wizard-body">
        {error && (
          <AlertBanner
            type="danger"
            title="Błąd"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* ---- STEP 1: Inicjacja ---- */}
        {step === 1 && (
          <div>
            <div className="step-title">Inicjacja procesu</div>
            <div className="step-description">
              Wybierz operatora i kategorię ryzyka narzędzi wg klasyfikacji Spauldinga.
            </div>

            <div className="form-group">
              <label className="form-label">Operator (osoba sterylizująca)</label>
              {usersLoading ? (
                <div style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>
                  Ładowanie listy operatorów...
                </div>
              ) : users.length === 0 ? (
                <AlertBanner
                  type="warning"
                  title="Brak operatorów"
                  message="Nie znaleziono żadnych użytkowników. Dodaj operatorów w panelu administracyjnym."
                />
              ) : (
                <select
                  className="form-control"
                  value={selectedOperatorId}
                  onChange={e => setSelectedOperatorId(e.target.value)}
                >
                  <option value="">-- Wybierz operatora --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role})
                      {u.certification ? ` — cert. ${u.certification}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Kategoria ryzyka narzędzi (Klasyfikacja Spauldinga)</label>
              <div className="risk-tiles">
                {RISK_TILES.map(rt => (
                  <button
                    key={rt.risk}
                    className={`risk-tile ${selectedRisk === rt.risk ? `selected-${rt.risk}` : ''}`}
                    onClick={() => setSelectedRisk(rt.risk)}
                    type="button"
                  >
                    <div
                      className="risk-tile-icon"
                      style={{
                        color: rt.risk === 'HIGH' ? 'var(--color-risk-high)' :
                               rt.risk === 'MEDIUM' ? 'var(--color-risk-medium)' :
                               'var(--color-risk-low)',
                        fontWeight: 800,
                        fontSize: 28
                      }}
                    >
                      {rt.icon}
                    </div>
                    <div
                      className="risk-tile-name"
                      style={{
                        color: rt.risk === 'HIGH' ? 'var(--color-risk-high)' :
                               rt.risk === 'MEDIUM' ? 'var(--color-risk-medium)' :
                               'var(--color-risk-low)'
                      }}
                    >
                      {rt.label}
                    </div>
                    <div className="risk-tile-desc">{rt.desc}</div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: rt.risk === 'HIGH' ? 'var(--color-risk-high)' :
                               rt.risk === 'MEDIUM' ? 'var(--color-risk-medium)' :
                               'var(--color-risk-low)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}
                    >
                      {rt.required}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- STEP 2: Dezynfekcja Wstępna ---- */}
        {step === 2 && (
          <div>
            <div className="step-title">Dezynfekcja wstępna</div>
            <div className="step-description">
              Zanurz narzędzia w roztworze dezynfekującym. Odczekaj wymagany czas kontaktu.
            </div>

            <div
              style={{
                background: '#eaf4fb',
                border: '1.5px solid var(--color-info)',
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                marginBottom: 24,
                fontSize: 14,
                color: '#174060'
              }}
            >
              <strong>Instrukcja:</strong> Zanurz narzędzia całkowicie w roztworze dezynfekującym
              (np. Sekusept, Lysoformin). Utrzymuj stężenie i temperaturę zgodnie z kartą
              charakterystyki preparatu.
            </div>

            <div className="timer-duration-input">
              <label className="form-label" style={{ margin: 0 }}>Czas dezynfekcji:</label>
              <input
                type="number"
                className="form-control"
                value={timerInput}
                onChange={e => {
                  setTimerInput(e.target.value);
                  if (!timerRunning) {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v > 0) setTimerRemaining(v * 60);
                  }
                }}
                min={1}
                max={120}
                disabled={timerRunning}
                style={{ width: 90, textAlign: 'center' }}
              />
              <span style={{ fontWeight: 600 }}>min</span>
            </div>

            <div
              className={`timer-display ${timerDone ? 'done' : timerRunning ? 'running' : ''}`}
            >
              {formatTime(timerRemaining)}
            </div>

            <div className="timer-controls">
              {!timerRunning && !timerDone && (
                <button className="btn btn-primary btn-lg" onClick={startTimer} type="button">
                  Uruchom timer
                </button>
              )}
              {timerRunning && (
                <button className="btn btn-warning" onClick={resetTimer} type="button">
                  Resetuj
                </button>
              )}
              {timerDone && (
                <button className="btn btn-outline btn-sm" onClick={resetTimer} type="button">
                  Powtórz
                </button>
              )}
            </div>

            {timerDone && (
              <div className="timer-done-banner">
                <div className="timer-done-banner-text">
                  Dezynfekcja wstępna zakończona!
                </div>
                <div style={{ fontSize: 14, marginTop: 6, color: 'var(--color-success)' }}>
                  Czas {timerDuration} min upłynął. Możesz przejść do następnego kroku.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 3: Przygotowanie ---- */}
        {step === 3 && (
          <div>
            <div className="step-title">Przygotowanie narzędzi</div>
            <div className="step-description">
              Zaznacz wszystkie czynności jako wykonane, aby przejść dalej.
            </div>
            <div className="checklist">
              {CHECKLIST_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className={`checklist-item ${checkedItems[idx] ? 'checked' : ''}`}
                  onClick={() => {
                    const updated = [...checkedItems];
                    updated[idx] = !updated[idx];
                    setCheckedItems(updated);
                  }}
                >
                  <div className="checklist-checkbox">
                    {checkedItems[idx] ? 'OK' : ''}
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {checkedItems.every(Boolean) && (
              <AlertBanner
                type="success"
                title="Wszystkie czynności wykonane!"
                message="Narzędzia są gotowe do pakowania."
              />
            )}
          </div>
        )}

        {/* ---- STEP 4: Pakowanie ---- */}
        {step === 4 && (
          <div>
            <div className="step-title">Pakowanie narzędzi</div>
            <div className="step-description">
              Zapakuj narzędzia w opakowania sterylizacyjne i dodaj je do listy.
            </div>

            <div className="card-sm" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 14, color: 'var(--color-primary)' }}>
                Dodaj pakiet narzędzi
              </div>
              <div className="form-group">
                <label className="form-label">Opis narzędzi</label>
                <input
                  type="text"
                  className="form-control"
                  value={pkgDescription}
                  onChange={e => setPkgDescription(e.target.value)}
                  placeholder="np. cążki do manicure, skalpel chirurgiczny"
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Liczba pakietów</label>
                  <input
                    type="number"
                    className="form-control"
                    value={pkgCount}
                    onChange={e => setPkgCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={100}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategoria ryzyka</label>
                  <select
                    className="form-control"
                    value={pkgRisk}
                    onChange={e => setPkgRisk(e.target.value as RiskCategory)}
                  >
                    <option value="HIGH">Wysokie (sterylizacja)</option>
                    <option value="MEDIUM">Srednie (sterylizacja)</option>
                    <option value="LOW">Niskie (dezynfekcja)</option>
                  </select>
                </div>
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleAddPackage}
                disabled={addingPackage || !pkgDescription.trim()}
                type="button"
              >
                {addingPackage ? 'Dodawanie...' : '+ Dodaj Pakiet'}
              </button>
            </div>

            {/* Package list */}
            {packages.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.5px' }}>
                  Dodane pakiety ({packages.length})
                </div>
                <div className="package-list">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="package-item">
                      <div className="package-item-info">
                        <div className="package-item-name">{pkg.description}</div>
                        <div className="package-item-serial">
                          S/N: {pkg.serialNumber}
                        </div>
                        <div className="package-item-expiry">
                          Ważny do: {new Date(pkg.expiryDate).toLocaleDateString('pl-PL')}
                          &nbsp;|&nbsp; Sztuk: {pkg.count}
                        </div>
                      </div>
                      <RiskBadge risk={pkg.riskCategory} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {packages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: 'var(--color-text-muted)',
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                Brak pakietów — dodaj co najmniej jeden pakiet narzędzi
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 5: Autoklaw ---- */}
        {step === 5 && (
          <div>
            <div className="step-title">Parametry sterylizacji — Autoklaw</div>
            <div className="step-description">
              Wprowadź parametry fizyczne procesu sterylizacji z wydruku autoklawu.
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Temperatura (°C)</label>
                <input
                  type="number"
                  className={`form-control ${physErrors.temp ? 'error' : ''}`}
                  value={physTemp}
                  onChange={e => setPhysTemp(e.target.value)}
                  min={134}
                  step={1}
                />
                {physErrors.temp && <div className="form-error">{physErrors.temp}</div>}
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Min. 134°C (standard Sanepid)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ciśnienie (kPa)</label>
                <input
                  type="number"
                  className={`form-control ${physErrors.pressure ? 'error' : ''}`}
                  value={physPressure}
                  onChange={e => setPhysPressure(e.target.value)}
                  min={1}
                  step={1}
                />
                {physErrors.pressure && <div className="form-error">{physErrors.pressure}</div>}
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Typowe: 270 kPa przy 134°C
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Czas sterylizacji (min)</label>
                <input
                  type="number"
                  className={`form-control ${physErrors.time ? 'error' : ''}`}
                  value={physTime}
                  onChange={e => setPhysTime(e.target.value)}
                  min={15}
                  step={1}
                />
                {physErrors.time && <div className="form-error">{physErrors.time}</div>}
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Min. 15 min przy 134°C
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Typ cyklu</label>
                <select
                  className="form-control"
                  value={physCycle}
                  onChange={e => setPhysCycle(e.target.value as any)}
                >
                  <option value="GRAVITY">Grawitacyjny (GRAVITY)</option>
                  <option value="VACUUM">Próżniowy (VACUUM)</option>
                  <option value="PREVAC">Pre-vacuum (PREVAC)</option>
                </select>
              </div>
            </div>

            {parseFloat(physTemp) >= 134 && parseFloat(physPressure) > 0 && parseFloat(physTime) >= 15 && (
              <AlertBanner
                type="success"
                title="Parametry poprawne"
                message={`Temp. ${physTemp}°C / Ciśnienie ${physPressure} kPa / Czas ${physTime} min — Cykl ${physCycle}`}
              />
            )}
          </div>
        )}

        {/* ---- STEP 6: Weryfikacja ---- */}
        {step === 6 && (
          <div>
            <div className="step-title">Weryfikacja wyników</div>
            <div className="step-description">
              Sprawdź wskaźnik chemiczny i udokumentuj wynik procesu sterylizacji.
            </div>

            <div className="form-group">
              <label className="form-label">Typ wskaźnika chemicznego</label>
              <select
                className="form-control"
                value={indicatorType}
                onChange={e => setIndicatorType(e.target.value)}
              >
                <option value="Typ V">Typ V (wskaźnik integrujący)</option>
                <option value="Typ IV">Typ IV (wskaźnik wieloparametrowy)</option>
                <option value="Typ VI">Typ VI (wskaźnik emulujący)</option>
                <option value="Bowie-Dick">Test Bowie-Dick</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Zdjęcie wskaźnika chemicznego (opcjonalne)</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={e => setIndicatorPhoto(e.target.files?.[0] ?? null)}
                style={{ cursor: 'pointer' }}
              />
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Zalecane do celów dokumentacyjnych Sanepid
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Wynik wskaźnika chemicznego</label>
              <div className="result-buttons">
                <button
                  type="button"
                  className={`result-btn result-btn-pass ${indicatorResult === 'PASS' ? 'selected' : ''}`}
                  onClick={() => setIndicatorResult('PASS')}
                >
                  POZYTYWNY (PASS)
                </button>
                <button
                  type="button"
                  className={`result-btn result-btn-fail ${indicatorResult === 'FAIL' ? 'selected' : ''}`}
                  onClick={() => setIndicatorResult('FAIL')}
                >
                  NEGATYWNY (FAIL)
                </button>
              </div>
            </div>

            {indicatorResult === 'FAIL' && (
              <AlertBanner
                type="danger"
                title="Uwaga: Wskaźnik negatywny!"
                message="Wynik FAIL oznacza potencjalny błąd procesu sterylizacji. Narzędzia nie mogą być użyte. Sprawdź parametry autoklawu i powtórz cykl."
              />
            )}

            <div className="form-group">
              <label className="form-label">Uwagi / notatki (opcjonalne)</label>
              <textarea
                className="form-control"
                value={indicatorNotes}
                onChange={e => setIndicatorNotes(e.target.value)}
                placeholder="Dodatkowe uwagi do procesu sterylizacji..."
                rows={3}
              />
            </div>

            <div className="warning-box">
              <strong>Uwaga: Akcja nieodwracalna!</strong>
              Kliknięcie "Zakończ i Zamroź Proces" spowoduje trwałe zamrożenie dokumentacji
              procesu sterylizacji. Zgodnie z wymogami Sanepidu, edycja zamrożonej
              dokumentacji jest zabroniona. Rekord zostanie opatrzony hashem integralności SHA-256.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="wizard-footer">
        <div className="wizard-step-indicator">
          Krok {step} z {TOTAL_STEPS}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-outline"
            onClick={onCancel}
            type="button"
            style={{ minHeight: 52 }}
          >
            Anuluj
          </button>
          <button
            className={`btn ${step === 6 ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleNext}
            disabled={!canGoNext() || submitting}
            type="button"
          >
            {submitting
              ? 'Przetwarzanie...'
              : step === 1
              ? 'Rozpocznij Proces'
              : step === 6
              ? 'Zakoncz i Zamroz Proces'
              : 'Dalej'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SterilizationWizard;
