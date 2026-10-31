/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Stethoscope } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
        <Stethoscope className="w-7 h-7 text-teal-700" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        The clinic page you are looking for doesn't exist or has been relocated.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Clinic Home</span>
        </Link>
      </div>
    </div>
  );
};
