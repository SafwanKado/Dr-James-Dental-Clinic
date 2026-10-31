/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Menu, X, ShoppingBag, Sparkles, PhoneCall, BookmarkPlus } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { CLINIC_INFO } from '../utils/constants';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, visitRecordCount } = useClinic();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Products', path: '/products' },
    { label: 'About Us', path: '/about' },
  ];

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Clinic Contact Ticker Banner (Responsive & Quiet) */}
      <div className="bg-slate-900 text-slate-300 text-[11px] sm:text-xs py-1.5 sm:py-2 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-400 truncate">Denver, Colorado</span>
            <span aria-hidden="true" className="text-slate-600 shrink-0">·</span>
            <span className="text-emerald-400 font-medium shrink-0">Accepting Patients</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-slate-300">
            <a
              href={`tel:${CLINIC_INFO.phone.replace(/[^0-9]/g, '')}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
              <span className="tabular-nums font-medium text-[11px] sm:text-xs">{CLINIC_INFO.phone}</span>
            </a>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">Mon-Thu 8am-6pm</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-8">
          
          {/* Zone 1: Brand Zone */}
          <Link
            to="/"
            className="group flex items-center gap-2 sm:gap-2.5 min-w-0 shrink"
            aria-label="Dr. James Qado Dental Clinic Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-white border border-slate-100 shadow-xs group-hover:border-teal-200 transition-colors">
              <img
                src="/assets/aistudio/Blue_Dental_Clinic_Logo_63e741da.png"
                alt="Dr. James Qado Dental Clinic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none group-hover:text-teal-700 transition-colors truncate">
                Dr. James Qado
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-0.5 sm:mt-1 truncate">
                Dental Clinic
              </span>
            </div>
          </Link>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-600 shrink-0">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `transition-colors hover:text-slate-950 py-1 border-b-2 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-slate-900 text-slate-950 font-semibold'
                      : 'border-transparent text-slate-600'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Visit Record Indicator */}
            {visitRecordCount > 0 && (
              <Link
                to="/products"
                className="p-1.5 sm:p-2 text-teal-800 hover:text-teal-950 transition-colors rounded-lg hover:bg-teal-50 flex items-center gap-1"
                title={`${visitRecordCount} items attached to your visit record`}
              >
                <BookmarkPlus className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold tabular-nums">
                  {visitRecordCount}
                </span>
              </Link>
            )}

            {/* Cart indicator */}
            {cartCount > 0 && (
              <Link
                to="/products"
                className="relative p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
                title={`${cartCount} items in clinic care bag`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              </Link>
            )}

            {/* Primary Action Button */}
            <button
              onClick={() => navigate('/booking')}
              className="hidden sm:inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-all shadow-sm active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-4 text-base font-medium text-slate-700">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={handleMobileNavClick}
                  className={({ isActive }) =>
                    `py-2 transition-colors flex items-center justify-between ${
                      isActive ? 'text-slate-900 font-bold border-l-2 border-slate-900 pl-3' : 'hover:text-slate-900'
                    }`
                  }
                >
                  <span>{link.label}</span>
                </NavLink>
              ))}

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button
                  onClick={() => {
                    handleMobileNavClick();
                    navigate('/booking');
                  }}
                  className="w-full py-3 px-4 text-center font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
                  <span>Questions? Call {CLINIC_INFO.phone}</span>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};
