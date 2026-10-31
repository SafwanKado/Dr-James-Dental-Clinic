/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BookedService {
  id: string;
  name: string;
  price: number;
  duration: string;
}

export interface BookedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Cloud Firestore Appointments Model
 * Path: /appointments/{appointmentId}
 */
export interface FirestoreAppointment {
  id: string;
  patientName: string;
  phoneNumber: string; // Standardized +1 (XXX) XXX-XXXX
  services: BookedService[];
  selectedProducts: BookedProduct[];
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "10:00 AM"
  status: 'confirmed' | 'in_chair' | 'completed' | 'cancelled';
  totalCashEstimated: number; // e.g., 80.00
  tcpaConsent: boolean; // Must be true
  hipaaConsent: boolean; // Must be true
  practitioner?: string;
  notes?: string;
  confirmationCode?: string;
  createdAt: string; // ISO String or Firestore ServerTimestamp
}

/**
 * Cloud Firestore Patients Model
 * Path: /patients/{phoneNumber}
 * Document ID: standardized phoneNumber (e.g., +15552348901)
 */
export interface FirestorePatient {
  phoneNumber: string; // Document ID
  fullName: string;
  unpaidCancellationFee: boolean; // True if patient owes $10 late cancellation fee
  feeAmount: number; // Defaults to 10.00
  lastUpdated: string;
  notes?: string;
}

/**
 * Cloud Firestore Audit Logs Model (Append-Only)
 * Path: /audit_logs/{logId}
 * Strict HIPAA compliance audit trail (immutable)
 */
export interface FirestoreAuditLog {
  id?: string;
  timestamp: string; // ISO String or Firestore ServerTimestamp
  action: 'CREATE' | 'CANCEL' | 'MARK_PAID' | 'STATUS_CHANGE';
  performedBy: string; // 'patient', staff email, or user UID
  patientId: string; // Phone number or patient reference key
  ipAddress: string; // Client IP or 'unknown'
  details?: Record<string, any>;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}
