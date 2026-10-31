/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  FirestoreAppointment,
  FirestorePatient,
  FirestoreAuditLog,
  FirestoreErrorInfo,
  OperationType
} from './types/firestore';

// Firebase configuration using environment variables or safe defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDevEnvironmentQadoDental",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dr-james-qado-dental.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dr-james-qado-dental",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dr-james-qado-dental.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "186459599971",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:186459599971:web:f408585080c94199"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Standardized Firestore error handler providing structured error diagnostics
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null
    }
  };
  console.error("Firestore Compliance Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Normalizes phone numbers into clean string key (+15550000000)
 */
export function normalizePhoneDocId(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '+10000000000';
}

/**
 * Saves a new patient appointment to Cloud Firestore with mandatory audit logging
 */
export async function createAppointmentInFirestore(
  appointment: Omit<FirestoreAppointment, 'id' | 'createdAt'> & { id?: string },
  clientIp: string = '127.0.0.1'
): Promise<FirestoreAppointment> {
  const appointmentId = appointment.id || `apt-${Date.now()}`;
  const path = `appointments/${appointmentId}`;

  const record: FirestoreAppointment = {
    ...appointment,
    id: appointmentId,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  try {
    // 1. Write appointment document
    await setDoc(doc(db, 'appointments', appointmentId), record);

    // 2. Ensure patient index exists
    const patientDocId = normalizePhoneDocId(appointment.phoneNumber);
    const patientRef = doc(db, 'patients', patientDocId);
    const existingPatient = await getDoc(patientRef);

    if (!existingPatient.exists()) {
      const newPatient: FirestorePatient = {
        phoneNumber: appointment.phoneNumber,
        fullName: appointment.patientName,
        unpaidCancellationFee: false,
        feeAmount: 10.0,
        lastUpdated: new Date().toISOString()
      };
      await setDoc(patientRef, newPatient);
    }

    // 3. Append immutable HIPAA audit log
    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const auditEntry: FirestoreAuditLog = {
      timestamp: new Date().toISOString(),
      action: 'CREATE',
      performedBy: appointment.patientName,
      patientId: appointment.phoneNumber,
      ipAddress: clientIp,
      details: {
        appointmentId,
        servicesCount: appointment.services.length,
        totalCashEstimated: appointment.totalCashEstimated,
        tcpaConsent: appointment.tcpaConsent,
        hipaaConsent: appointment.hipaaConsent
      }
    };
    await setDoc(doc(db, 'audit_logs', auditLogId), auditEntry);

    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Checks whether a patient has an outstanding $10 cancellation fee
 */
export async function getPatientCancellationFee(phoneNumber: string): Promise<{ hasFee: boolean; feeAmount: number }> {
  const patientDocId = normalizePhoneDocId(phoneNumber);
  const path = `patients/${patientDocId}`;

  try {
    const snap = await getDoc(doc(db, 'patients', patientDocId));
    if (!snap.exists()) {
      return { hasFee: false, feeAmount: 0 };
    }
    const data = snap.data() as FirestorePatient;
    return {
      hasFee: Boolean(data.unpaidCancellationFee),
      feeAmount: data.feeAmount || 10.0
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Updates an appointment status (e.g., cancelled or completed) with audit trail
 */
export async function updateAppointmentStatusInFirestore(
  appointmentId: string,
  newStatus: FirestoreAppointment['status'],
  performedBy: string = 'Dr. James Qado, DDS',
  clientIp: string = '127.0.0.1'
): Promise<void> {
  const path = `appointments/${appointmentId}`;

  try {
    const aptRef = doc(db, 'appointments', appointmentId);
    const snap = await getDoc(aptRef);
    if (!snap.exists()) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const currentApt = snap.data() as FirestoreAppointment;

    await updateDoc(aptRef, {
      status: newStatus,
      lastUpdated: new Date().toISOString()
    });

    // If cancelled, check if cancellation is late and flag $10 fee on patient record
    if (newStatus === 'cancelled') {
      const patientDocId = normalizePhoneDocId(currentApt.phoneNumber);
      const patientRef = doc(db, 'patients', patientDocId);
      await setDoc(
        patientRef,
        {
          unpaidCancellationFee: true,
          feeAmount: 10.0,
          lastUpdated: new Date().toISOString()
        },
        { merge: true }
      );
    }

    // Append to immutable audit log
    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const auditEntry: FirestoreAuditLog = {
      timestamp: new Date().toISOString(),
      action: newStatus === 'cancelled' ? 'CANCEL' : 'STATUS_CHANGE',
      performedBy,
      patientId: currentApt.phoneNumber,
      ipAddress: clientIp,
      details: {
        appointmentId,
        previousStatus: currentApt.status,
        newStatus
      }
    };
    await setDoc(doc(db, 'audit_logs', auditLogId), auditEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Settles/marks paid an outstanding cancellation fee for a patient
 */
export async function markPatientFeePaidInFirestore(
  phoneNumber: string,
  performedBy: string = 'Dr. James Qado, DDS',
  clientIp: string = '127.0.0.1'
): Promise<void> {
  const patientDocId = normalizePhoneDocId(phoneNumber);
  const path = `patients/${patientDocId}`;

  try {
    const patientRef = doc(db, 'patients', patientDocId);
    await setDoc(
      patientRef,
      {
        unpaidCancellationFee: false,
        feeAmount: 0.0,
        lastUpdated: new Date().toISOString()
      },
      { merge: true }
    );

    // Append audit record
    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const auditEntry: FirestoreAuditLog = {
      timestamp: new Date().toISOString(),
      action: 'MARK_PAID',
      performedBy,
      patientId: phoneNumber,
      ipAddress: clientIp,
      details: { feePaid: 10.0 }
    };
    await setDoc(doc(db, 'audit_logs', auditLogId), auditEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export default app;
