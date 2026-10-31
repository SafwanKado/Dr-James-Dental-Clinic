/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, ShieldCheck, DollarSign, Sparkles, HelpCircle } from 'lucide-react';
import { DENTAL_SERVICES, CLINIC_INFO } from '../utils/constants';
import { useClinic } from '../context/ClinicContext';

export const Services: React.FC = () => {
  const navigate = useNavigate();
  const { setPreselectedServiceId } = useClinic();

  const handleBookService = (serviceId: string) => {
    setPreselectedServiceId(serviceId);
    navigate('/booking');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
      
      {/* Header */}
      <div className="max-w-3xl space-y-3 sm:space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
          Core Treatment Menu
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Clear, Upfront Dental Care Services
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          At Dr. James Qado's clinic, we believe high-caliber dental health should be transparent and accessible. We clearly publish exact cash rates for our four core services with zero hidden facility charges.
        </p>
      </div>

      {/* Cards for the 4 Core Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {DENTAL_SERVICES.map((service, index) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-200/90 hover:border-slate-300 p-5 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Top Bar: Service Number & Duration */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
                <span className="font-mono text-xs font-bold text-teal-800">
                  0{index + 1}. CORE SERVICE
                </span>
                <div className="flex items-center gap-1.5 font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{service.duration}</span>
                </div>
              </div>

              {/* Service Title & Exact Price */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2 mb-3">
                <h2 className="text-xl sm:text-3xl font-bold text-slate-900">
                  {service.name}
                </h2>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                  {service.priceEstimate}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {service.detailedDescription}
              </p>

              {/* Clinical Advantages */}
              <div className="space-y-2.5 mb-6 sm:mb-8 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  What's Included:
                </div>
                {service.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions & Interval */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span className="block font-medium text-slate-700">Recommended Cadence:</span>
                <span>{service.recommendedInterval}</span>
              </div>

              <button
                onClick={() => handleBookService(service.id)}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-all shadow-xs active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book This Service ({service.priceEstimate})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Patient Special Bundle Callout */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-800 text-teal-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Popular Complete Checkup Package</span>
          </div>
          <h3 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
            Full Exam + Digital X-Rays + Cleaning
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Combine our top three preventive services in a single convenient 75-minute appointment. Perfect for first-time visitors or patients returning to routine care.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block line-through tabular-nums">$220 standard</span>
            <span className="text-3xl sm:text-4xl font-bold text-teal-400 tabular-nums">$200</span>
            <span className="text-xs text-slate-300 block">Complete preventive bundle</span>
          </div>
          <button
            onClick={() => {
              setPreselectedServiceId('full-exam');
              navigate('/booking');
            }}
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap inline-flex items-center justify-center"
          >
            Book Preventive Bundle
          </button>
        </div>
      </div>

      {/* Cash-Friendly Policy & Transparency */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
          <DollarSign className="w-4 h-4" />
          <span>Transparent Payment Policy</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          No insurance? No problem.
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          We accept cash, all major credit/debit cards, HSA/FSA health savings cards, and CareCredit interest-free financing. If you have private PPO dental insurance (Delta Dental, Cigna, MetLife, Aetna), we will file claims as a courtesy to help you maximize out-of-network reimbursements.
        </p>

        <div className="pt-2 text-xs text-slate-500">
          Questions about custom treatment plans or dental emergencies? Call Dr. Qado's front desk at <strong>{CLINIC_INFO.phone}</strong>.
        </div>
      </div>

    </div>
  );
};
