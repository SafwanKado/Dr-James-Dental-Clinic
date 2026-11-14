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
  email?: string;
  services: BookedService[];
  selectedProducts: BookedProduct[];
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "10:00 AM"
  status: 'confirmed' | 'in_chair' | 'completed' | 'cancelled';
  totalCashEstimated: number; // e.g., 80.00
  lateFeeIncluded?: number;
  tcpaConsent: boolean; // Must be true
  hipaaConsent: boolean; // Must be true
  practitioner?: string;
  notes?: string;
  confirmationCode?: string;
  isNewPatient?: boolean;
  createdAt: any; // Firestore ServerTimestamp or ISO String
  lastUpdated?: any;
}

/**
 * Cloud Firestore Patients Model
 * Path: /patients/{patientId}
 * Document ID: normalized phone digits (e.g., 15552348901)
 */
export interface FirestorePatient {
  phoneNumber: string;
  fullName: string;
  unpaidCancellationFee: boolean; // True if patient owes $10 late cancellation fee
  feeAmount: number; // Defaults to 10.00 when flagged, 0 otherwise
  lastUpdated: any;
  notes?: string;
}

/**
 * Cloud Firestore Audit Logs Model (Append-Only)
 * Path: /audit_logs/{logId}
 * Strict HIPAA compliance audit trail (immutable)
 */
export interface FirestoreAuditLog {
  id?: string;
  timestamp: any; // Firestore ServerTimestamp or ISO String
  action: 'CREATE' | 'CANCEL' | 'MARK_PAID' | 'STATUS_CHANGE';
  performedBy: string; // 'patient', staff email, or user UID
  patientId: string; // Normalized phone ID or patient reference key
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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      displayName?: string | null;
      email?: string | null;
      photoUrl?: string | null;
    }[];
  };
}
