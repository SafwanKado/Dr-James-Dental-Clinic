/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInDoctorWithGoogle,
  signOutDoctor,
  subscribeToAppointments
} from '../firebase';
import {
  Appointment,
  getStoredAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  mapFirestoreToAppointment,
  saveAppointments
} from '../services/appointmentService';
import { DentalProduct } from '../utils/constants';

interface CartItem {
  product: DentalProduct;
  quantity: number;
}

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface ClinicContextType {
  appointments: Appointment[];
  bookAppointment: (data: Omit<Appointment, 'id' | 'confirmationCode' | 'createdAt' | 'status'>) => Appointment;
  updateStatus: (id: string, status: Appointment['status']) => void;
  cancelAppointment: (id: string) => void;
  cart: CartItem[];
  addToCart: (product: DentalProduct) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  visitRecordItems: { product: DentalProduct; quantity: number }[];
  addToVisitRecord: (product: DentalProduct) => void;
  removeFromVisitRecord: (productId: string) => void;
  clearVisitRecord: () => void;
  visitRecordCount: number;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  preselectedServiceId: string | null;
  setPreselectedServiceId: (id: string | null) => void;
  isDoctorAuthenticated: boolean;
  firebaseUser: User | null;
  isAuthReady: boolean;
  isFirestoreSynced: boolean;
  loginDoctor: (pin: string) => boolean;
  loginDoctorWithGoogle: () => Promise<boolean>;
  logoutDoctor: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => getStoredAppointments());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [visitRecordItems, setVisitRecordItems] = useState<{ product: DentalProduct; quantity: number }[]>(() => {
    try {
      const stored = localStorage.getItem('dr_qado_visit_record');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isFirestoreSynced, setIsFirestoreSynced] = useState<boolean>(false);
  const [isPinAuthenticated, setIsPinAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('dr_qado_auth') === 'true';
  });

  const isDoctorAuthenticated = Boolean(firebaseUser) || isPinAuthenticated;

  useEffect(() => {
    try {
      localStorage.setItem('dr_qado_visit_record', JSON.stringify(visitRecordItems));
    } catch (e) {
      console.error(e);
    }
  }, [visitRecordItems]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Attach live Firestore onSnapshot listener only when auth is ready and staff user is signed in
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) {
      setIsFirestoreSynced(false);
      return;
    }

    const unsubscribe = subscribeToAppointments(
      (cloudList) => {
        const mapped = cloudList.map(mapFirestoreToAppointment);
        setAppointments(mapped);
        saveAppointments(mapped);
        setIsFirestoreSynced(true);
      },
      (error) => {
        console.warn('Firestore listener notice:', error);
        setIsFirestoreSynced(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, firebaseUser]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleBookAppointment = (data: Omit<Appointment, 'id' | 'confirmationCode' | 'createdAt' | 'status'>) => {
    const newApt = createAppointment(data);
    setAppointments(prev => [newApt, ...prev]);
    showToast(`Appointment confirmed! Booking Ref: ${newApt.confirmationCode}`);
    return newApt;
  };

  const handleUpdateStatus = (id: string, status: Appointment['status']) => {
    const updated = updateAppointmentStatus(id, status);
    setAppointments(updated);
    showToast(`Appointment status updated to ${status.replace('_', ' ')}`);
  };

  const handleCancelAppointment = (id: string) => {
    const updated = deleteAppointment(id);
    setAppointments(updated);
    showToast(`Appointment removed from schedule`, 'info');
  };

  const addToCart = (product: DentalProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Added "${product.name}" to clinic order`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Visit Record Attachments
  const addToVisitRecord = (product: DentalProduct) => {
    setVisitRecordItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Attached "${product.name}" ($${product.price}) to your upcoming visit record`);
  };

  const removeFromVisitRecord = (productId: string) => {
    setVisitRecordItems(prev => prev.filter(item => item.product.id !== productId));
    showToast("Removed item from visit record", "info");
  };

  const clearVisitRecord = () => {
    setVisitRecordItems([]);
  };

  const visitRecordCount = visitRecordItems.reduce((sum, item) => sum + item.quantity, 0);

  const loginDoctor = (pin: string) => {
    if (pin.trim() === '1234' || pin.trim() === '9911' || pin.trim() === 'doctor') {
      setIsPinAuthenticated(true);
      sessionStorage.setItem('dr_qado_auth', 'true');
      showToast("Welcome back, Dr. Qado. Provider Portal unlocked.");
      return true;
    }
    showToast("Incorrect security PIN. Please try again (Demo PIN: 1234).", "error");
    return false;
  };

  const loginDoctorWithGoogle = async (): Promise<boolean> => {
    try {
      const user = await signInDoctorWithGoogle();
      setIsPinAuthenticated(true);
      sessionStorage.setItem('dr_qado_auth', 'true');
      showToast(`Signed in with Google (${user.email}). Live Cloud Firestore sync active.`);
      return true;
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      showToast('Google Sign-In could not be completed. Please try again or use your staff PIN.', 'error');
      return false;
    }
  };

  const logoutDoctor = () => {
    setIsPinAuthenticated(false);
    sessionStorage.removeItem('dr_qado_auth');
    if (firebaseUser) {
      signOutDoctor().catch(console.error);
    }
    showToast("Logged out of Provider Portal.", "info");
  };

  return (
    <ClinicContext.Provider
      value={{
        appointments,
        bookAppointment: handleBookAppointment,
        updateStatus: handleUpdateStatus,
        cancelAppointment: handleCancelAppointment,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
        visitRecordItems,
        addToVisitRecord,
        removeFromVisitRecord,
        clearVisitRecord,
        visitRecordCount,
        toasts,
        showToast,
        preselectedServiceId,
        setPreselectedServiceId,
        isDoctorAuthenticated,
        firebaseUser,
        isAuthReady,
        isFirestoreSynced,
        loginDoctor,
        loginDoctorWithGoogle,
        logoutDoctor
      }}
    >
      {children}

      {/* Floating Notification Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 ${
              toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : toast.type === 'info'
                ? 'bg-slate-900 text-slate-100 border-slate-700'
                : 'bg-emerald-950 text-emerald-100 border-emerald-800'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
