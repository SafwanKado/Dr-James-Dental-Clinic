/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Lock } from 'lucide-react';
import { CLINIC_INFO } from '../utils/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 pt-12 sm:pt-16 pb-10 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 pb-12 sm:pb-16 border-b border-slate-800">
          
          {/* Column 1: Clinic Identity & Ethos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white p-0.5 border border-slate-700 flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/Blue_Dental_Clinic_Logo_63e741da.png"
                  alt="Dr. James Qado Dental Clinic Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Dr. James Qado
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Modern, gentle restorative and cosmetic dentistry delivered with calm precision, biological preservation, and cutting-edge digital diagnostics.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-teal-400 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>AACD Accredited Fellow & Board Certified</span>
              </div>
              <p className="text-slate-500">License #DDS-49201 · State of Colorado</p>
            </div>
          </div>

          {/* Column 2: Navigation & Care Programs */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Explore Practice
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Home & Overview
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-400 hover:text-white transition-colors">
                  Dental Services & Treatments
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-slate-400 hover:text-white transition-colors">
                  Oral Wellness Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Dr. James Qado & Clinic
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                  Book an Appointment Online →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Emergency */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Location & Contact
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  {CLINIC_INFO.address}<br />
                  {CLINIC_INFO.cityStateZip}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <a href={`tel:${CLINIC_INFO.phone.replace(/[^0-9]/g, '')}`} className="hover:text-white transition-colors tabular-nums">
                  {CLINIC_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <a href={`mailto:${CLINIC_INFO.email}`} className="hover:text-white transition-colors">
                  {CLINIC_INFO.email}
                </a>
              </li>
              <li className="pt-2 border-t border-slate-900">
                <div className="text-xs text-rose-400 font-semibold mb-0.5">Dental Emergency Line:</div>
                <div className="text-sm text-slate-200 font-mono tabular-nums">{CLINIC_INFO.emergencyPhone}</div>
              </li>
            </ul>
          </div>

          {/* Column 4: Hours & Insurance */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Practice Hours
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              {CLINIC_INFO.hours.map((h, i) => (
                <li key={i} className="flex flex-col pb-1.5 border-b border-slate-900 last:border-0">
                  <span className="text-slate-300 font-medium">{h.days}</span>
                  <span className="text-slate-500 tabular-nums">{h.time}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-slate-900 text-xs text-slate-400">
              <span className="text-slate-300 font-medium">In-Network With:</span> Delta Dental, Cigna, MetLife, Aetna & CareCredit.
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar with Discreet Doctor Portal Link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Dr. James Qado Dental Clinic. All medical rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span aria-hidden="true">·</span>
            <span>HIPAA Compliance Notice</span>
            <span aria-hidden="true">·</span>
            {/* Discreet Staff / Provider Portal Link */}
            <Link
              to="/doctor"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors"
              title="Private Doctor & Staff Access"
            >
              <Lock className="w-3 h-3" />
              <span>Doctor Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
