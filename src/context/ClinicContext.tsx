/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment, getStoredAppointments, createAppointment, updateAppointmentStatus, deleteAppointment } from '../services/appointmentService';
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
  loginDoctor: (pin: string) => boolean;
  logoutDoctor: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('dr_qado_auth') === 'true';
  });

  useEffect(() => {
    try {
      localStorage.setItem('dr_qado_visit_record', JSON.stringify(visitRecordItems));
    } catch (e) {
      console.error(e);
    }
  }, [visitRecordItems]);


  useEffect(() => {
    setAppointments(getStoredAppointments());
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleBookAppointment = (data: Omit<Appointment, 'id' | 'confirmationCode' | 'createdAt' | 'status'>) => {
    const newApt = createAppointment(data);
    setAppointments(getStoredAppointments());
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
    // Default PIN: 1234 or direct access
    if (pin.trim() === '1234' || pin.trim() === '9911' || pin.trim() === 'doctor') {
      setIsDoctorAuthenticated(true);
      sessionStorage.setItem('dr_qado_auth', 'true');
      showToast("Welcome back, Dr. Qado. Provider Portal unlocked.");
      return true;
    }
    showToast("Incorrect security PIN. Please try again (Demo PIN: 1234).", "error");
    return false;
  };

  const logoutDoctor = () => {
    setIsDoctorAuthenticated(false);
    sessionStorage.removeItem('dr_qado_auth');
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
        loginDoctor,
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
