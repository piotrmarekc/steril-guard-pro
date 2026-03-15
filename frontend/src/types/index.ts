export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProcessStatus =
  | 'DRAFT'
  | 'INITIAL_DISINFECTING'
  | 'PREPARING'
  | 'PACKAGING'
  | 'STERILIZING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'SEALED'
  | 'CANCELLED';
export type TestResult = 'PASS' | 'FAIL';
export type UserRole = 'STYLIST' | 'SUPERVISOR' | 'ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  certification?: string;
  expiryDate?: string;
}

export interface PhysicalParameters {
  temperature: number;
  pressure: number;
  time: number;
  cycleType?: 'GRAVITY' | 'VACUUM' | 'PREVAC';
}

export interface ToolPackage {
  id: string;
  description: string;
  count: number;
  riskCategory: RiskCategory;
  serialNumber: string;
  expiryDate: string;
}

export interface ChemicalIndicator {
  id: string;
  type: string;
  result: TestResult;
  photoUrl?: string;
  position?: string;
}

export interface SterilizationProcess {
  id: string;
  cycleNumber: number;
  startTime: string;
  endTime?: string;
  status: ProcessStatus;
  operator: User;
  physicalParameters: PhysicalParameters;
  toolPackages: ToolPackage[];
  chemicalIndicators: ChemicalIndicator[];
  sealedAt?: string;
  sealHash?: string;
  notes?: string;
}

export interface ProcessSummary {
  totalProcesses: number;
  completedProcesses: number;
  sealedProcesses: number;
  recentProcesses: SterilizationProcess[];
}
