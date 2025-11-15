import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../../context/userContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import moment from "moment";
import { addThousandsSeparator } from "../../utils/helper";
import InfoCard from "../../components/Cards/InfoCard";
import { 
  LuArrowRight, 
  LuUsers, 
  LuCalendar, 
  LuEye, 
  LuTrendingUp,
  LuActivity,
  LuTarget,
  LuStar,
  LuPlus,
  LuChevronRight,
  LuUserCheck,
  LuFileText
} from "react-icons/lu";
import { toast } from "react-hot-toast";
import TraineesPopup from "../../components/TraineesPopup";

const TrainerDashboard = () => {
  const { user } = useContext(UserContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isClockedOut, setIsClockedOut] = useState(false);
  const [showTraineesPopup, setShowTraineesPopup] = useState(false);

  // Fetch trainer dashboard data
  const getTrainerDashboard = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.DASHBOARD.TRAINER);
      setDashboardData(res.data);
      
      // Check today's attendance status
      const today = res.data?.overview?.todayClockIn;
      setIsClockedIn(!!today);
      setIsClockedOut(!!res.data?.overview?.todayClockOut);
    } catch (err) {
      console.error("Error loading trainer dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto clock-in on login
  const handleAutoClockIn = async () => {
    try {
      const res = await axiosInstance.post(API_PATHS.ATTENDANCE.CLOCK_IN, {});
      const t = res?.data?.clockInTime
        ? new Date(res.data.clockInTime).toLocaleTimeString()
        : new Date().toLocaleTimeString();
      toast.success(`Clocked in at ${t}`);
      setIsClockedIn(true);
      await getTrainerDashboard();
    } catch (err) {
      console.error("Error clocking in", err);
      toast.error("Failed to clock in");
    }
  };

  // Auto clock-out on logout
  const handleAutoClockOut = async () => {
    try {
      const res = await axiosInstance.post(API_PATHS.ATTENDANCE.CLOCK_OUT, {});
      const t = res?.data?.clockOutTime
        ? new Date(res.data.clockOutTime).toLocaleTimeString()
        : new Date().toLocaleTimeString();
      toast.success(`Clocked out at ${t}`);
      setIsClockedOut(true);
      await getTrainerDashboard();
    } catch (err) {
      console.error("Error clocking out", err);
      toast.error("Failed to clock out");
    }
  };

  useEffect(() => {
    getTrainerDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const overview = dashboardData?.overview || {};
  const stats = dashboardData?.stats || {};

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="min-h-screen bg-slate-100/80">
        {/* Header */}
        

        <div className="max-w-7xl mx-auto px-6 py-10 lg:px-8">
          {/* Quick Actions */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Jump into the tasks you manage most often.
                </p>
              </div>
              <button
                onClick={() => setShowTraineesPopup(true)}
                className="hidden md:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-400 hover:text-blue-700"
              >
                <LuUsers className="h-4 w-4" />
                Review Roster
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <button
                onClick={() => setShowTraineesPopup(true)}
                className="cursor-pointer group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                      <LuUsers className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Assigned Trainees</h3>
                      <p className="mt-1 text-sm text-gray-500">Review onboarding status and contact details.</p>
                    </div>
                  </div>
                  <LuChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-blue-600" />
                </div>
                <div className="mt-6 text-2xl font-semibold text-blue-600">{stats.totalTrainees || 0}</div>
              </button>
              
              <button
                onClick={() => window.location.href = '/trainer/day-plans'}
                className="cursor-pointer group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
                      <LuCalendar className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Create Day Plan</h3>
                      <p className="mt-1 text-sm text-gray-500">Schedule practical sessions and agenda points.</p>
                    </div>
                  </div>
                  <LuChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-emerald-600" />
                </div>
                <div className="mt-6 text-2xl font-semibold text-emerald-600">{stats.totalDayPlans || 0}</div>
              </button>
              
              <button
                onClick={() => window.location.href = '/trainer/observations'}
                className="cursor-pointer group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600">
                      <LuEye className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Record Observation</h3>
                      <p className="mt-1 text-sm text-gray-500">Log field notes and share coaching feedback.</p>
                    </div>
                  </div>
                  <LuChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-indigo-600" />
                </div>
                <div className="mt-6 text-2xl font-semibold text-indigo-600">{stats.totalObservations || 0}</div>
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Assigned Trainees Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                        <LuUsers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Assigned Trainees</h3>
                        <p className="text-sm text-gray-500">Stay on top of trainee allocations and contact info.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowTraineesPopup(true)}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      View All
                      <LuChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {dashboardData?.assignedTrainees?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.assignedTrainees.slice(0, 5).map((trainee, index) => (
                        <div key={trainee._id} className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/60 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                              {trainee.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{trainee.name}</p>
                              <p className="text-sm text-gray-500">{trainee.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                            <span className="hidden sm:inline-block text-xs uppercase tracking-wide text-slate-400">
                              Last interaction {moment(trainee.updatedAt || trainee.createdAt).fromNow()}
                            </span>
                            <LuChevronRight className="h-4 w-4 text-slate-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <LuUsers className="h-8 w-8" />
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-gray-900">No assigned trainees yet</h4>
                      <p className="mt-2 max-w-sm text-sm text-gray-500">
                        Reach out to your program coordinator to assign trainees and start tracking their activity.
                      </p>
                      <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                        <LuPlus className="h-4 w-4" />
                        Request Assignment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Day Plans Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
                      <LuCalendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent Day Plans</h3>
                      <p className="text-sm text-gray-500">Stay aligned with the agenda for upcoming sessions.</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-500 shadow-sm">
                      <LuFileText className="w-6 h-6" />
                    </div>
                    <h4 className="mt-4 text-base font-semibold text-gray-900">No recent day plans</h4>
                    <p className="mt-2 text-sm text-gray-500">
                      Build your first plan to outline priorities and share expectations with trainees.
                    </p>
                    <button 
                      onClick={() => window.location.href = '/trainer/day-plans'}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                    >
                      <LuPlus className="w-4 h-4" />
                      Create Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trainees Popup */}
        {showTraineesPopup && (
          <TraineesPopup
            isOpen={showTraineesPopup}
            onClose={() => setShowTraineesPopup(false)}
            trainees={dashboardData?.assignedTrainees || []}
            title="Assigned Trainees"
            showAssignmentStatus={true}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrainerDashboard;