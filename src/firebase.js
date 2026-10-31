/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Exported standard JavaScript entry point for Firebase SDK initialization
export {
  db,
  auth,
  createAppointmentInFirestore,
  getPatientCancellationFee,
  updateAppointmentStatusInFirestore,
  markPatientFeePaidInFirestore,
  handleFirestoreError
} from './firebase.ts';
