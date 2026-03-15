import axios from 'axios';
import {
  User,
  SterilizationProcess,
  ToolPackage,
  ChemicalIndicator,
  ProcessSummary,
  RiskCategory,
  TestResult
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// ---- Users ----

export async function getUsers(): Promise<User[]> {
  const res = await api.get<User[]>('/users');
  return res.data;
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  certification?: string;
}): Promise<User> {
  const res = await api.post<User>('/users', data);
  return res.data;
}

// ---- Sterilization Processes ----

export async function getProcesses(): Promise<SterilizationProcess[]> {
  const res = await api.get<SterilizationProcess[]>('/sterilization');
  return res.data;
}

export async function getProcess(id: string): Promise<SterilizationProcess> {
  const res = await api.get<SterilizationProcess>(`/sterilization/${id}`);
  return res.data;
}

export async function createProcess(data: {
  operatorId: string;
  physicalParameters?: { temperature: number; pressure: number; time: number };
  notes?: string;
}): Promise<SterilizationProcess> {
  const res = await api.post<SterilizationProcess>('/sterilization', data);
  return res.data;
}

export async function updateProcessStatus(
  id: string,
  physicalParameters?: { temperature: number; pressure: number; time: number; cycleType?: string },
  notes?: string
): Promise<SterilizationProcess> {
  const res = await api.patch<SterilizationProcess>(`/sterilization/${id}/status`, {
    physicalParameters,
    notes
  });
  return res.data;
}

export async function addToolPackage(
  id: string,
  data: {
    description: string;
    count: number;
    riskCategory: RiskCategory;
  }
): Promise<ToolPackage> {
  const res = await api.post<ToolPackage>(`/sterilization/${id}/packages`, data);
  return res.data;
}

export async function addChemicalIndicator(
  id: string,
  data: {
    type: string;
    result: TestResult;
    photoUrl?: string;
    position?: string;
  }
): Promise<ChemicalIndicator> {
  const res = await api.post<ChemicalIndicator>(`/sterilization/${id}/chemical-indicator`, data);
  return res.data;
}

export async function sealProcess(
  id: string,
  userId: string
): Promise<{ message: string; process: SterilizationProcess }> {
  const res = await api.post<{ message: string; process: SterilizationProcess }>(
    `/sterilization/${id}/seal`,
    { userId }
  );
  return res.data;
}

export async function generateReport(
  from: string,
  to: string
): Promise<Blob> {
  const res = await api.get('/reports/pdf', {
    params: { from, to },
    responseType: 'blob'
  });
  return res.data;
}

export async function getSummary(): Promise<ProcessSummary> {
  const res = await api.get<ProcessSummary>('/reports/summary');
  return res.data;
}

export default api;
