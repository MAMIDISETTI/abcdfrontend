import React, { useState, useEffect } from "react";
import { 
  LuClock, 
  LuTrendingUp,
  LuCalendar,
  LuUsers,
  LuChevronLeft,
  LuFilter,
  LuSearch,
  LuDownload
} from "react-icons/lu";
import moment from "moment";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AbsentDashboard = () => {
  const [timePeriod, setTimePeriod] = useState("week");
  const [absenceType, setAbsenceType] = useState("all"); // all, unexcused, excused, medical

  // Mock data for absences
  const absentData = [
    { day: "11 Sep", absent: 0, trainee: "John Doe", reason: "Present" },
    { day: "12", absent: 0, trainee: "Jane Smith", reason: "Present" },
    { day: "13", absent: 0, trainee: "Mike Johnson", reason: "Present" },
    { day: "14", absent: 0, trainee: "Sarah Wilson", reason: "Weekly Off" },
    { day: "15", absent: 8.5, trainee: "Tom Brown", reason: "Unexcused Absence" },
    { day: "16", absent: 0, trainee: "Lisa Davis", reason: "Present" },
    { day: "17", absent: 0, trainee: "Alex Green", reason: "Weekly Off" }
  ];

  const absenceBreakdown = [
    { name: "Unexcused", value: 1, color: "#dc2626" },
    { name: "Medical", value: 0, color: "#f87171" },
    { name: "Personal", value: 0, color: "#60a5fa" },
    { name: "Emergency", value: 0, color: "#fbbf24" }
  ];

  const traineeAbsentList = [
    { id: 1, name: "John Doe", totalAbsent: 0, incidents: 0, lastAbsent: "Never", status: "Good" },
    { id: 2, name: "Jane Smith", totalAbsent: 0, incidents: 0, lastAbsent: "Never", status: "Good" },
    { id: 3, name: "Mike Johnson", totalAbsent: 0, incidents: 0, lastAbsent: "Never", status: "Good" },
    { id: 4, name: "Sarah Wilson", totalAbsent: 0, incidents: 0, lastAbsent: "Never", status: "Good" },
    { id: 5, name: "Tom Brown", totalAbsent: 8.5, incidents: 1, lastAbsent: "15 Sep", status: "Warning" },
    { id: 6, name: "Lisa Davis", totalAbsent: 0, incidents: 0, lastAbsent: "Never", status: "Good" },
    { id: 7, name: "Alex Green", totalAbsent: 0, incidents: 0, lastAbsent: "Never", status: "Good" }
  ];

  const getTotalAbsentHours = () => {
    return absentData.reduce((sum, item) => sum + item.absent, 0).toFixed(1);
  };

  const getAbsentIncidents = () => {
    return absentData.filter(item => item.absent > 0).length;
  };

  const getAttendanceRate = () => {
    const totalWorkingDays = absentData.filter(item => item.reason !== "Weekly Off").length;
    const presentDays = absentData.filter(item => item.reason === "Present").length;
    return totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : 0;
  };

  const getTraineesWithAbsences = () => {
    return traineeAbsentList.filter(trainee => trainee.incidents > 0).length;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Good": return "bg-green-100 text-green-800";
      case "Warning": return "bg-yellow-100 text-yellow-800";
      case "Critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout activeMenu="Overview">
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LuChevronLeft className="text-gray-600 text-xl" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Absent Dashboard</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">Track absences and attendance compliance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-red-100 rounded-lg">
                <LuClock className="text-red-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Absent Hours</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getTotalAbsentHours()}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-orange-100 rounded-lg">
                <LuClock className="text-orange-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Absent Incidents</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getAbsentIncidents()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                <LuTrendingUp className="text-green-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Attendance Rate</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getAttendanceRate()}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                <LuUsers className="text-blue-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Trainees with Absences</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getTraineesWithAbsences()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Absent Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Absence Hours</h3>
              <div className="flex items-center gap-2">
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={absentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="absent" fill="#dc2626" name="Absent Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Absence Type Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Absence Type Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={absenceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {absenceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trainees Absent List */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Trainees Absence Report</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search trainees..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={absenceType}
                onChange={(e) => setAbsenceType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="unexcused">Unexcused</option>
                <option value="excused">Excused</option>
                <option value="medical">Medical</option>
              </select>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <LuFilter className="text-lg" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <LuDownload className="text-lg" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Absent (h)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incidents</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Absent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {traineeAbsentList.map((trainee) => (
                  <tr key={trainee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-red-600 font-medium text-sm">
                            {trainee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{trainee.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.totalAbsent}h</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.incidents}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.lastAbsent}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trainee.status)}`}>
                        {trainee.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="cursor-pointer text-blue-600 hover:text-blue-900">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Policy */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-900 mb-2">Attendance Policy Reminder</h3>
          <div className="text-sm text-red-700 space-y-1">
            <p>• Unexcused absences require immediate attention and follow-up</p>
            <p>• More than 3 unexcused absences in a month may result in disciplinary action</p>
            <p>• Medical absences require proper documentation</p>
            <p>• Trainees should notify in advance for planned absences</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AbsentDashboard;
