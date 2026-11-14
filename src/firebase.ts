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
  getDocFromServer,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import {
  FirestoreAppointment,
  FirestorePatient,
  FirestoreAuditLog,
  FirestoreErrorInfo,
  OperationType
} from './types/firestore';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Validates initial Firestore server connectivity on application boot
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

/**
 * Standardized Firestore error handler providing structured JSON diagnostics
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Signs in clinic staff using Google OAuth Popup
 */
export async function signInDoctorWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs out clinic staff
 */
export async function signOutDoctor(): Promise<void> {
  await signOut(auth);
}

/**
 * Normalizes phone numbers into alphanumeric document ID key (e.g., 15550000000)
 * Strictly satisfies Firestore ID regex ^[a-zA-Z0-9_\-]+$
 */
export function normalizePhoneDocId(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  return digits || '10000000000';
}

/**
 * Converts Firestore timestamp or string to ISO string safely
 */
export function toIsoString(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val?.toDate === 'function') return val.toDate().toISOString();
  return new Date().toISOString();
}

/**
 * Saves a new patient appointment to Cloud Firestore with mandatory audit logging
 */
export async function createAppointmentInFirestore(
  appointment: Omit<FirestoreAppointment, 'createdAt'> & { id?: string },
  clientIp: string = 'web-client'
): Promise<FirestoreAppointment> {
  const appointmentId = appointment.id || `apt-${Date.now()}`;
  const path = `appointments/${appointmentId}`;

  // Clean undefined values before sending to Firestore (hasOnly guard)
  const record: Record<string, any> = {
    id: appointmentId,
    patientName: appointment.patientName.trim().slice(0, 100),
    phoneNumber: appointment.phoneNumber.trim().slice(0, 25),
    services: appointment.services.slice(0, 10),
    selectedProducts: (appointment.selectedProducts || []).slice(0, 20),
    appointmentDate: appointment.appointmentDate.slice(0, 10),
    timeSlot: appointment.timeSlot.slice(0, 20),
    status: 'confirmed',
    totalCashEstimated: Number(appointment.totalCashEstimated) || 0,
    tcpaConsent: Boolean(appointment.tcpaConsent),
    hipaaConsent: Boolean(appointment.hipaaConsent),
    createdAt: serverTimestamp()
  };

  if (appointment.email) record.email = appointment.email.trim().slice(0, 120);
  if (appointment.practitioner) record.practitioner = appointment.practitioner.trim().slice(0, 100);
  if (appointment.notes) record.notes = appointment.notes.trim().slice(0, 1000);
  if (appointment.confirmationCode) record.confirmationCode = appointment.confirmationCode.trim().slice(0, 20);
  if (typeof appointment.isNewPatient === 'boolean') record.isNewPatient = appointment.isNewPatient;
  if (typeof appointment.lateFeeIncluded === 'number') record.lateFeeIncluded = appointment.lateFeeIncluded;

  try {
    // 1. Write appointment document
    await setDoc(doc(db, 'appointments', appointmentId), record);

    // 2. Ensure patient index exists (create with feeAmount: 0 if new patient)
    const patientDocId = normalizePhoneDocId(appointment.phoneNumber);
    const patientRef = doc(db, 'patients', patientDocId);
    const existingPatient = await getDoc(patientRef);

    if (!existingPatient.exists()) {
      const newPatient: FirestorePatient = {
        phoneNumber: appointment.phoneNumber.trim().slice(0, 25),
        fullName: appointment.patientName.trim().slice(0, 100),
        unpaidCancellationFee: false,
        feeAmount: 0,
        lastUpdated: serverTimestamp()
      };
      await setDoc(patientRef, newPatient);
    }

    // 3. Append immutable HIPAA audit log
    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const auditEntry: FirestoreAuditLog = {
      timestamp: serverTimestamp(),
      action: 'CREATE',
      performedBy: appointment.patientName.trim().slice(0, 100),
      patientId: patientDocId,
      ipAddress: clientIp.slice(0, 50),
      details: {
        appointmentId,
        servicesCount: appointment.services.length,
        totalCashEstimated: record.totalCashEstimated,
        lateFeeIncluded: record.lateFeeIncluded || 0,
        tcpaConsent: record.tcpaConsent,
        hipaaConsent: record.hipaaConsent
      }
    };
    await setDoc(doc(db, 'audit_logs', auditLogId), auditEntry);

    return {
      ...(record as FirestoreAppointment),
      createdAt: new Date().toISOString()
    };
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
    const hasFee = Boolean(data.unpaidCancellationFee);
    return {
      hasFee,
      feeAmount: hasFee ? (data.feeAmount || 10.0) : 0
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Subscribes to live clinic appointments in Firestore (for authenticated clinic staff)
 */
export function subscribeToAppointments(
  onData: (appointments: FirestoreAppointment[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'appointments';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data() as FirestoreAppointment;
        return {
          ...data,
          id: d.id,
          createdAt: toIsoString(data.createdAt),
          lastUpdated: data.lastUpdated ? toIsoString(data.lastUpdated) : undefined
        };
      });
      // Sort newest / upcoming cleanly
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  );
}

/**
 * Updates an appointment status (e.g., completed, cancelled) with audit trail
 */
export async function updateAppointmentStatusInFirestore(
  appointmentId: string,
  newStatus: FirestoreAppointment['status'],
  performedBy: string = auth.currentUser?.email || 'Dr. James Qado, DDS',
  clientIp: string = 'staff-portal'
): Promise<void> {
  const path = `appointments/${appointmentId}`;

  try {
    const aptRef = doc(db, 'appointments', appointmentId);
    const snap = await getDoc(aptRef);
    if (!snap.exists()) {
      return;
    }

    const currentApt = snap.data() as FirestoreAppointment;

    await updateDoc(aptRef, {
      status: newStatus,
      lastUpdated: serverTimestamp()
    });

    const patientDocId = normalizePhoneDocId(currentApt.phoneNumber);
    const patientRef = doc(db, 'patients', patientDocId);
    const patientSnap = await getDoc(patientRef);

    // If cancelled/no-show, flag $10 late cancellation fee on patient record
    if (newStatus === 'cancelled') {
      if (patientSnap.exists()) {
        await updateDoc(patientRef, {
          unpaidCancellationFee: true,
          feeAmount: 10.0,
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(patientRef, {
          phoneNumber: currentApt.phoneNumber,
          fullName: currentApt.patientName,
          unpaidCancellationFee: true,
          feeAmount: 10.0,
          lastUpdated: serverTimestamp()
        });
      }
    }

    // If completed & paid and patient had an unpaid cancellation fee, clear it
    if (newStatus === 'completed' && patientSnap.exists() && patientSnap.data()?.unpaidCancellationFee) {
      await markPatientFeePaidInFirestore(currentApt.phoneNumber, performedBy, clientIp);
    }

    // Append to immutable audit log
    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const auditEntry: FirestoreAuditLog = {
      timestamp: serverTimestamp(),
      action: newStatus === 'cancelled' ? 'CANCEL' : 'STATUS_CHANGE',
      performedBy: performedBy.slice(0, 100),
      patientId: patientDocId,
      ipAddress: clientIp.slice(0, 50),
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
 * Deletes an appointment record (Staff Admin only)
 */
export async function deleteAppointmentInFirestore(appointmentId: string): Promise<void> {
  const path = `appointments/${appointmentId}`;
  try {
    await deleteDoc(doc(db, 'appointments', appointmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Settles/marks paid an outstanding cancellation fee for a patient
 */
export async function markPatientFeePaidInFirestore(
  phoneNumber: string,
  performedBy: string = auth.currentUser?.email || 'Dr. James Qado, DDS',
  clientIp: string = 'staff-portal'
): Promise<void> {
  const patientDocId = normalizePhoneDocId(phoneNumber);
  const path = `patients/${patientDocId}`;

  try {
    const patientRef = doc(db, 'patients', patientDocId);
    const snap = await getDoc(patientRef);
    if (snap.exists()) {
      await updateDoc(patientRef, {
        unpaidCancellationFee: false,
        feeAmount: 0.0,
        lastUpdated: serverTimestamp()
      });
    }

    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const auditEntry: FirestoreAuditLog = {
      timestamp: serverTimestamp(),
      action: 'MARK_PAID',
      performedBy: performedBy.slice(0, 100),
      patientId: patientDocId,
      ipAddress: clientIp.slice(0, 50),
      details: { feePaid: 10.0 }
    };
    await setDoc(doc(db, 'audit_logs', auditLogId), auditEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export default app;
