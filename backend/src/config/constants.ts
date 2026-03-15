/**
 * System SterilGuard Pro
 * Plik stałych konfiguracyjnych zgodnych z wymogami Sanepidu
 *
 * Zgodnie z:
 * - Ustawa z dnia 5 grudnia 2008 r. o zapobieganiu oraz zwalczaniu zakażeń
 * - Wytycznymi GIS dla salonów beauty
 */

/**
 * Okres przechowywania dokumentacji sterylizacji (w latach)
 * Zgodnie z przepisami: dokumenty należy archiwizować przez 10 lat
 */
export const ARCHIVE_YEARS = 10;

/**
 * Ważność pakietu sterylnego (w miesiącach)
 * Pakiety papierowo-foliowe są ważne przez 6 miesięcy od daty sterylizacji
 * o ile opakowanie pozostaje nienaruszone
 */
export const PACKAGE_VALIDITY_MONTHS = 6;

/**
 * Wymagane parametry fizyczne do kontroli procesu sterylizacji
 */
export const REQUIRED_PHYSICAL_PARAMS = ['time', 'temperature', 'pressure'] as const;

/**
 * Minimalna temperatura sterylizacji parowej (stopnie Celsjusza)
 * Standardowy cykl sterylizacji w autoklawie: 134°C
 */
export const MIN_STERILIZATION_TEMP = 134;

/**
 * Czas minimalny sterylizacji przy 134°C (w minutach)
 */
export const MIN_STERILIZATION_TIME_AT_134C = 15;

/**
 * Kategorie ryzyka zgodnie z klasyfikacją Spauldinga
 */
export enum RiskCategory {
  LOW = 'LOW',      // Niskie ryzyko - kontakt z nieuszkodzoną skórą
  MEDIUM = 'MEDIUM', // Średnie ryzyko - kontakt z błonami śluzowymi
  HIGH = 'HIGH'     // Wysokie ryzyko - naruszenie ciągłości tkanek
}

/**
 * Typy testów kontrolnych
 */
export enum TestType {
  CHEMICAL = 'CHEMICAL',
  BIOLOGICAL = 'BIOLOGICAL',
  BowieDICK = 'BowieDICK'
}

/**
 * Statusy testów kontrolnych
 */
export enum TestResult {
  PASS = 'PASS',  // Zadowalający
  FAIL = 'FAIL'   // Niewłaściwy
}

/**
 * Role użytkowników systemu
 */
export enum UserRole {
  STYLIST = 'STYLIST',        // Fryzjer/kosmetolog
  SUPERVISOR = 'SUPERVISOR',  // Nadzorca - może zatwierdzać procesy
  ADMIN = 'ADMIN'             // Administrator systemu
}

/**
 * Typy cykli sterylizacji
 */
export enum SterilizationCycle {
  GRAVITY = 'GRAVITY',      // Cykl grawitacyjny (dla narzędzi bez pojemników)
  VACUUM = 'VACUUM',        // Cykl pod vakuem (dla pakietów)
  PREVAC = 'PREVAC'         // Cykl pod vakuem z wstępnej deaeracji
}

/**
 * Statusy procesów sterylizacji
 */
export enum ProcessStatus {
  DRAFT = 'DRAFT',          // W przygotowaniu
  INITIAL_DISINFECTING = 'INITIAL_DISINFECTING', // Wstępna dezynfekcja
  PREPARING = 'PREPARING',  // Przygotowanie
  PACKAGING = 'PACKAGING',  // Pakowanie
  STERILIZING = 'STERILIZING', // Sterylizacja
  VERIFYING = 'VERIFYING',  // Weryfikacja
  COMPLETED = 'COMPLETED',  // Zakończony
  SEALED = 'SEALED',        // Zamrożony (nieedytowalny)
  CANCELLED = 'CANCELLED'   // Anulowany
}

/**
 * Jednostki parametrów fizycznych
 */
export enum ParameterUnit {
  MINUTES = 'min',
  CELSIUS = '°C',
  KPA = 'kPa',
  PSI = 'psi'
}
