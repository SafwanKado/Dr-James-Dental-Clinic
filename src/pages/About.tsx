/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ShieldCheck, Award, MapPin, Phone, Mail, Clock, CheckCircle2, UserCheck, HeartHandshake, Send } from 'lucide-react';
import { CLINIC_INFO } from '../utils/constants';
import { useClinic } from '../context/ClinicContext';

export const About: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useClinic();

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryMessage.trim()) return;

    setInquirySent(true);
    showToast("Thank you. Dr. Qado's patient coordinator will contact you shortly.");
    setTimeout(() => {
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
      setInquirySent(false);
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-20">
      
      {/* 1. Founder & Credentials Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <span>Clinical Founder & Director</span>
            <span aria-hidden="true">·</span>
            <span>Dr. James Qado, DDS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
            Compassionate Dental Medicine with Uncompromising Integrity
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            "My standard of care is simple: treat every patient with the gentle touch, total honesty, and clinical precision I would provide for my own family. That means no fear, no aggressive overtreatment, and clear upfront cash pricing."
          </p>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Dr. James Qado graduated at the top of his dental class and has completed advanced clinical residencies in aesthetic smile reconstruction, conservative biomimetic dentistry, and digital endodontics. Over 15 years in private clinical practice, he has helped thousands of patients overcome severe dental phobia.
          </p>

          {/* Formal Credentials Badges */}
          <div className="pt-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Board Certifications & Affiliations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Doctor of Dental Surgery (DDS)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <Award className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Fellow, American Academy of Cosmetic Dentistry</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Active Member, American Dental Association (ADA)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <HeartHandshake className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Colorado Dental Association Licensed (#DDS-49201)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/booking')}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-all shadow-sm active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment with Dr. Qado</span>
            </button>
            <a
              href={`tel:${CLINIC_INFO.phone.replace(/[^0-9]/g, '')}`}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center justify-center"
            >
              Call Clinic Desk
            </a>
          </div>
        </div>

        {/* Doctor Photo */}
        <div className="lg:col-span-5">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-slate-200 aspect-4/3 sm:aspect-1/1 lg:aspect-auto lg:h-[500px] bg-slate-950">
            <img
              src="/src/assets/images/dr_qado_portrait_1793477298350.jpg"
              alt="Dr. James Qado, DDS"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* 2. Clinic Location & Operating Hours */}
      <section className="bg-slate-50/80 p-8 sm:p-12 rounded-3xl border border-slate-200">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-800 mb-2">
            Practice Details
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Location, Hours & Immediate Contact
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card A: Location */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Clinic Location</h3>
              <div className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-900 block">{CLINIC_INFO.name}</strong>
                {CLINIC_INFO.address}<br />
                {CLINIC_INFO.cityStateZip}
              </div>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 space-y-1">
                <p>• Complimentary 2-hour subterranean patient parking with validation</p>
                <p>• Wheelchair accessible elevators & wide operatories</p>
              </div>
            </div>

            <div className="pt-6">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-teal-800 hover:text-teal-950 inline-flex items-center gap-1"
              >
                <span>Get Driving Directions →</span>
              </a>
            </div>
          </div>

          {/* Card B: Operating Hours */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Operating Hours</h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                {CLINIC_INFO.hours.map((h, i) => (
                  <li key={i} className="flex justify-between pb-1.5 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-800">{h.days}:</span>
                    <span className="tabular-nums font-mono text-slate-600">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 text-xs text-slate-500 border-t border-slate-100">
              Walk-in triage welcome during standard clinic hours.
            </div>
          </div>

          {/* Card C: Direct Contact & Emergency */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Direct Contact</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block">General Appointments</span>
                  <a href={`tel:${CLINIC_INFO.phone.replace(/[^0-9]/g, '')}`} className="font-bold text-slate-900 hover:text-teal-700 tabular-nums">
                    {CLINIC_INFO.phone}
                  </a>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Patient Correspondence</span>
                  <a href={`mailto:${CLINIC_INFO.email}`} className="text-slate-700 hover:text-teal-700 text-xs">
                    {CLINIC_INFO.email}
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] uppercase tracking-wider text-rose-600 font-bold block">
                    24/7 Dental Emergency Line
                  </span>
                  <a href={`tel:${CLINIC_INFO.emergencyPhone.replace(/[^0-9]/g, '')}`} className="font-mono font-bold text-rose-600 tabular-nums">
                    {CLINIC_INFO.emergencyPhone}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 text-xs text-slate-500 border-t border-slate-100">
              Immediate triage for severe trauma, toothaches, or abscesses.
            </div>
          </div>

        </div>
      </section>

      {/* 3. Direct Patient Inquiry Form */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs">
        <div className="max-w-2xl mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-800 mb-2">
            Have a Question?
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Send a direct message to Dr. Qado's front desk
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Ask about treatment options, dental anxiety accommodations, or custom financial estimates.
          </p>
        </div>

        {inquirySent ? (
          <div className="p-6 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Inquiry received!</span>
              <span className="text-xs">Our patient care coordinator will contact you shortly via email or phone.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInquirySubmit} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Taylor"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jessica@example.com"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                How Can We Help You? *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ask about dental services, insurance questions, anxiety options..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Message to Front Desk</span>
            </button>
          </form>
        )}
      </section>

    </div>
  );
};
