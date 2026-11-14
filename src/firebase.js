/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Exported standard JavaScript entry point for Firebase SDK initialization
export {
  db,
  auth,
  signInDoctorWithGoogle,
  signOutDoctor,
  normalizePhoneDocId,
  subscribeToAppointments,
  createAppointmentInFirestore,
  getPatientCancellationFee,
  updateAppointmentStatusInFirestore,
  deleteAppointmentInFirestore,
  markPatientFeePaidInFirestore,
  handleFirestoreError
} from './firebase.ts';
