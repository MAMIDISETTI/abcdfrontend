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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const LateByDashboard = () => {
  const [timePeriod, setTimePeriod] = useState("week");
  const [severity, setSeverity] = useState("all"); // all, minor, moderate, severe

  // Mock data for late arrivals
  const lateData = [
    { day: "11 Sep", lateBy: 0, trainee: "John Doe", reason: "Traffic" },
    { day: "12", lateBy: 0.5, trainee: "Jane Smith", reason: "Public Transport Delay" },
    { day: "13", lateBy: 0, trainee: "Mike Johnson", reason: "On Time" },
    { day: "14", lateBy: 0, trainee: "Sarah Wilson", reason: "Weekly Off" },
    { day: "15", lateBy: 1.5, trainee: "Tom Brown", reason: "Personal Emergency" },
    { day: "16", lateBy: 0, trainee: "Lisa Davis", reason: "On Time" },
    { day: "17", lateBy: 0, trainee: "Alex Green", reason: "Weekly Off" }
  ];

  const traineeLateList = [
    { id: 1, name: "John Doe", totalLate: 0, avgLate: 0, severity: "Good", incidents: 0 },
    { id: 2, name: "Jane Smith", totalLate: 2.5, avgLate: 0.5, severity: "Minor", incidents: 5 },
    { id: 3, name: "Mike Johnson", totalLate: 0, avgLate: 0, severity: "Good", incidents: 0 },
    { id: 4, name: "Sarah Wilson", totalLate: 0, avgLate: 0, severity: "Good", incidents: 0 },
    { id: 5, name: "Tom Brown", totalLate: 4.5, avgLate: 1.1, severity: "Moderate", incidents: 4 },
    { id: 6, name: "Lisa Davis", totalLate: 0, avgLate: 0, severity: "Good", incidents: 0 },
    { id: 7, name: "Alex Green", totalLate: 0, avgLate: 0, severity: "Good", incidents: 0 }
  ];

  const getTotalLateHours = () => {
    return lateData.reduce((sum, item) => sum + item.lateBy, 0).toFixed(1);
  };

  const getAverageLate = () => {
    const lateDays = lateData.filter(item => item.lateBy > 0);
    return lateDays.length > 0 ? (lateDays.reduce((sum, item) => sum + item.lateBy, 0) / lateDays.length).toFixed(1) : 0;
  };

  const getLateIncidents = () => {
    return lateData.filter(item => item.lateBy > 0).length;
  };

  const getOnTimePercentage = () => {
    const onTimeDays = lateData.filter(item => item.lateBy === 0 && item.reason !== "Weekly Off").length;
    const totalWorkingDays = lateData.filter(item => item.reason !== "Weekly Off").length;
    return totalWorkingDays > 0 ? ((onTimeDays / totalWorkingDays) * 100).toFixed(1) : 0;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Good": return "bg-green-100 text-green-800";
      case "Minor": return "bg-yellow-100 text-yellow-800";
      case "Moderate": return "bg-orange-100 text-orange-800";
      case "Severe": return "bg-red-100 text-red-800";
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Late By Dashboard</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">Track late arrivals and punctuality patterns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-orange-100 rounded-lg">
                <LuClock className="text-orange-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Late Hours</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getTotalLateHours()}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-red-100 rounded-lg">
                <LuClock className="text-red-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Late Incidents</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getLateIncidents()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                <LuTrendingUp className="text-blue-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Avg Late Time</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getAverageLate()}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                <LuUsers className="text-green-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">On Time %</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getOnTimePercentage()}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Late Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Late Hours</h3>
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
                <BarChart data={lateData}>
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
                  <Bar dataKey="lateBy" fill="#f97316" name="Late By (Hours)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Late Arrival Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line type="monotone" dataKey="lateBy" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trainees Late List */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Trainees Punctuality Report</h3>
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
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Severity</option>
                <option value="good">Good</option>
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Late (h)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Late (h)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incidents</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {traineeLateList.map((trainee) => (
                  <tr key={trainee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-orange-600 font-medium text-sm">
                            {trainee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{trainee.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.totalLate}h</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.avgLate}h</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.incidents}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(trainee.severity)}`}>
                        {trainee.severity}
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

        {/* Common Reasons */}
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-900 mb-2">Common Late Arrival Reasons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">Traffic</span>
              <span className="text-sm font-medium text-orange-900">40%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">Public Transport Delay</span>
              <span className="text-sm font-medium text-orange-900">30%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">Personal Emergency</span>
              <span className="text-sm font-medium text-orange-900">20%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">Other</span>
              <span className="text-sm font-medium text-orange-900">10%</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LateByDashboard;
