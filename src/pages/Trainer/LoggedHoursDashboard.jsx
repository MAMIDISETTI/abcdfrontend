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

const LoggedHoursDashboard = () => {
  const [timePeriod, setTimePeriod] = useState("week");
  const [filterBy, setFilterBy] = useState("all"); // all, trainees, specific

  // Mock data for logged hours
  const loggedHoursData = [
    { day: "11 Sep", hours: 8.5, trainee: "John Doe", status: "On Time" },
    { day: "12", hours: 7.5, trainee: "Jane Smith", status: "Late" },
    { day: "13", hours: 8.0, trainee: "Mike Johnson", status: "On Time" },
    { day: "14", hours: 0, trainee: "Sarah Wilson", status: "Weekly Off" },
    { day: "15", hours: 8.5, trainee: "Tom Brown", status: "On Time" },
    { day: "16", hours: 8.0, trainee: "Lisa Davis", status: "Late" },
    { day: "17", hours: 0, trainee: "Alex Green", status: "Weekly Off" }
  ];

  const traineeList = [
    { id: 1, name: "John Doe", totalHours: 42.5, avgHours: 8.5, status: "Active" },
    { id: 2, name: "Jane Smith", totalHours: 38.0, avgHours: 7.6, status: "Active" },
    { id: 3, name: "Mike Johnson", totalHours: 40.0, avgHours: 8.0, status: "Active" },
    { id: 4, name: "Sarah Wilson", totalHours: 35.0, avgHours: 7.0, status: "Active" },
    { id: 5, name: "Tom Brown", totalHours: 41.5, avgHours: 8.3, status: "Active" },
    { id: 6, name: "Lisa Davis", totalHours: 39.0, avgHours: 7.8, status: "Active" },
    { id: 7, name: "Alex Green", totalHours: 36.5, avgHours: 7.3, status: "Active" }
  ];

  const getTotalHours = () => {
    return loggedHoursData.reduce((sum, item) => sum + item.hours, 0).toFixed(1);
  };

  const getAverageHours = () => {
    const workingDays = loggedHoursData.filter(item => item.hours > 0);
    return workingDays.length > 0 ? (workingDays.reduce((sum, item) => sum + item.hours, 0) / workingDays.length).toFixed(1) : 0;
  };

  const getOnTimePercentage = () => {
    const onTimeDays = loggedHoursData.filter(item => item.status === "On Time").length;
    const totalWorkingDays = loggedHoursData.filter(item => item.hours > 0).length;
    return totalWorkingDays > 0 ? ((onTimeDays / totalWorkingDays) * 100).toFixed(1) : 0;
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Logged Hours Dashboard</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">Detailed view of logged hours for all trainees</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                <LuClock className="text-blue-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Hours</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getTotalHours()}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                <LuTrendingUp className="text-green-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Average Hours</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getAverageHours()}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-orange-100 rounded-lg">
                <LuUsers className="text-orange-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">On Time %</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getOnTimePercentage()}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
                <LuCalendar className="text-purple-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Active Trainees</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{traineeList.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Hours Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Hours Breakdown</h3>
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
                <BarChart data={loggedHoursData}>
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
                  <Bar dataKey="hours" fill="#3b82f6" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loggedHoursData}>
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
                  <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trainees List */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Trainees Performance</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search trainees..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {traineeList.map((trainee) => (
                  <tr key={trainee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium text-sm">
                            {trainee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{trainee.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.totalHours}h</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.avgHours}h</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
      </div>
    </DashboardLayout>
  );
};

export default LoggedHoursDashboard;
