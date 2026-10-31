/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle2, BookmarkPlus, Calendar, Trash2, ArrowRight, ShieldCheck, DollarSign, X } from 'lucide-react';
import { CLINIC_PRODUCTS } from '../services/productService';
import { DentalProduct } from '../utils/constants';
import { useClinic } from '../context/ClinicContext';

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const {
    visitRecordItems,
    addToVisitRecord,
    removeFromVisitRecord,
    clearVisitRecord,
    visitRecordCount,
    showToast
  } = useClinic();

  const [selectedProduct, setSelectedProduct] = useState<DentalProduct | null>(null);
  const [isVisitDrawerOpen, setIsVisitDrawerOpen] = useState(false);

  const visitRecordTotal = visitRecordItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const isAttachedToRecord = (productId: string) => {
    return visitRecordItems.some(item => item.product.id === productId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6 sm:pb-8">
        <div className="max-w-3xl space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Exact Cash Pricing · In-Clinic Dispensary</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            Clinic Dental Care Catalog
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Dentist-approved oral hygiene tools and formulations. Attach items directly to your upcoming appointment visit record so Dr. Qado and our clinical team have them prepared chairside for your visit.
          </p>
        </div>

        {/* Visit Record Badge / Review Button */}
        <button
          onClick={() => setIsVisitDrawerOpen(true)}
          className={`w-full sm:w-auto relative px-5 py-3 rounded-xl font-semibold text-sm transition-all inline-flex items-center justify-center gap-2.5 shrink-0 cursor-pointer shadow-xs ${
            visitRecordCount > 0
              ? 'bg-teal-700 hover:bg-teal-800 text-white ring-2 ring-teal-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <BookmarkPlus className="w-4 h-4" />
          <span>Attached to Visit Record</span>
          {visitRecordCount > 0 && (
            <span className="bg-white text-teal-900 text-xs px-2 py-0.5 rounded-full font-bold tabular-nums">
              {visitRecordCount}
            </span>
          )}
        </button>
      </div>

      {/* Visit Record Summary Banner (if items attached) */}
      {visitRecordCount > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-teal-950 block">
                {visitRecordCount} {visitRecordCount === 1 ? 'item' : 'items'} attached to your clinical visit record
              </span>
              <span className="text-xs text-teal-700">
                Total cash items: ${visitRecordTotal.toFixed(2)} · Dr. Qado will dispense these during your appointment.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsVisitDrawerOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-teal-900 bg-white hover:bg-teal-100/60 border border-teal-300 rounded-lg transition-colors cursor-pointer"
            >
              Review Attachments
            </button>
            <button
              onClick={() => navigate('/booking')}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Visit Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Products Grid featuring exact cash pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {CLINIC_PRODUCTS.map(product => {
          const attached = isAttachedToRecord(product.id);

          return (
            <div
              key={product.id}
              className={`bg-white rounded-3xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                attached ? 'border-teal-600' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Product Visual */}
              <div
                className="relative aspect-4/3 bg-slate-50 overflow-hidden cursor-pointer group"
                onClick={() => setSelectedProduct(product)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 rounded-lg shadow-xs tabular-nums">
                  ${product.price.toFixed(2)} Cash Price
                </span>

                {attached && (
                  <span className="absolute top-3 right-3 bg-teal-700 text-white px-2.5 py-1 text-[11px] font-semibold rounded-lg shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Attached</span>
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-semibold text-slate-900 tabular-nums">{product.rating.toFixed(1)}</span>
                      <span className="text-slate-400">({product.reviewsCount})</span>
                    </div>
                    <span className="text-emerald-700 font-semibold text-[11px]">Ready In-Office</span>
                  </div>

                  <h2
                    onClick={() => setSelectedProduct(product)}
                    className="text-xl font-bold text-slate-900 mb-2 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    {product.name}
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                    {product.description}
                  </p>

                  <div className="space-y-1.5 mb-6">
                    {product.highlights.slice(0, 2).map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exact Price & 'Add to Visit Record' Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Exact Price</span>
                    <span className="text-xl font-bold text-slate-900 tabular-nums">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (attached) {
                        removeFromVisitRecord(product.id);
                      } else {
                        addToVisitRecord(product);
                      }
                    }}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      attached
                        ? 'bg-teal-100 text-teal-900 hover:bg-rose-50 hover:text-rose-700'
                        : 'bg-slate-900 hover:bg-teal-700 text-white shadow-xs'
                    }`}
                  >
                    {attached ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                        <span>Attached (Remove)</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Add to Visit Record</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    ${selectedProduct.price.toFixed(2)} Cash
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                  {selectedProduct.name}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedProduct.description}
                </p>

                <div className="space-y-2 pt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Clinical Highlights
                  </div>
                  {selectedProduct.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      addToVisitRecord(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Add to Visit Record (${selectedProduct.price.toFixed(2)})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visit Record Slide-over Drawer */}
      {isVisitDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-teal-700" />
                <h2 className="text-lg font-bold text-slate-900">Appointment Visit Record</h2>
                <span className="text-xs text-slate-500 tabular-nums">({visitRecordCount} items)</span>
              </div>
              <button
                onClick={() => setIsVisitDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {visitRecordItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <BookmarkPlus className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
                  <p className="text-base font-medium text-slate-600 mb-1">No items attached yet</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Click "Add to Visit Record" on any dental product to attach it to your upcoming appointment.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-teal-50 rounded-xl text-xs text-teal-900 leading-normal border border-teal-100">
                    These items will be prepared in your chairside care package when you arrive for your appointment with Dr. James Qado.
                  </div>

                  {visitRecordItems.map(item => (
                    <div key={item.product.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-lg object-cover bg-white border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-xs text-slate-500 mb-1">
                          Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                        </div>
                        <div className="text-sm font-bold text-slate-900 tabular-nums">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromVisitRecord(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 self-start transition-colors"
                        title="Remove from visit record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            {visitRecordItems.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Visit Record Total</span>
                  <span className="tabular-nums">${visitRecordTotal.toFixed(2)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsVisitDrawerOpen(false);
                      navigate('/booking');
                    }}
                    className="w-full py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Proceed to Book Appointment</span>
                  </button>
                  <button
                    onClick={clearVisitRecord}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Clear All Attached Items
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
