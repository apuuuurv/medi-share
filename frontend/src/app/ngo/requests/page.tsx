'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  ShieldAlert,
  PackageCheck,
  CheckCircle2,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function NgoAdminRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Matching Modal State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [matchingNotes, setMatchingNotes] = useState('');
  const [processingMatch, setProcessingMatch] = useState(false);

  // Notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));

    fetchPriorityRequests();
  }, [router]);

  // 1. Fetch Priority Requests sorted by Urgency Engine
  const fetchPriorityRequests = async () => {
    setLoading(true);
    setError('');
    try {
      // ✅ FIX: Endpoint is `/requests` on backend, not `/requests/priority`
      const response = await api.get('/requests');
      setRequests(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch priority requests');
    } finally {
      setLoading(false);
    }
  };

  // 2. Open Match Modal & Fetch Available Inventory
  const handleOpenMatchModal = async (reqItem: any) => {
    setSelectedRequest(reqItem);
    setSelectedEquipmentId('');
    setMatchingNotes('');
    setError('');

    try {
      const res = await api.get('/equipment');
      const allItems = res.data.data || [];
      
      const available = allItems.filter(
        (eq: any) =>
          eq.status === 'IN_INVENTORY' ||
          eq.status === 'AVAILABLE' ||
          eq.status === 'DONATION_SUBMITTED'
      );
      
      setAvailableEquipment(available);
      if (available.length > 0) {
        setSelectedEquipmentId(available[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to fetch equipment inventory:', err);
    }
  };

  // 3. Trigger NGO Approval & Match API Call
  const handleApproveAndMatch = async () => {
    if (!selectedRequest || !selectedEquipmentId) {
      setError('Please select an available equipment item to match.');
      return;
    }

    setProcessingMatch(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        equipmentId: selectedEquipmentId,
        notes: matchingNotes || 'NGO verified request and dispatched equipment.',
      };

      // ✅ FIX: Changed method from POST to PATCH to match `router.patch('/:id/approve')`
      const response = await api.patch(`/requests/${selectedRequest._id}/approve`, payload);
      
      setSuccess(
        `Request approved! Handover OTP generated: ${
          response.data.data?.otpCode || 'Sent to beneficiary'
        }`
      );
      
      setSelectedRequest(null);
      fetchPriorityRequests(); // Refresh queue
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve and match request.');
    } finally {
      setProcessingMatch(false);
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
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-teal-400 bg-clip-text text-transparent">
              NGO Admin Emergency Dispatch Center
            </h1>
            <p className="text-xs text-slate-400">
              Priority Engine Queue • Logged in as {user?.fullName || user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Banner Messages */}
        {success && (
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-teal-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Priority Request Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Incoming Emergency Queue (Sorted by Urgency Score)
            </h2>
            <span className="text-xs text-slate-400 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full">
              {requests.length} Requests
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading priority requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No priority requests requiring matching right now.</div>
          ) : (
            <div className="grid gap-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Urgency Score: {req.calculatedUrgencyScore}
                      </span>
                      <h3 className="font-bold text-white text-base">
                        {req.equipmentCategory?.replace(/_/g, ' ')}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      <strong>Patient Diagnosis:</strong> "{req.diagnosis || 'Emergency Medical Need'}"
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Beneficiary: {req.beneficiaryId?.fullName || req.beneficiaryId?.email}</span>
                      <span>City: {req.deliveryAddress?.city}</span>
                      <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {req.status === 'SUBMITTED' || req.status === 'PENDING' ? (
                      <button
                        onClick={() => handleOpenMatchModal(req)}
                        className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-teal-500/10"
                      >
                        <PackageCheck className="w-4 h-4" />
                        Match & Reserve Inventory
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        Matched & Assigned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Equipment Matching Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-teal-400" />
                Match Equipment for Request
              </h3>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Request ID: <span className="text-slate-200">{selectedRequest._id}</span></p>
              <p className="text-slate-400">Required Category: <span className="text-teal-400 font-bold">{selectedRequest.equipmentCategory}</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Select Available Equipment in Inventory
              </label>
              {availableEquipment.length === 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs">
                  No available items found in inventory.
                </div>
              ) : (
                <select
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-teal-500"
                >
                  {availableEquipment.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} ({eq.assetId}) - Condition: {eq.condition}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                Fulfillment / Dispatch Notes
              </label>
              <textarea
                rows={2}
                placeholder="Internal NGO notes for delivery team..."
                value={matchingNotes}
                onChange={(e) => setMatchingNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                disabled={processingMatch || availableEquipment.length === 0}
                onClick={handleApproveAndMatch}
                className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingMatch ? 'Matching & Dispatching...' : 'Confirm Match & Reserve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}