export interface LoginResponse {
  token: string;
  expiration: string;
}

export interface MeasurementRequest {
  measurementCategory: string;
  operationType: number;
  measurementUnit1: string;
  measurementValue1: number;
  measurementUnit2?: string;
  measurementValue2?: number;
  targetMeasurementUnit?: string;
}

export interface MeasurementResponse {
  calculatedValue: number;
  isSuccess: boolean;
  errorMessage?: string;
  areEqual?: boolean;
}

export interface MeasurementRecord {
  id: number;
  measurementCategory: string;
  operationType: string;
  measurementUnit1: string;
  measurementValue1: number;
  measurementUnit2: string;
  measurementValue2: number;
  targetMeasurementUnit: string;
  calculatedValue: number;
  isComparison: boolean;
  areEqual: boolean;
  timestamp: string;
  createdAt: string;
  formattedMessage: string;
  userName: string;
}

export interface UnitsMetadata {
  length: string[];
  weight: string[];
  volume: string[];
  temperature: string[];
}
