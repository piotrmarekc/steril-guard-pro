/**
 * System SterilGuard Pro - Typy TypeScript
 */

// Zgodnie z constants.ts
export * from '../config/constants';

// Typy danych wejściowych/wyjściowych API
export interface PhysicalParameters {
  temperature: number; // °C
  pressure: number;    // kPa
  time: number;        // minuty
}

export interface ToolPackageInput {
  description: string;
  count?: number;
  riskCategory?: RiskCategory;
}

export interface ChemicalIndicatorInput {
  type: string;        // Typ IV/V
  result: TestResult;
  photoUrl?: string;
  position?: string;
}

export interface BiologicalTestInput {
  testDate: string;
  testType: string;
  result: TestResult;
  laboratory?: string;
  reportUrl?: string;
  nextTestDate: string;
}

// Typy odpowiedzi API
export interface ProcessResponse {
  id: string;
  cycleNumber: number;
  startTime: string;
  endTime: string | null;
  status: ProcessStatus;
  operator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  physicalParameters: PhysicalParameters;
  toolPackages: ToolPackageResponse[];
  chemicalIndicators: ChemicalIndicatorResponse[];
  biologicalTest: BiologicalTestResponse | null;
  sealedAt: string | null;
  createdAt: string;
}

export interface ToolPackageResponse {
  id: string;
  description: string;
  count: number;
  riskCategory: RiskCategory;
  serialNumber: string;
  expiryDate: string;
}

export interface ChemicalIndicatorResponse {
  id: string;
  type: string;
  result: TestResult;
  photoUrl: string | null;
  position: string | null;
}

export interface BiologicalTestResponse {
  id: string;
  testDate: string;
  testType: string;
  result: TestResult;
  laboratory: string | null;
  nextTestDate: string;
}

//.typy requestów
export interface CreateProcessRequest {
  operatorId: string;
  toolPackages: ToolPackageInput[];
  physicalParameters: PhysicalParameters;
  chemicalIndicators?: ChemicalIndicatorInput[];
  biologicalTestId?: string;
  notes?: string;
}

export interface SealProcessRequest {
  verified: boolean;
  verifiedBy: string;
  verificationNotes?: string;
}
