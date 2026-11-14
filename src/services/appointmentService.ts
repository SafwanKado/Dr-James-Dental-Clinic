/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getTodayDateString } from '../utils/dateUtils';
import {
  auth,
  createAppointmentInFirestore,
  updateAppointmentStatusInFirestore,
  deleteAppointmentInFirestore
} from '../firebase';
import { FirestoreAppointment } from '../types/firestore';

export interface BookedProductItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface BookedServiceItem {
  id: string;
  name: string;
  price: number;
  duration: string;
}

export interface Appointment {
  id: string;
  confirmationCode: string;
  patientName: string;
  email?: string;
  phone: string;
  serviceId?: string;
  serviceName: string;
  services: BookedServiceItem[];
  products?: BookedProductItem[];
  totalCash: number;
  lateFeeIncluded?: number;
  practitioner: string; // 'Dr. James Qado, DDS' or 'Sarah Jenkins, RDH'
  date: string; // YYYY-MM-DD
  timeSlot: string;
  notes?: string;
  insuranceProvider?: string;
  isNewPatient?: boolean;
  tcpaConsent: boolean;
  hipaaConsent: boolean;
  status: 'confirmed' | 'in_chair' | 'completed' | 'cancelled';
  createdAt: string;
}

const STORAGE_KEY = 'qado_dental_appointments_v1';

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-101",
    confirmationCode: "QAD-8842",
    patientName: "Elena Vance",
    email: "elena.vance@example.com",
    phone: "+1 (555) 234-8901",
    serviceId: "full-exam",
    serviceName: "Full Exam",
    services: [{ id: "full-exam", name: "Full Exam", price: 80, duration: "30 min" }],
    products: [{ id: "prod-sensitivity-toothpaste", name: "Sensitivity Toothpaste", price: 12, quantity: 1 }],
    totalCash: 92,
    practitioner: "Dr. James Qado, DDS",
    date: getTodayDateString(),
    timeSlot: "09:15 AM",
    notes: "Patient reports mild sensitivity on lower right molar when drinking cold water.",
    insuranceProvider: "Cash Pay",
    isNewPatient: true,
    tcpaConsent: true,
    hipaaConsent: true,
    status: "in_chair",
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: "apt-102",
    confirmationCode: "QAD-8843",
    patientName: "Marcus Sterling",
    email: "m.sterling@example.com",
    phone: "+1 (555) 492-1102",
    serviceId: "teeth-cleaning",
    serviceName: "Teeth Cleaning",
    services: [{ id: "teeth-cleaning", name: "Teeth Cleaning", price: 90, duration: "45 min" }],
    products: [],
    totalCash: 90,
    practitioner: "Sarah Jenkins, RDH",
    date: getTodayDateString(),
    timeSlot: "10:45 AM",
    notes: "Regular 6-month preventive recall.",
    insuranceProvider: "Cash Pay",
    isNewPatient: false,
    tcpaConsent: true,
    hipaaConsent: true,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString()
  },
  {
    id: "apt-103",
    confirmationCode: "QAD-8844",
    patientName: "Sophia Chen",
    email: "sophia.chen@example.com",
    phone: "+1 (555) 778-9321",
    serviceId: "teeth-whitening",
    serviceName: "Teeth Whitening",
    services: [{ id: "teeth-whitening", name: "Teeth Whitening", price: 200, duration: "60 min" }],
    products: [{ id: "prod-whitening-gel", name: "Professional Whitening Gel", price: 25, quantity: 2 }],
    totalCash: 250,
    practitioner: "Dr. James Qado, DDS",
    date: getTodayDateString(),
    timeSlot: "01:15 PM",
    notes: "Patient requested take-home touchup gel.",
    insuranceProvider: "Cash Pay",
    isNewPatient: false,
    tcpaConsent: true,
    hipaaConsent: true,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString()
  }
];

export function mapFirestoreToAppointment(doc: FirestoreAppointment): Appointment {
  const serviceName = Array.isArray(doc.services) && doc.services.length > 0
    ? doc.services.map(s => s.name).join(' + ')
    : 'Dental Visit';

  return {
    id: doc.id,
    confirmationCode: doc.confirmationCode || `QAD-${doc.id.slice(-4).toUpperCase()}`,
    patientName: doc.patientName,
    email: doc.email,
    phone: doc.phoneNumber,
    serviceId: doc.services?.[0]?.id,
    serviceName,
    services: doc.services || [],
    products: doc.selectedProducts || [],
    totalCash: doc.totalCashEstimated || 0,
    lateFeeIncluded: doc.lateFeeIncluded || 0,
    practitioner: doc.practitioner || 'Dr. James Qado, DDS',
    date: doc.appointmentDate,
    timeSlot: doc.timeSlot,
    notes: doc.notes,
    insuranceProvider: 'Cash Pay',
    isNewPatient: doc.isNewPatient,
    tcpaConsent: doc.tcpaConsent,
    hipaaConsent: doc.hipaaConsent,
    status: doc.status,
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString()
  };
}

export function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_APPOINTMENTS;
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.error("Failed to save appointments to localStorage", e);
  }
}

export function createAppointment(
  data: Omit<Appointment, 'id' | 'confirmationCode' | 'createdAt' | 'status'>
): Appointment {
  const current = getStoredAppointments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newAppointment: Appointment = {
    ...data,
    id: `apt-${Date.now()}`,
    confirmationCode: `QAD-${randomSuffix}`,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  const updated = [newAppointment, ...current];
  saveAppointments(updated);

  // Persist to Cloud Firestore with HIPAA audit log
  createAppointmentInFirestore({
    id: newAppointment.id,
    patientName: newAppointment.patientName,
    phoneNumber: newAppointment.phone,
    email: newAppointment.email,
    services: newAppointment.services,
    selectedProducts: newAppointment.products || [],
    appointmentDate: newAppointment.date,
    timeSlot: newAppointment.timeSlot,
    status: newAppointment.status,
    totalCashEstimated: newAppointment.totalCash,
    lateFeeIncluded: newAppointment.lateFeeIncluded || 0,
    tcpaConsent: Boolean(newAppointment.tcpaConsent),
    hipaaConsent: Boolean(newAppointment.hipaaConsent),
    practitioner: newAppointment.practitioner,
    notes: newAppointment.notes,
    confirmationCode: newAppointment.confirmationCode,
    isNewPatient: newAppointment.isNewPatient
  }).catch(err => {
    console.warn("Firestore appointment sync warning:", err);
  });

  return newAppointment;
}

export function updateAppointmentStatus(id: string, status: Appointment['status']): Appointment[] {
  const current = getStoredAppointments();
  const updated = current.map(item => item.id === id ? { ...item, status } : item);
  saveAppointments(updated);

  if (auth.currentUser) {
    updateAppointmentStatusInFirestore(id, status).catch(err => {
      console.warn("Firestore status update warning:", err);
    });
  }

  return updated;
}

export function deleteAppointment(id: string): Appointment[] {
  const current = getStoredAppointments();
  const updated = current.filter(item => item.id !== id);
  saveAppointments(updated);

  if (auth.currentUser) {
    deleteAppointmentInFirestore(id).catch(err => {
      console.warn("Firestore delete warning:", err);
    });
  }

  return updated;
}
