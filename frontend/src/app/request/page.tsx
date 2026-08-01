'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  HeartPulse,
  Send,
  Clock,
  AlertTriangle,
  FileText,
  LogOut,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';

export default function BeneficiaryRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    equipmentCategory: 'OXYGEN_CONCENTRATOR',
    urgencyLevel: 'CRITICAL',
    diagnosis: '',
    doctorName: '',
    hospitalName: '',
    spO2Level: '',
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Populate user default address if available
    if (parsedUser.address) {
      setFormData((prev) => ({
        ...prev,
        deliveryAddress: {
          street: parsedUser.address.street || '',
          city: parsedUser.address.city || '',
          state: parsedUser.address.state || '',
          zipCode: parsedUser.address.zipCode || '',
        },
      }));
    }

    fetchMyRequests();
  }, [router]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/requests/my-requests');
      setRequests(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // ✅ Payload with fallback defaults to satisfy backend Mongoose validation
      const payload = {
        equipmentCategory: formData.equipmentCategory,
        urgencyLevel: formData.urgencyLevel,
        diagnosis: formData.diagnosis || 'General Emergency Request',
        doctorName: formData.doctorName || 'Dr. On-Call / Emergency',
        hospitalName: formData.hospitalName || 'Local Medical Center / Self',
        spO2Level: formData.spO2Level ? Number(formData.spO2Level) : undefined,
        deliveryAddress: {
          street: formData.deliveryAddress.street || 'Standard Emergency Delivery Street',
          city: formData.deliveryAddress.city || 'Mumbai',
          state: formData.deliveryAddress.state || 'Maharashtra',
          zipCode: formData.deliveryAddress.zipCode || '400001',
          location: {
            type: 'Point',
            coordinates: [72.8777, 19.076],
          },
        },
      };

      await api.post('/requests', payload);
      setSuccess('Emergency request submitted successfully! Urgency engine is evaluating priority.');

      // Reset form & refresh list
      setFormData((prev) => ({ 
        ...prev, 
        diagnosis: '', 
        doctorName: '', 
        hospitalName: '', 
        spO2Level: '' 
      }));
      fetchMyRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit equipment request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center border-b border-slate-800 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              MediShare Emergency Request Portal
            </h1>
            <p className="text-xs text-slate-400">Logged in as {user?.fullName || user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
        {/* Left Column: Submit New Emergency Request */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl h-fit">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">New Medical Request</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Required Equipment
              </label>
              <select
                value={formData.equipmentCategory}
                onChange={(e) => setFormData({ ...formData, equipmentCategory: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="OXYGEN_CONCENTRATOR">Oxygen Concentrator</option>
                <option value="VENTILATOR">Portable Ventilator</option>
                <option value="WHEELCHAIR">Wheelchair</option>
                <option value="NEBULIZER">Nebulizer</option>
                <option value="HOSPITAL_BED">Hospital Bed</option>
                <option value="SUCTION_MACHINE">Suction Machine</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Urgency Level
                </label>
                <select
                  value={formData.urgencyLevel}
                  onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="CRITICAL">Critical (Immediate)</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low / Routine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  SpO2 Level (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 88"
                  value={formData.spO2Level}
                  onChange={(e) => setFormData({ ...formData, spO2Level: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Patient Medical Notes / Diagnosis
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe patient condition and immediate requirements..."
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Delivery City / Area
              </label>
              <input
                type="text"
                required
                placeholder="City Name"
                value={formData.deliveryAddress.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryAddress: { ...formData.deliveryAddress, city: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Emergency Request'}
            </button>
          </form>
        </div>

        {/* Right Column: Active & Past Request History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" /> My Request History
            </h2>
            <span className="text-xs text-slate-400">{requests.length} Total Requests</span>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No medical equipment requests logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-teal-400 text-base">
                        {(req.equipmentCategory || req.equipmentType || '')?.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Created: {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        req.status === 'MATCHED' || req.status === 'DELIVERED' || req.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : req.status === 'PENDING' || req.status === 'SUBMITTED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    "{req.diagnosis || req.patientCondition}"
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5 text-teal-400" />
                      Calculated Urgency Score: {req.calculatedUrgencyScore ?? req.urgencyScore ?? 'Calculating...'}
                    </span>
                    <span>City: {req.deliveryAddress?.city || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}