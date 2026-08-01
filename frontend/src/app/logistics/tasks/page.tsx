'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  KeyRound,
  Navigation,
  LogOut,
  X,
  Package,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function LogisticsFleetDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Data States
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // OTP Verification Modal
  const [selectedTaskForOtp, setSelectedTaskForOtp] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Status Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));

    fetchTasks();
  }, [router]);

  // Fetch both open tasks and tasks assigned to the current volunteer
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [availRes, myTasksRes] = await Promise.all([
        api.get('/logistics/tasks/available'),
        api.get('/logistics/tasks/my-tasks'),
      ]);

      setAvailableTasks(availRes.data.data || []);
      setMyTasks(myTasksRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch logistics tasks');
    } finally {
      setLoading(false);
    }
  };

  // Volunteer accepts an unassigned task
  const handleAcceptTask = async (taskId: string) => {
    setError('');
    setSuccess('');

    try {
      await api.post(`/logistics/tasks/${taskId}/accept`);
      setSuccess('Task accepted! It has been moved to your active delivery queue.');
      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept task');
    }
  };

  // Verify Handover OTP to complete delivery
  const handleVerifyOtp = async () => {
    if (!selectedTaskForOtp || !otpInput) {
      setError('Please enter the 6-digit OTP code provided by the recipient.');
      return;
    }

    setVerifyingOtp(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/logistics/tasks/${selectedTaskForOtp._id}/complete-otp`, {
        otp: otpInput.trim(),
      });

      setSuccess('OTP Verified! Delivery completed successfully & equipment status updated.');
      setSelectedTaskForOtp(null);
      setOtpInput('');
      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid Handover OTP code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Simulate GPS location ping
  const handleSendLocationPing = async (taskId: string) => {
    try {
      // Mocked GPS movement near Mumbai center
      const lat = 19.0760 + (Math.random() - 0.5) * 0.01;
      const lng = 72.8777 + (Math.random() - 0.5) * 0.01;

      await api.post(`/logistics/tasks/${taskId}/location`, {
        latitude: lat,
        longitude: lng,
      });

      setSuccess(`GPS Ping Updated: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    } catch (err: any) {
      setError('Failed to update live GPS location');
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
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Truck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              MediShare Fleet & Delivery Portal
            </h1>
            <p className="text-xs text-slate-400">Driver / Volunteer: {user?.fullName || user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
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

        {/* SECTION 1: Active Deliveries Assigned to Current Volunteer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-cyan-400" />
              My Active Deliveries & Handover Tasks
            </h2>
            <span className="text-xs text-slate-400 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full">
              {myTasks.filter((t) => t.status !== 'COMPLETED').length} Active Tasks
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading active tasks...</div>
          ) : myTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
              You have no active delivery tasks. Accept an available task below to get started!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myTasks.map((task) => (
                <div
                  key={task._id}
                  className={`bg-slate-950 border ${
                    task.status === 'COMPLETED' ? 'border-emerald-500/20' : 'border-slate-800'
                  } rounded-xl p-5 space-y-4`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {task.taskType?.replace(/_/g, ' ')}
                      </span>
                      <h3 className="font-bold text-white text-base mt-2">
                        {task.equipmentId?.name || 'Medical Equipment'}
                      </h3>
                      <p className="text-xs text-slate-400">Asset ID: {task.equipmentId?.assetId || 'N/A'}</p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  {/* Route Summary */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-slate-500">Pickup:</span>{' '}
                        {task.pickupAddress?.street || task.pickupAddress?.city || 'Warehouse / Donor Center'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <ArrowRight className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <span className="text-slate-500">Dropoff:</span>{' '}
                        {task.dropoffAddress?.street || task.dropoffAddress?.city || 'Beneficiary Address'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {task.status !== 'COMPLETED' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleSendLocationPing(task._id)}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Ping GPS
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTaskForOtp(task);
                          setOtpInput('');
                        }}
                        className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Enter Handover OTP
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Open / Available Dispatch Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-400" />
              Available Open Dispatch Tasks
            </h2>
            <span className="text-xs text-slate-400 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full">
              {availableTasks.length} Unassigned
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading available dispatch tasks...</div>
          ) : availableTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No unassigned tasks currently in the queue.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {task.taskType?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-amber-400 font-medium">UNASSIGNED</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-teal-400 text-base">
                        {task.equipmentId?.name || 'Equipment Package'}
                      </h3>
                      <p className="text-xs text-slate-400">Category: {task.equipmentId?.category}</p>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p>City: <span className="text-slate-200">{task.dropoffAddress?.city || 'Local Area'}</span></p>
                      <p>Created: {new Date(task.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptTask(task._id)}
                    className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/10"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Accept & Start Delivery
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* OTP Verification Modal */}
      {selectedTaskForOtp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-400" />
                Verify Recipient Handover OTP
              </h3>
              <button onClick={() => setSelectedTaskForOtp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Ask the beneficiary/recipient for their 6-digit confirmation OTP code to complete this delivery.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                6-Digit Handover Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 849201"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-xl font-mono tracking-widest text-teal-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedTaskForOtp(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                disabled={verifyingOtp || otpInput.length < 6}
                onClick={handleVerifyOtp}
                className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyingOtp ? 'Verifying...' : 'Verify & Complete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}