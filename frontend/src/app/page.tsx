'use client';

import Link from 'next/link';
import { HeartPulse, ShieldCheck, Truck, Activity, ArrowRight, UserCheck, Stethoscope } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 text-teal-400">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              MediShare
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 rounded-lg transition-all shadow-lg shadow-teal-500/20 font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-16">
        <section className="max-w-7xl mx-auto px-6 text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold mb-6">
              <Activity className="w-3.5 h-3.5" /> Emergency Medical Logistics Engine
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Rapid Redistribution of <span className="text-teal-400">Life-Saving</span> Medical Equipment
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-xl">
              Connecting donors, NGOs, and emergency beneficiaries with real-time urgency scoring, automated dispatching, and verified chain-of-custody tracking.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/register?role=BENEFICIARY"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-lg shadow-teal-500/25"
              >
                Request Equipment <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register?role=DONOR"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold transition-all"
              >
                Donate Device
              </Link>
            </div>
          </div>

          {/* Interactive Feature Preview Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/40 transition-all">
              <ShieldCheck className="w-8 h-8 text-teal-400 mb-3" />
              <h3 className="font-semibold text-white text-lg">Urgency Score Engine</h3>
              <p className="text-slate-400 text-sm mt-2">
                Automated triage prioritizing oxygen concentrators & critical gear based on medical parameters.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/40 transition-all">
              <Truck className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white text-lg">Live GPS Dispatch</h3>
              <p className="text-slate-400 text-sm mt-2">
                Real-time volunteer tracking with OTP secure handover verification at delivery site.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/40 transition-all">
              <Stethoscope className="w-8 h-8 text-teal-400 mb-3" />
              <h3 className="font-semibold text-white text-lg">Sanitization Protocols</h3>
              <p className="text-slate-400 text-sm mt-2">
                Hub maintenance logs and device history audits ensuring equipment is 100% field-ready.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/40 transition-all">
              <UserCheck className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white text-lg">Role-Based Portals</h3>
              <p className="text-slate-400 text-sm mt-2">
                Tailored views for Donors, Beneficiaries, NGO Admins, and Field Volunteers.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        © 2026 MediShare Emergency Network. Built for life-saving impact.
      </footer>
    </div>
  );
}