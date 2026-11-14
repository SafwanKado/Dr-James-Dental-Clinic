/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Shield,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  BookmarkPlus,
  Lock,
  MessageSquare
} from 'lucide-react';
import { DENTAL_SERVICES, CLINIC_INFO, DentalProduct, DentalService } from '../utils/constants';
import { CLINIC_PRODUCTS } from '../services/productService';
import { getUpcomingDays, TIME_SLOTS, formatDate } from '../utils/dateUtils';
import { useClinic } from '../context/ClinicContext';
import { getPatientCancellationFee } from '../firebase';

// Helper to format US phone number (+1 (XXX) XXX-XXXX)
function formatUSPhoneNumber(value: string): string {
  // Extract only digits
  const cleaned = value.replace(/\D/g, '');
  
  // Strip leading 1 if provided as country code
  const digits = cleaned.startsWith('1') ? cleaned.slice(1) : cleaned;
  const trimmed = digits.slice(0, 10);

  if (trimmed.length === 0) return '';
  if (trimmed.length < 4) return `+1 (${trimmed}`;
  if (trimmed.length < 7) return `+1 (${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
  return `+1 (${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
}

function isValidUSPhone(formatted: string): boolean {
  const digits = formatted.replace(/\D/g, '');
  // either 10 digits or 11 digits starting with 1
  return (digits.length === 11 && digits.startsWith('1')) || digits.length === 10;
}

export const Booking: React.FC = () => {
  const navigate = useNavigate();
  const {
    preselectedServiceId,
    setPreselectedServiceId,
    bookAppointment,
    visitRecordItems,
    addToVisitRecord,
    removeFromVisitRecord,
    clearVisitRecord,
    showToast
  } = useClinic();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Selected Core Service(s) (Allow multi-selection)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => {
    return preselectedServiceId ? [preselectedServiceId] : ['full-exam'];
  });

  // Step 2: Date & Time
  const upcomingDays = getUpcomingDays(14);
  const firstAvailable = upcomingDays.find(d => !d.isWeekend) || upcomingDays[0];
  const [practitioner, setPractitioner] = useState<string>('Dr. James Qado, DDS');
  const [selectedDate, setSelectedDate] = useState<string>(firstAvailable.dateString);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(TIME_SLOTS[2]); // 10:00 AM

  // Step 3: Local attached products state (synced with clinic visitRecordItems)
  const [localProducts, setLocalProducts] = useState<{ product: DentalProduct; quantity: number }[]>([]);

  // Step 4: Patient Details
  const [patientName, setPatientName] = useState<string>('');
  const [rawPhone, setRawPhone] = useState<string>('+1 ');
  const [email, setEmail] = useState<string>('');
  const [isNewPatient, setIsNewPatient] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // Step 5: Consents & Fee Lookup
  const [tcpaConsent, setTcpaConsent] = useState<boolean>(false);
  const [hipaaConsent, setHipaaConsent] = useState<boolean>(false);
  const [unpaidCancellationFee, setUnpaidCancellationFee] = useState<number>(0);
  const [isCheckingFee, setIsCheckingFee] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Sync initial preselection if navigated with query or context
  useEffect(() => {
    if (preselectedServiceId && !selectedServiceIds.includes(preselectedServiceId)) {
      setSelectedServiceIds(prev => [...prev, preselectedServiceId]);
    }
  }, [preselectedServiceId]);

  // Sync products attached from the Products page
  useEffect(() => {
    if (visitRecordItems.length > 0 && localProducts.length === 0) {
      setLocalProducts(visitRecordItems);
    }
  }, [visitRecordItems]);

  // Calculate selected services
  const selectedServices = DENTAL_SERVICES.filter(s => selectedServiceIds.includes(s.id));
  
  // Calculate pricing numbers
  const servicesPriceTotal = selectedServices.reduce((sum, s) => {
    const num = parseInt(s.priceEstimate.replace(/[^0-9]/g, ''), 10) || 0;
    return sum + num;
  }, 0);

  // Estimate total procedural duration
  const totalMinutes = selectedServices.reduce((sum, s) => {
    const mins = parseInt(s.duration.replace(/[^0-9]/g, ''), 10) || 30;
    return sum + mins;
  }, 0);

  // Calculate products total
  const productsTotal = localProducts.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Grand Total Cash Due (Services + Products + Previous $10 Late Cancellation Fee if applicable)
  const grandCashTotal = servicesPriceTotal + productsTotal + unpaidCancellationFee;

  // Toggle service selection
  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // Quick Select Bundle
  const handleSelectBundle = () => {
    setSelectedServiceIds(['full-exam', 'dental-xrays', 'teeth-cleaning']);
    showToast("Selected Comprehensive Preventive Bundle (Exam + X-Rays + Cleaning)");
  };

  // Product quantity controls in Step 3
  const handleProductQuantityChange = (product: DentalProduct, delta: number) => {
    setLocalProducts(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (!existing && delta > 0) {
        return [...prev, { product, quantity: 1 }];
      }
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) {
          return prev.filter(item => item.product.id !== product.id);
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      }
      return prev;
    });
  };

  // Phone input formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUSPhoneNumber(e.target.value);
    setRawPhone(formatted);
  };

  // Navigation between steps
  const goToNextStep = async () => {
    if (step === 1 && selectedServiceIds.length === 0) {
      showToast("Please select at least one dental service.", "error");
      return;
    }
    if (step === 2 && (!selectedDate || !selectedTimeSlot)) {
      showToast("Please select a date and an available appointment time slot.", "error");
      return;
    }
    if (step === 4) {
      if (!patientName.trim() || patientName.trim().length < 2) {
        showToast("Please enter your Full Legal Name (at least 2 characters).", "error");
        return;
      }
      if (!isValidUSPhone(rawPhone)) {
        showToast("Please enter a valid 10-digit U.S. mobile phone number (+1).", "error");
        return;
      }
      // Look up any unpaid $10 late cancellation fee from Cloud Firestore
      setIsCheckingFee(true);
      try {
        const feeStatus = await getPatientCancellationFee(rawPhone);
        setUnpaidCancellationFee(feeStatus.hasFee ? feeStatus.feeAmount : 0);
        if (feeStatus.hasFee) {
          showToast(`Notice: A previous $${feeStatus.feeAmount} late cancellation balance was added to your visit estimate.`, "info");
        }
      } catch (err) {
        console.warn("Cancellation fee lookup notice:", err);
        setUnpaidCancellationFee(0);
      } finally {
        setIsCheckingFee(false);
      }
    }
    setStep((prev) => (prev + 1) as any);
  };

  const goToPrevStep = () => {
    setStep((prev) => (prev - 1) as any);
  };

  // Final Submission (Saves to Firestore / persistent store)
  const handleFinalBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tcpaConsent || !hipaaConsent) {
      showToast("Please agree to the mandatory TCPA SMS opt-in and HIPAA privacy terms to confirm your appointment.", "error");
      return;
    }

    setIsSubmitting(true);

    const bookedServices = selectedServices.map(s => ({
      id: s.id,
      name: s.name,
      price: parseInt(s.priceEstimate.replace(/[^0-9]/g, ''), 10) || 0,
      duration: s.duration
    }));

    const bookedProducts = localProducts.map(p => ({
      id: p.product.id,
      name: p.product.name,
      price: p.product.price,
      quantity: p.quantity
    }));

    const compositeServiceName = selectedServices.map(s => s.name).join(' + ');

    // Call store/context to save persistent appointment record
    const createdAppointment = bookAppointment({
      patientName: patientName.trim(),
      phone: rawPhone,
      email: email.trim() || undefined,
      serviceName: compositeServiceName,
      services: bookedServices,
      products: bookedProducts,
      totalCash: grandCashTotal,
      lateFeeIncluded: unpaidCancellationFee,
      practitioner,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      insuranceProvider: "Cash Only (Dr. Qado Fee Schedule)",
      isNewPatient,
      tcpaConsent: true,
      hipaaConsent: true,
      notes: notes.trim()
    });

    // Clear context visit record after successful booking
    clearVisitRecord();

    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmedBooking(createdAppointment);
      setStep(6); // Step 6 is the Confirmation Screen
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      
      {/* 5-Step Process Indicator Header */}
      {step < 6 && (
        <div className="mb-8 sm:mb-10 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <span>Online Scheduling</span>
            <span aria-hidden="true">·</span>
            <span>Cash-Friendly Upfront Pricing</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Book Appointment with Dr. James Qado
          </h1>

          {/* Stepper Bar */}
          <div className="pt-1 sm:pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 sm:hidden mb-2">
              <span className="text-slate-500">Step {step} of 5</span>
              <span className="text-teal-800">
                {[
                  '1. Select Services',
                  '2. Date & Time',
                  '3. Optional Products',
                  '4. Patient Details',
                  '5. Consent & Summary'
                ][step - 1]}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { num: 1, label: 'Services' },
                { num: 2, label: 'Date & Time' },
                { num: 3, label: 'Products' },
                { num: 4, label: 'Patient Info' },
                { num: 5, label: 'Consent & Total' }
              ].map((s) => (
                <div key={s.num} className="space-y-1 sm:space-y-1.5">
                  <div
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      step >= s.num ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`hidden sm:block text-[11px] font-medium truncate ${
                      step === s.num
                        ? 'text-slate-950 font-bold'
                        : step > s.num
                        ? 'text-teal-800 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.num}. {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 1: Select Core Service(s)
         ======================================================== */}
      {step === 1 && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Step 1: Select Core Service(s)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose one or combine multiple services for your visit. All fees are exact cash rates.
                </p>
              </div>

              {/* Bundle Shortcut */}
              <button
                type="button"
                onClick={handleSelectBundle}
                className="px-3.5 py-2 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>Select Complete Checkup ($200)</span>
              </button>
            </div>

            {/* Core Services Cards with Multi-Select Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DENTAL_SERVICES.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);

                return (
                  <div
                    key={service.id}
                    onClick={() => handleToggleService(service.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-mono text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{service.duration}</span>
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {service.name}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        {service.shortDescription}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                        Exact Cash Rate
                      </span>
                      <span className="text-lg font-bold text-slate-900 tabular-nums">
                        {service.priceEstimate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Services Summary Strip */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">
                  {selectedServices.length} {selectedServices.length === 1 ? 'Service' : 'Services'} Selected:
                </span>
                <span className="text-slate-600">
                  {selectedServices.map(s => s.name).join(' · ')}
                </span>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[11px] text-slate-400 block">Est. Duration & Subtotal</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  ~{totalMinutes} min · ${servicesPriceTotal} Cash
                </span>
              </div>
            </div>

            {/* Continue CTA */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={goToNextStep}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-all shadow-sm active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Date & Time</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 2: Choose Available Slot (Date & Time)
         ======================================================== */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Step 2: Choose Available Slot
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your preferred provider, date, and appointment start time.
              </p>
            </div>

            {/* Practitioner Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3">
                Select Dental Practitioner
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPractitioner('Dr. James Qado, DDS')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    practitioner === 'Dr. James Qado, DDS'
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">Dr. James Qado, DDS</div>
                  <div className="text-xs text-slate-500 mt-0.5">Lead Dentist · Restorative & Aesthetic Practice</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPractitioner('Sarah Jenkins, RDH')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    practitioner === 'Sarah Jenkins, RDH'
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">Sarah Jenkins, RDH</div>
                  <div className="text-xs text-slate-500 mt-0.5">Registered Hygienist · Preventive Ultrasonic Cleanings</div>
                </button>
              </div>
            </div>

            {/* Date Selection Strip */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3">
                Select Preferred Date
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {upcomingDays.map((day) => (
                  <button
                    key={day.dateString}
                    type="button"
                    disabled={day.isWeekend && day.dayNum % 2 === 0}
                    onClick={() => setSelectedDate(day.dateString)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedDate === day.dateString
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : day.isWeekend
                        ? 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] block uppercase font-medium">{day.weekday}</span>
                    <span className="text-lg font-bold block my-0.5 tabular-nums">{day.dayNum}</span>
                    <span className="text-[10px] block opacity-80">{day.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3">
                Available Start Times for {formatDate(selectedDate)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-3 px-3 rounded-xl border text-xs font-semibold tabular-nums transition-all cursor-pointer ${
                      selectedTimeSlot === slot
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Navigation Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Services</span>
              </button>

              <button
                type="button"
                onClick={goToNextStep}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Optional Products</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 3: Optional Products (Review & Select with Cash Prices)
         ======================================================== */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Step 3: Optional Products
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select or review products to attach to your visit record. Dr. Qado will dispense these chairside at your cash appointment.
                </p>
              </div>

              {localProducts.length > 0 && (
                <div className="text-xs bg-teal-50 text-teal-900 px-3 py-1.5 rounded-xl border border-teal-200 font-semibold tabular-nums">
                  {localProducts.reduce((sum, item) => sum + item.quantity, 0)} Items Attached (${productsTotal.toFixed(2)})
                </div>
              )}
            </div>

            {/* Products List with Cash Prices and +/- Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLINIC_PRODUCTS.map((prod) => {
                const attached = localProducts.find((i) => i.product.id === prod.id);
                const quantity = attached ? attached.quantity : 0;

                return (
                  <div
                    key={prod.id}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      quantity > 0
                        ? 'border-teal-700 bg-teal-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-4">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-teal-800">
                            {prod.category}
                          </span>
                          <span className="text-sm font-bold text-slate-900 tabular-nums">
                            ${prod.price.toFixed(2)} Cash
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {quantity > 0 ? (
                          <strong className="text-teal-900">Attached: {quantity}x (${(quantity * prod.price).toFixed(2)})</strong>
                        ) : (
                          'Not attached'
                        )}
                      </span>

                      {quantity === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleProductQuantityChange(prod, 1)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Visit Record</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleProductQuantityChange(prod, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center hover:bg-slate-300 transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 tabular-nums w-4 text-center">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleProductQuantityChange(prod, 1)}
                            className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center hover:bg-teal-800 transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Navigation Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Date & Time</span>
              </button>

              <button
                type="button"
                onClick={goToNextStep}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Patient Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 4: Patient Details (Full Name & U.S. Phone Number)
         ======================================================== */}
      {step === 4 && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Step 4: Patient Details
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please enter the patient's legal name and active U.S. mobile phone number (+1).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* U.S. Phone Number (+1) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  U.S. Mobile Phone Number (+1) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={rawPhone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Required for automated appointment confirmation and text reminders.
                </p>
              </div>

              {/* Optional Email */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="eleanor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used to receive digital calendar invites (.ics) and itemized receipts.
                </p>
              </div>
            </div>

            {/* Returning vs New Patient Toggle */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Have you received dental care at Dr. James Qado's clinic before?
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="isNewPatient"
                    checked={isNewPatient}
                    onChange={() => setIsNewPatient(true)}
                    className="accent-slate-900"
                  />
                  <span>Yes, I am a new patient</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="isNewPatient"
                    checked={!isNewPatient}
                    onChange={() => setIsNewPatient(false)}
                    className="accent-slate-900"
                  />
                  <span>No, I am an existing / returning patient</span>
                </label>
              </div>
            </div>

            {/* Sensitivities or Dental Concerns */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Dental Sensitivities or Notes for Dr. Qado (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Sensitivity to cold water, severe dental anxiety, need gentle pacing..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Step Navigation Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Products</span>
              </button>

              <button
                type="button"
                disabled={isCheckingFee}
                onClick={goToNextStep}
                className={`px-6 py-3.5 text-sm font-semibold text-white rounded-xl transition-colors inline-flex items-center gap-2 ${
                  isCheckingFee
                    ? 'bg-slate-500 cursor-wait opacity-80'
                    : 'bg-slate-900 hover:bg-teal-700 cursor-pointer'
                }`}
              >
                {isCheckingFee ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Checking Account...</span>
                  </>
                ) : (
                  <>
                    <span>Review Consent & Summary</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 5: Consent & Summary (Mandatory TCPA, HIPAA, Cash Total & $10 Notice)
         ======================================================== */}
      {step === 5 && (
        <form onSubmit={handleFinalBookingSubmit} className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Step 5: Consent & Visit Summary
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please review your itemized cash summary and complete mandatory regulatory agreements.
              </p>
            </div>

            {/* Itemized Cash Total Summary Box */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                Itemized Cash Summary
              </div>

              {/* Patient and Slot Recap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 block">Patient Name:</span>
                  <strong className="text-slate-900">{patientName}</strong> ({rawPhone})
                </div>
                <div>
                  <span className="text-slate-400 block">Scheduled Time & Provider:</span>
                  <strong className="text-slate-900">{formatDate(selectedDate)} at {selectedTimeSlot}</strong> with {practitioner}
                </div>
              </div>

              {/* Selected Services Itemized */}
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block">Core Dental Treatment(s):</span>
                {selectedServices.map(service => (
                  <div key={service.id} className="flex justify-between items-center text-slate-800">
                    <span>{service.name} ({service.duration})</span>
                    <span className="font-bold tabular-nums">{service.priceEstimate}</span>
                  </div>
                ))}
              </div>

              {/* Attached Products Itemized */}
              {localProducts.length > 0 && (
                <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-semibold block">Attached Oral Care Products (Chairside Pickup):</span>
                  {localProducts.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-slate-800">
                      <span>{item.product.name} (x{item.quantity})</span>
                      <span className="font-bold tabular-nums">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Previous $10 Late Cancellation Balance if present */}
              {unpaidCancellationFee > 0 && (
                <div className="space-y-1 text-xs pt-2 border-t border-amber-200 bg-amber-50/70 -mx-2 px-2 py-2 rounded-lg">
                  <div className="flex justify-between items-center text-amber-900">
                    <span className="font-semibold">Previous Late Cancellation Fee (&lt;24h policy)</span>
                    <span className="font-bold tabular-nums">${unpaidCancellationFee.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Grand Cash Total Due at Visit */}
              <div className="pt-3 border-t-2 border-slate-300 flex items-center justify-between text-base font-bold text-slate-900">
                <span>Total Cash Due At Visit:</span>
                <span className="text-xl text-teal-800 tabular-nums">
                  ${grandCashTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* $10 Late Cancellation Policy Notice */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 leading-relaxed">
                <span className="font-bold block text-sm text-amber-900 mb-0.5">
                  $10 Late Cancellation & No-Show Policy Notice
                </span>
                <span>
                  Our practice reserves operatory space and sterilizes clinical instrumentation specifically for your scheduled time. If you need to reschedule or cancel your visit, please provide at least <strong>24 hours advance notice</strong>. Cancellations with less than 24 hours notice or unexcused missed visits will be assessed a nominal <strong>$10 cancellation fee</strong> on the patient account.
                </span>
              </div>
            </div>

            {/* Mandatory Regulatory Consents */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Mandatory Legal & Communication Consents
              </div>

              {/* TCPA Mandatory SMS Opt-in */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={tcpaConsent}
                  onChange={(e) => setTcpaConsent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-slate-900 shrink-0"
                />
                <div className="text-xs text-slate-700 leading-normal">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Mandatory TCPA SMS Communication Opt-In *
                  </span>
                  <span>
                    By checking this box, I expressly consent to receive appointment confirmations, schedule updates, digital intake links, and reminder text messages from Dr. James Qado Dental Clinic at the mobile phone number provided (<strong>{rawPhone}</strong>). I understand that consent is not a condition of purchase. Message and data rates may apply. Reply STOP at any time to opt-out.
                  </span>
                </div>
              </label>

              {/* HIPAA Privacy Agreement */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={hipaaConsent}
                  onChange={(e) => setHipaaConsent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-slate-900 shrink-0"
                />
                <div className="text-xs text-slate-700 leading-normal">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    HIPAA Privacy Practices & Confidentiality Agreement *
                  </span>
                  <span>
                    I acknowledge that I have reviewed the Notice of Privacy Practices for Dr. James Qado Dental Clinic, and consent to the secure collection, processing, and handling of my medical history and dental diagnostic records in strict adherence to federal HIPAA regulations.
                  </span>
                </div>
              </label>
            </div>

            {/* Step Navigation Controls & Submit */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={goToPrevStep}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Patient Details</span>
              </button>

              <button
                type="submit"
                disabled={!tcpaConsent || !hipaaConsent || isSubmitting}
                className={`px-8 py-4 text-sm font-semibold text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  tcpaConsent && hipaaConsent && !isSubmitting
                    ? 'bg-slate-900 hover:bg-teal-700 active:scale-[0.98]'
                    : 'bg-slate-400 cursor-not-allowed opacity-75'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Database & Dispatching Confirmation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirm & Book Appointment (${grandCashTotal.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      )}

      {/* ========================================================
          STEP 6: Immediate Booking Confirmation
         ======================================================== */}
      {step === 6 && confirmedBooking && (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-8 animate-in zoom-in-95 duration-200 text-left">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 block">
                  Booking Confirmed · Saved to Practice Records
                </span>
                <h2 className="text-2xl font-bold text-slate-900">
                  Appointment Locked for {confirmedBooking.patientName}
                </h2>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 self-start sm:self-auto">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Reference Code</span>
              <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                {confirmedBooking.confirmationCode}
              </span>
            </div>
          </div>

          {/* SMS Notification Banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <span className="font-bold block text-sm text-emerald-900 mb-0.5">
                TCPA SMS Automated Confirmation Dispatched
              </span>
              <span>
                A confirmation text message and automated clinic reminder have been sent to <strong>{confirmedBooking.phone}</strong>. You will receive an arrival text 2 hours prior to your scheduled time.
              </span>
            </div>
          </div>

          {/* Appointment Breakdown Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 p-6 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Scheduled Treatment & Provider
              </span>
              <p className="text-sm font-bold text-slate-900">{confirmedBooking.serviceName}</p>
              <p className="text-xs text-slate-600">Provider: {confirmedBooking.practitioner}</p>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Date & Start Time
              </span>
              <p className="text-sm font-bold text-slate-900">{formatDate(confirmedBooking.date)}</p>
              <p className="text-xs text-slate-600">{confirmedBooking.timeSlot} (Please arrive 10 min early)</p>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Total Cash Payable at Visit
              </span>
              <p className="text-lg font-bold text-teal-800 tabular-nums">
                ${confirmedBooking.totalCash.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500">
                All clinic services and oral care products are paid in cash at the front desk upon visit completion.
              </p>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Clinic Location & Free Parking
              </span>
              <p className="text-sm font-bold text-slate-900">{CLINIC_INFO.name}</p>
              <p className="text-xs text-slate-600">{CLINIC_INFO.address}, {CLINIC_INFO.cityStateZip}</p>
            </div>

            {/* Attached Products Breakdown */}
            {confirmedBooking.products && confirmedBooking.products.length > 0 && (
              <div className="sm:col-span-2 pt-3 border-t border-slate-200">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Attached Products Ready Chairside
                </span>
                <div className="flex flex-wrap gap-2">
                  {confirmedBooking.products.map((p: any) => (
                    <span key={p.id} className="text-xs bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-800 font-medium">
                      {p.name} (x{p.quantity}) · ${p.price * p.quantity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer"
            >
              Return to Clinic Home
            </button>

            <button
              onClick={() => {
                setStep(1);
                setConfirmedBooking(null);
                setTcpaConsent(false);
                setHipaaConsent(false);
              }}
              className="px-5 py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Book Another Visit
            </button>

            <a
              href={`tel:${CLINIC_INFO.phone.replace(/[^0-9]/g, '')}`}
              className="px-5 py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 rounded-xl transition-colors"
            >
              Questions? Call {CLINIC_INFO.phone}
            </a>
          </div>

        </div>
      )}

    </div>
  );
};
