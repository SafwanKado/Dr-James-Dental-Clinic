/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  LogOut,
  Search,
  Cloud,
  XCircle,
  DollarSign
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { formatDate, getTodayDateString, TIME_SLOTS } from '../utils/dateUtils';

export const DoctorPortal: React.FC = () => {
  const {
    appointments,
    updateStatus,
    cancelAppointment,
    bookAppointment,
    isDoctorAuthenticated,
    firebaseUser,
    isFirestoreSynced,
    loginDoctor,
    loginDoctorWithGoogle,
    logoutDoctor
  } = useClinic();

  const [pinInput, setPinInput] = useState('');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Walk-in / Hold state
  const [newPatientName, setNewPatientName] = useState('');
  const [newService, setNewService] = useState('Emergency Relief / Walk-in');
  const [newDate, setNewDate] = useState(getTodayDateString());
  const [newTime, setNewTime] = useState(TIME_SLOTS[3]);
  const [newNotes, setNewNotes] = useState('');

  const handleGoogleLogin = async () => {
    setIsGoogleSigningIn(true);
    try {
      await loginDoctorWithGoogle();
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Authentication Gate Screen
  if (!isDoctorAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6 text-teal-400" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dr. James Qado Portal
            </h1>
            <p className="text-xs text-slate-500">
              Restricted Provider & Staff Administrative Access
            </p>
          </div>

          {/* Primary Google Sign-In for Cloud Firestore Access */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={isGoogleSigningIn}
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-70"
            >
              <Cloud className="w-4 h-4" />
              <span>
                {isGoogleSigningIn ? 'Connecting Google Account...' : 'Sign in with Google (Cloud Sync)'}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Recommended for live Cloud Firestore schedule & audit log access.
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Or Staff PIN
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginDoctor(pinInput);
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Staff Security PIN
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="Enter 4-digit PIN (1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Unlock with PIN
            </button>
          </form>

          {/* Quick Demo Bypass Assistant */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl text-center space-y-2">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Quick Local Preview Unlock:</span>
            </div>
            <button
              type="button"
              onClick={() => loginDoctor('1234')}
              className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Instant Unlock (Demo PIN: 1234)</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400">
            Protected by HIPAA physical and technical security safeguards.
          </p>
        </div>
      </div>
    );
  }

  // Filtered Appointments
  const todayString = getTodayDateString();
  const todayAppointments = appointments.filter(a => a.date === todayString);
  const todayCashExpected = todayAppointments
    .filter(a => a.status !== 'cancelled')
    .reduce((sum, a) => sum + (a.totalCash || 0), 0);

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus =
      selectedStatusFilter === 'all'
        ? true
        : selectedStatusFilter === 'today'
        ? apt.date === todayString
        : apt.status === selectedStatusFilter;

    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.phone.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    bookAppointment({
      patientName: newPatientName.trim(),
      email: "in-clinic@qadodental.com",
      phone: "+1 (555) 000-0000",
      serviceId: "walkin",
      serviceName: newService,
      services: [{ id: "walkin", name: newService, price: 80, duration: "30 min" }],
      products: [],
      totalCash: 80,
      practitioner: "Dr. James Qado, DDS",
      date: newDate,
      timeSlot: newTime,
      insuranceProvider: "Cash Pay / Clinic Direct Triage",
      isNewPatient: true,
      tcpaConsent: true,
      hipaaConsent: true,
      notes: newNotes.trim()
    });

    setIsAddModalOpen(false);
    setNewPatientName('');
    setNewNotes('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Top Portal Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-600 flex items-center justify-center font-bold text-lg sm:text-xl font-serif shrink-0">
            JQ
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-teal-400">
                Staff Private Portal
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-[11px] sm:text-xs text-slate-300 truncate">
                {firebaseUser ? firebaseUser.email : 'Local PIN Session'}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate">
              Daily Cash Schedule & Patient Queue
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-700" />
            <span>Add Walk-In</span>
          </button>
          <button
            type="button"
            onClick={logoutDoctor}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Portal</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Prompt Banner (only shown if unlocked via demo PIN without Google Auth) */}
      {!firebaseUser && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-teal-950">
            <strong className="block text-sm text-teal-900">Connect Google Account for Live Cloud Sync</strong>
            <span>Currently viewing local session data. Sign in with Google to sync patient bookings and cancellation fees with Cloud Firestore.</span>
          </div>
          <button
            type="button"
            disabled={isGoogleSigningIn}
            onClick={handleGoogleLogin}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{isGoogleSigningIn ? 'Connecting...' : 'Connect Google Account'}</span>
          </button>
        </div>
      )}

      {/* Minimal Mobile-First Daily Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
          <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider block mb-1">Today's Visits</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {todayAppointments.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">{formatDate(todayString)}</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
          <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider block mb-1">Today's Cash Due</span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums flex items-center gap-0.5">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span>{todayCashExpected.toFixed(0)}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Collect at front desk</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex sm:block items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider block mb-1">Completed & Paid</span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {appointments.filter(a => a.status === 'completed').length}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 sm:mt-1 block">
            {isFirestoreSynced ? 'Synced with Cloud Firestore' : 'Saved locally'}
          </span>
        </div>
      </div>

      {/* Patient Schedule List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: `Today (${todayAppointments.length})` },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'completed', label: 'Paid' },
              { id: 'cancelled', label: 'No-Show / Cancel' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedStatusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, phone, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Appointments List */}
        <div className="divide-y divide-slate-100">
          {filteredAppointments.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto stroke-[1.2] mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No appointments matching this filter</p>
              <p className="text-xs text-slate-400 mt-1">New bookings appear here automatically.</p>
            </div>
          ) : (
            filteredAppointments.map(apt => (
              <div
                key={apt.id}
                className="p-4 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6"
              >
                {/* Patient Info, Products & Cash Total */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                      {apt.confirmationCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {apt.patientName}
                    </h3>
                    {apt.status === 'completed' && (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Complete & Paid
                      </span>
                    )}
                    {apt.status === 'cancelled' && (
                      <span className="text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        Cancelled / $10 Fee Flagged
                      </span>
                    )}
                    {apt.lateFeeIncluded && apt.lateFeeIncluded > 0 ? (
                      <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Includes ${apt.lateFeeIncluded} Late Fee
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="font-semibold text-slate-900">{apt.serviceName}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="tabular-nums font-medium text-slate-700">
                      {formatDate(apt.date)} at {apt.timeSlot}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-700">{apt.phone}</span>
                  </div>

                  <div className="text-sm font-bold text-emerald-700 tabular-nums pt-0.5">
                    Cash to Collect: ${(apt.totalCash || 0).toFixed(2)}
                  </div>

                  {/* Requested Dental Products */}
                  {apt.products && apt.products.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-teal-800">Requested Products:</span>
                      {apt.products.map(p => (
                        <span
                          key={p.id}
                          className="text-[11px] bg-teal-50 border border-teal-200 text-teal-900 px-2 py-0.5 rounded-md font-medium"
                        >
                          {p.name} (x{p.quantity}) · ${p.price * p.quantity}
                        </span>
                      ))}
                    </div>
                  )}

                  {apt.notes && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 mt-1.5">
                      <span className="font-bold">Patient Note: </span>
                      {apt.notes}
                    </div>
                  )}
                </div>

                {/* 2 Primary Mobile-First Action Buttons + Delete */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateStatus(apt.id, 'completed')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                      apt.status === 'completed'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-700 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete & Paid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(apt.id, 'cancelled')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                      apt.status === 'cancelled'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-700 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>No-Show / Cancel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cancelAppointment(apt.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Walk-in / Block Time Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Add Walk-in or Block Operatory
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddWalkIn} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Patient or Block Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Smith (Walk-in) or [Operatory Maintenance]"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Procedure / Reason
                </label>
                <input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Time
                  </label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none bg-white"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Staff Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Triage symptoms, referral details, or room prep..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer"
              >
                Insert into Today's Schedule
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
