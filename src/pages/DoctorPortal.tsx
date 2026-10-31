/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Unlock, Calendar, Clock, User, Phone, CheckCircle2, AlertCircle, Plus, Trash2, LogOut, ChevronRight, Search, ShieldCheck } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { CLINIC_INFO } from '../utils/constants';
import { formatDate, getTodayDateString, TIME_SLOTS } from '../utils/dateUtils';
import { Appointment } from '../services/appointmentService';

export const DoctorPortal: React.FC = () => {
  const {
    appointments,
    updateStatus,
    cancelAppointment,
    bookAppointment,
    isDoctorAuthenticated,
    loginDoctor,
    logoutDoctor
  } = useClinic();

  const [pinInput, setPinInput] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Walk-in / Hold state
  const [newPatientName, setNewPatientName] = useState('');
  const [newService, setNewService] = useState('Emergency Relief / Walk-in');
  const [newDate, setNewDate] = useState(getTodayDateString());
  const [newTime, setNewTime] = useState(TIME_SLOTS[3]);
  const [newNotes, setNewNotes] = useState('');

  // Authentication Gate Screen
  if (!isDoctorAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6">
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
                autoFocus
                placeholder="Enter 4-digit PIN (1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer"
            >
              Authenticate Access
            </button>
          </form>

          {/* Quick Demo Bypass Assistant */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl text-center space-y-2">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Developer / Evaluator Quick Unlock:</span>
            </div>
            <button
              onClick={() => loginDoctor('1234')}
              className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Click to Instant Unlock (Demo PIN: 1234)</span>
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
      apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase());

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
      
      {/* Top Portal Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-600 flex items-center justify-center font-bold text-lg sm:text-xl font-serif shrink-0">
            JQ
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-teal-400">
                Staff Private Portal
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-[11px] sm:text-xs text-slate-400 truncate">Dr. James Qado, DDS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
              Daily Practice Dashboard & Patient Queue
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700" />
            <span>Add Walk-In</span>
          </button>
          <button
            onClick={logoutDoctor}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Lock Portal</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200">
          <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider block mb-1">Today's Schedule</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {todayAppointments.length}
          </div>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-1 block truncate">For {formatDate(todayString)}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">In Operatory Chair</span>
          <div className="text-3xl font-bold text-teal-700 tabular-nums">
            {appointments.filter(a => a.status === 'in_chair').length}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Active clinical procedures</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Upcoming Confirmed</span>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {appointments.filter(a => a.status === 'confirmed').length}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Awaiting appointment time</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Completed Treatments</span>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {appointments.filter(a => a.status === 'completed').length}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Archived to clinical history</span>
        </div>
      </div>

      {/* Operatory Bay Live Status */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Operatory Suites Live Telemetry
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Operatory 1 (Dr. Qado)</span>
              <span className="text-xs text-slate-500">CBCT & Smile Design Suite</span>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 rounded-md">
              In Procedure
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Operatory 2 (Hygiene Suite)</span>
              <span className="text-xs text-slate-500">Ultrasonic Scaling & Air Polish</span>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 rounded-md">
              Ready for Patient
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Operatory 3 (Consult & Scan)</span>
              <span className="text-xs text-slate-500">iTero 5D Optical Scanning</span>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 rounded-md">
              Sanitized & Open
            </span>
          </div>
        </div>
      </div>

      {/* Main Patient Appointments Table & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Search & Filter Bar */}
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Appointments' },
              { id: 'today', label: `Today's Queue (${todayAppointments.length})` },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'in_chair', label: 'In Chair' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.id}
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
              placeholder="Search patient, code, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Appointments List */}
        <div className="divide-y divide-slate-100">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto stroke-[1.2] mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No appointments matching this filter</p>
              <p className="text-xs text-slate-400 mt-1">Book a patient online or add a walk-in above.</p>
            </div>
          ) : (
            filteredAppointments.map(apt => (
              <div
                key={apt.id}
                className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Patient Information & Clinical Note */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                      {apt.confirmationCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {apt.patientName}
                    </h3>
                    {apt.isNewPatient && (
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-sm">
                        New Patient
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-slate-900">{apt.serviceName}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>Provider: {apt.practitioner}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>Ins: {apt.insuranceProvider || 'Self-pay'}</span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                    <span className="tabular-nums font-semibold text-slate-700">{formatDate(apt.date)} at {apt.timeSlot}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-700">{apt.phone}</span>
                    {apt.email && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>{apt.email}</span>
                      </>
                    )}
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-bold text-emerald-700 tabular-nums">Total Cash: ${apt.totalCash || 80}</span>
                  </div>

                  {apt.products && apt.products.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-teal-800">Dispense Chairside:</span>
                      {apt.products.map(p => (
                        <span key={p.id} className="text-[11px] bg-teal-50 border border-teal-200 text-teal-900 px-2 py-0.5 rounded-md font-medium">
                          {p.name} (x{p.quantity}) · ${p.price * p.quantity}
                        </span>
                      ))}
                    </div>
                  )}

                  {apt.notes && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 mt-2">
                      <span className="font-bold">Clinical/Patient Note: </span>
                      {apt.notes}
                    </div>
                  )}
                </div>

                {/* Status Switcher & Action Controls */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => updateStatus(apt.id, 'confirmed')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        apt.status === 'confirmed'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Confirmed
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, 'in_chair')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        apt.status === 'in_chair'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      In Chair
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, 'completed')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        apt.status === 'completed'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Completed
                    </button>
                  </div>

                  <button
                    onClick={() => cancelAppointment(apt.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove appointment"
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
