/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, ShieldCheck, DollarSign, Sparkles, Clock, CheckCircle2, Star, Zap, HeartHandshake } from 'lucide-react';
import { CLINIC_INFO, DENTAL_SERVICES } from '../utils/constants';
import { useClinic } from '../context/ClinicContext';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setPreselectedServiceId } = useClinic();

  const coreServices = DENTAL_SERVICES.slice(0, 4);

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. Hero Section for Dr. James Qado with Image Above the Text */}
      <section className="relative pt-3 sm:pt-4 pb-8 sm:pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Dental Clinic Showcase Image - Maximized for Mobile-First & Desktop */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 h-[280px] sm:h-96 lg:h-[460px] w-full mb-6 sm:mb-10 group bg-slate-100">
            <img
              src="/src/assets/images/dental_clinic_hero_1793479610740.jpg"
              alt="Dr. James Qado Dental Clinic - State-of-the-art operatory suite and digital dental care"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_35%] group-hover:scale-[1.01] transition-transform duration-700 ease-out"
            />
            
            {/* Subtle Gradient & Context Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4 sm:p-8">
              <div className="text-white space-y-1 max-w-2xl">
                <h2 className="text-base sm:text-2xl font-bold text-white tracking-tight drop-shadow-xs">
                  Modern, Gentle Care with Upfront Cash Pricing
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed drop-shadow-xs hidden sm:block">
                  Tour our quiet private operatory equipped with ultra-low radiation digital diagnostics, ultrasonic hygiene, and panoramic garden views.
                </p>
              </div>
            </div>
          </div>

          {/* Hero Content & Proposition Grid (Below Image) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Left Area (8 cols): Proposition, Cash-Friendly & Booking CTA */}
            <div className="lg:col-span-8 space-y-5 sm:space-y-6">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-teal-800">
                <span>Dr. James Qado, DDS</span>
                <span aria-hidden="true">·</span>
                <span>Cash-Friendly Dentistry</span>
                <span aria-hidden="true">·</span>
                <span>Denver, Colorado Suite</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15] text-balance">
                High-standard dental care with clear, upfront cash pricing.
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Welcome to Dr. James Qado's practice. We've eliminated the stress of dental insurance hurdles by offering affordable, transparent cash rates, cutting-edge digital diagnostics, and gentle, anxiety-free treatments for every patient.
              </p>

              {/* Core Value Props Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 pt-1">
                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cash-Friendly</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Exact prices published upfront with zero surprise billing or hidden clinic add-ons.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Modern Care</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ultra-low dose digital x-rays, ultrasonic scaling, and 3D digital oral mapping.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                    <HeartHandshake className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Gentle Touch</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pain-free numbing techniques and a calm, boutique clinic setting.
                  </p>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/booking')}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-all shadow-sm active:scale-[0.98] inline-flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment Now</span>
                </button>

                <button
                  onClick={() => navigate('/services')}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>View 4 Core Services</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Clinic Status & Phone Ticker */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Direct Cash Rates & PPO Accepted
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Front Desk: <strong className="text-slate-900">{CLINIC_INFO.phone}</strong></span>
              </div>
            </div>

            {/* Right Area (4 cols): Clinic Desk & Cash Rates Summary */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Today's Clinic Desk</h3>
                  <p className="text-xs text-slate-500">Walk-ins welcome & online booking</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  Open Today
                </span>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Core Cash Rates
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Full Comprehensive Exam</span>
                    <span className="font-bold text-slate-900 tabular-nums">$80</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Dental Bitewing X-Rays</span>
                    <span className="font-bold text-slate-900 tabular-nums">$50</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Ultrasonic Teeth Cleaning</span>
                    <span className="font-bold text-slate-900 tabular-nums">$90</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">In-Office Teeth Whitening</span>
                    <span className="font-bold text-slate-900 tabular-nums">$200</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 bg-slate-50 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-4 rounded-b-2xl border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium text-slate-900">
                  <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Mon-Thu 8am-6pm</span>
                </div>
                <Link
                  to="/booking"
                  className="font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <span>Select Slot</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>

          {/* Quick Quantitative Proof Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-6 sm:p-8 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">$80</div>
              <div className="text-xs text-slate-500 mt-1">Full Exam Baseline Cash Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">15 min</div>
              <div className="text-xs text-slate-500 mt-1">Instant Low-Radiation Digital X-Rays</div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">4.9 / 5.0</div>
              <div className="text-xs text-slate-500 mt-1">Verified Patient Satisfaction Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">0 Hidden Fees</div>
              <div className="text-xs text-slate-500 mt-1">Upfront Clear Financial Estimates</div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Quick Services Overview (The 4 Core Services) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-800 mb-2">
              Essential Care Menu
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Straightforward pricing for the care you need most.
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:text-teal-950 whitespace-nowrap shrink-0"
          >
            <span>Explore All 4 Services Details</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {coreServices.map((service, index) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="font-bold text-slate-400">0{index + 1}</span>
                  <div className="flex items-center gap-1 font-mono text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.duration}</span>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  {service.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {service.shortDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cash Rate</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    {service.priceEstimate}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setPreselectedServiceId(service.id);
                    navigate('/booking');
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Meet Dr. James Qado & Practice Philosophy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-6 sm:p-12 lg:p-16 space-y-5 sm:space-y-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">
              Meet Dr. James Qado, DDS
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              “Dentistry should never be rushed, painful, or intimidating.”
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Dr. James Qado has spent over fifteen years perfecting biomimetic, conservative restorative dentistry in Denver, Colorado. His clinical protocols focus on natural enamel preservation, painless computer-metered local numbing, and zero-pressure upfront cash consultations.
            </p>
            <div className="pt-1 flex flex-wrap gap-3 sm:gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Fellow, American Academy of Cosmetic Dentistry</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> 100% Metal & Mercury Free</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> 4.9★ Average Patient Rating</span>
            </div>
            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-white transition-colors"
              >
                <span>Read Dr. Qado's Full Clinical Background</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 h-80 sm:h-96 lg:h-full relative min-h-[340px] bg-slate-950">
            <img
              src="/src/assets/images/dr_qado_portrait_1793477298350.jpg"
              alt="Dr. James Qado, DDS"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* 4. Booking CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-teal-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center space-y-5 sm:space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-300">
            Convenient Scheduling
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white max-w-2xl mx-auto">
            Book your appointment online in under 2 minutes.
          </h2>
          <p className="text-sm text-teal-100 max-w-lg mx-auto">
            Select your preferred core treatment, choose an available date and time slot with Dr. Qado, and receive immediate booking confirmation.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/booking')}
              className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-teal-700" />
              <span>Schedule Your Visit Online</span>
            </button>
            <Link
              to="/about"
              className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-medium text-white border border-teal-700 hover:bg-teal-800 rounded-xl transition-colors inline-flex items-center justify-center"
            >
              Learn More About Dr. Qado
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
