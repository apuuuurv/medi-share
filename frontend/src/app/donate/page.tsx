'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  PackagePlus,
  Package,
  QrCode,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Tag,
  Activity,
  Plus,
} from 'lucide-react';

export default function DonorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Form & Equipment State
  const [myEquipment, setMyEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Status Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // QR Tag Modal State
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    category: 'OXYGEN_CONCENTRATOR',
    condition: 'LIKE_NEW',
    serialNumber: '',
    description: '',
    street: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));

    fetchMyEquipment();
  }, [router]);

  // Fetch items donated by current logged in donor
  const fetchMyEquipment = async () => {
    setLoading(true);
    try {
      const res = await api.get('/equipment/my-donations');
      setMyEquipment(res.data.data || res.data || []);
    } catch (err: any) {
      // Fallback if specific route isn't available
      try {
        const allRes = await api.get('/equipment');
        setMyEquipment(allRes.data.data || []);
      } catch (innerErr: any) {
        setError('Failed to fetch your donated equipment');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit new equipment donation
  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        condition: formData.condition,
        serialNumber: formData.serialNumber,
        description: formData.description,
        donationType: 'PERMANENT',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760],
          street: formData.street || 'Donor Premises',
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
      };

      await api.post('/equipment', payload);

      setSuccess('Equipment donation registered successfully! Asset QR code generated.');
      setShowModal(false);
      
      setFormData({
        name: '',
        category: 'OXYGEN_CONCENTRATOR',
        condition: 'LIKE_NEW',
        serialNumber: '',
        description: '',
        street: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      });
      fetchMyEquipment();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit donation registration');
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
      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
            <PackagePlus className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              MediShare Donor Portal
            </h1>
            <p className="text-xs text-slate-400">Logged in as: {user?.fullName || user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-teal-500/10 transition-all"
          >
            <Plus className="w-4 h-4" /> Register Donation
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* Banner Alerts */}
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
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section: My Donated Equipment */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-400" />
              My Donated Medical Equipment & Asset Tags
            </h2>
            <span className="text-xs text-slate-400 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full">
              {myEquipment.length} Registered Items
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading your donated assets...</div>
          ) : myEquipment.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl space-y-3">
              <Package className="w-10 h-10 mx-auto text-slate-600" />
              <p>You haven't registered any medical equipment donations yet.</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs font-semibold transition-all"
              >
                + Donate Your First Item
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEquipment.map((item) => (
                <div
                  key={item._id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {item.category?.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          item.status === 'AVAILABLE' || item.status === 'IN_INVENTORY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'RESERVED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base">{item.name}</h3>
                      <p className="text-xs text-slate-400">Asset Tag: {item.assetId || 'MED-EQ-AUTO'}</p>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80 text-xs space-y-1 text-slate-300">
                      <p><span className="text-slate-500">Condition:</span> {item.condition}</p>
                      <p><span className="text-slate-500">Location:</span> {item.location?.city || 'Mumbai'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAsset(item)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <QrCode className="w-4 h-4" /> View QR Asset Tag
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal 1: Register New Equipment Donation */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-teal-400" />
                Register New Equipment Donation
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDonation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Philips SimplyGo Oxygen Concentrator"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="OXYGEN_CONCENTRATOR">Oxygen Concentrator</option>
                    <option value="WHEELCHAIR">Wheelchair</option>
                    <option value="HOSPITAL_BED">Hospital Bed</option>
                    <option value="VENTILATOR">Ventilator</option>
                    <option value="SUCTION_MACHINE">Suction Machine</option>
                    <option value="NEBULIZER">Nebulizer</option>
                    <option value="OTHER">Other Medical Device</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="BRAND_NEW">Brand New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good / Gently Used</option>
                    <option value="FAIR">Fair / Functional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-987654321"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Pickup City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description / Accessories</label>
                <textarea
                  rows={2}
                  placeholder="Include tubing, power cords, manual, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View QR Code Asset Tag */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-400" />
                Asset QR Identifier Tag
              </h3>
              <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              {/* Dynamic QR Code Image via API */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  JSON.stringify({
                    assetId: selectedAsset.assetId || selectedAsset._id,
                    name: selectedAsset.name,
                    category: selectedAsset.category,
                  })
                )}`}
                alt="Asset QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">{selectedAsset.name}</h4>
              <p className="text-xs font-mono text-teal-400">{selectedAsset.assetId || selectedAsset._id}</p>
            </div>

            <button
              onClick={() => setSelectedAsset(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              Close Asset Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}