import React, { useState, useEffect } from "react";
import { 
  LuCalendar, 
  LuTrendingUp,
  LuClock,
  LuUsers,
  LuChevronLeft,
  LuFilter,
  LuSearch,
  LuDownload,
  LuInfo
} from "react-icons/lu";
import moment from "moment";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const WeeklyOffDashboard = () => {
  const [timePeriod, setTimePeriod] = useState("week");
  const [leaveType, setLeaveType] = useState("all"); // all, weekly-off, holiday, leave

  // Mock data for weekly off/holiday/leave
  const leaveData = [
    { day: "11 Sep", weeklyOff: 0, holiday: 0, leave: 0, total: 0 },
    { day: "12", weeklyOff: 0, holiday: 0, leave: 0, total: 0 },
    { day: "13", weeklyOff: 0, holiday: 0, leave: 0, total: 0 },
    { day: "14", weeklyOff: 8.5, holiday: 0, leave: 0, total: 8.5 },
    { day: "15", weeklyOff: 0, holiday: 0, leave: 0, total: 0 },
    { day: "16", weeklyOff: 0, holiday: 0, leave: 0, total: 0 },
    { day: "17", weeklyOff: 8.5, holiday: 0, leave: 0, total: 8.5 }
  ];

  const leaveBreakdown = [
    { name: "Weekly Off", value: 17, color: "#d1d5db" },
    { name: "Holiday", value: 0, color: "#fbbf24" },
    { name: "Personal Leave", value: 0, color: "#60a5fa" },
    { name: "Sick Leave", value: 0, color: "#f87171" }
  ];

  const traineeLeaveList = [
    { id: 1, name: "John Doe", weeklyOff: 2, holiday: 0, personalLeave: 0, sickLeave: 0, total: 2 },
    { id: 2, name: "Jane Smith", weeklyOff: 2, holiday: 1, personalLeave: 0, sickLeave: 0, total: 3 },
    { id: 3, name: "Mike Johnson", weeklyOff: 2, holiday: 0, personalLeave: 1, sickLeave: 0, total: 3 },
    { id: 4, name: "Sarah Wilson", weeklyOff: 2, holiday: 0, personalLeave: 0, sickLeave: 1, total: 3 },
    { id: 5, name: "Tom Brown", weeklyOff: 2, holiday: 0, personalLeave: 0, sickLeave: 0, total: 2 },
    { id: 6, name: "Lisa Davis", weeklyOff: 2, holiday: 0, personalLeave: 0, sickLeave: 0, total: 2 },
    { id: 7, name: "Alex Green", weeklyOff: 2, holiday: 0, personalLeave: 0, sickLeave: 0, total: 2 }
  ];

  const getTotalLeaveHours = () => {
    return leaveData.reduce((sum, item) => sum + item.total, 0).toFixed(1);
  };

  const getWeeklyOffCount = () => {
    return leaveData.filter(item => item.weeklyOff > 0).length;
  };

  const getHolidayCount = () => {
    return leaveData.filter(item => item.holiday > 0).length;
  };

  const getPersonalLeaveCount = () => {
    return leaveData.filter(item => item.leave > 0).length;
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Weekly Off / Holiday / Leave Dashboard</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">Detailed view of leave patterns and weekly off schedules</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                <LuCalendar className="text-gray-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Leave Hours</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getTotalLeaveHours()}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                <LuClock className="text-blue-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Weekly Off Days</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getWeeklyOffCount()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
                <LuTrendingUp className="text-yellow-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Holidays</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getHolidayCount()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-red-100 rounded-lg">
                <LuUsers className="text-red-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Personal Leave</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getPersonalLeaveCount()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Leave Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Leave Breakdown</h3>
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
                <BarChart data={leaveData}>
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
                  <Bar dataKey="weeklyOff" stackId="a" fill="#d1d5db" name="Weekly Off" />
                  <Bar dataKey="holiday" stackId="a" fill="#fbbf24" name="Holiday" />
                  <Bar dataKey="leave" stackId="a" fill="#60a5fa" name="Personal Leave" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leave Type Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Type Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trainees Leave List */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Trainees Leave Summary</h3>
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
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="weekly-off">Weekly Off</option>
                <option value="holiday">Holiday</option>
                <option value="leave">Personal Leave</option>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Off</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holiday</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personal Leave</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sick Leave</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {traineeLeaveList.map((trainee) => (
                  <tr key={trainee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-gray-600 font-medium text-sm">
                            {trainee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{trainee.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.weeklyOff}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.holiday}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.personalLeave}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{trainee.sickLeave}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trainee.total}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="cursor-pointer text-blue-600 hover:text-blue-900">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <LuInfo className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Leave Management</h3>
              <p className="text-sm text-blue-700">
                This dashboard shows all types of leave including weekly offs, holidays, and personal leave. 
                Use the filters to view specific leave types and track patterns across your trainees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WeeklyOffDashboard;
