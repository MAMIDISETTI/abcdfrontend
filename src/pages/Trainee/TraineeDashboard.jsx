import React, { useState, useEffect, useContext } from 'react';
import TraineeLayout from '../../components/layouts/TraineeLayout';
import { 
  LuCalendar, 
  LuCheck, 
  LuVideo, 
  LuUser, 
  LuClock, 
  LuPlus, 
  LuEye, 
  LuBookOpen,
  LuTarget,
  LuTrendingUp,
  LuAward,
  LuFileText,
  LuPlay,
  LuStar,
  LuBell,
  LuSettings,
  LuChevronRight,
  LuUsers,
  LuClock3,
  LuInfo,
  LuLoader,
  LuTrophy,
  LuZap,
  LuRocket,
  LuHeart,
  LuShield,
  LuGift,
  LuSparkles
} from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const TraineeDashboard = () => {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingTasks: 0,
    totalHours: 0,
    currentStreak: 0,
    averageScore: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch various data points for the dashboard
      const [assignmentsRes, dayPlansRes, resultsRes] = await Promise.all([
        axiosInstance.get(API_PATHS.ASSIGNMENTS.GET_TRAINEE).catch(() => ({ data: { assignments: [] } })),
        axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_ALL).catch(() => ({ data: { dayPlans: [] } })),
        axiosInstance.get(API_PATHS.TRAINEE.MCQ_RESULTS).catch(() => ({ data: { results: [] } }))
      ]);

      const assignments = assignmentsRes.data.assignments || [];
      const dayPlans = dayPlansRes.data.dayPlans || [];
      const results = resultsRes.data.results || [];

      // Calculate stats
      const completedAssignments = assignments.filter(a => a.status === 'completed').length;
      const pendingTasks = dayPlans.filter(p => p.status === 'pending').length;
      const totalHours = dayPlans.reduce((sum, plan) => {
        return sum + (plan.tasks?.reduce((taskSum, task) => taskSum + (parseInt(task.timeAllocation) || 0), 0) || 0);
      }, 0);
      
      const averageScore = results.length > 0 
        ? results.reduce((sum, result) => sum + ((result.score / result.totalQuestions) * 100), 0) / results.length 
        : 0;

      setStats({
        totalAssignments: assignments.length,
        completedAssignments,
        pendingTasks,
        totalHours,
        currentStreak: 7, // Mock data - would calculate from actual data
        averageScore: Math.round(averageScore)
      });

      // Set recent activity
      const activities = [
        ...assignments.slice(0, 3).map(a => ({
          id: a._id,
          type: 'assignment',
          title: a.title,
          time: a.updatedAt,
          status: a.status,
          icon: LuBookOpen
        })),
        ...dayPlans.slice(0, 2).map(p => ({
          id: p._id,
          type: 'dayplan',
          title: `Day Plan - ${moment(p.date).format('MMM DD')}`,
          time: p.submittedAt || p.createdAt,
          status: p.status,
          icon: LuCalendar
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

      setRecentActivity(activities);

      // Set upcoming deadlines
      const deadlines = assignments
        .filter(a => a.dueDate && moment(a.dueDate).isAfter(moment()))
        .map(a => ({
          id: a._id,
          title: a.title,
          dueDate: a.dueDate,
          type: 'assignment'
        }))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 3);

      setUpcomingDeadlines(deadlines);

      // Set mock achievements
      setAchievements([
        { id: 1, title: "First Assignment", description: "Complete your first assignment", icon: LuTrophy, unlocked: true, progress: 100 },
        { id: 2, title: "Week Warrior", description: "Complete 7 days in a row", icon: LuZap, unlocked: true, progress: 100 },
        { id: 3, title: "High Scorer", description: "Score 90% or above", icon: LuStar, unlocked: false, progress: 75 },
        { id: 4, title: "Speed Learner", description: "Complete 10 assignments quickly", icon: LuRocket, unlocked: false, progress: 60 },
        { id: 5, title: "Consistent Performer", description: "Maintain 80% average", icon: LuHeart, unlocked: false, progress: 45 },
        { id: 6, title: "Perfect Week", description: "Get 100% on all weekly tasks", icon: LuShield, unlocked: false, progress: 0 }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TraineeLayout activeMenu="Dashboard">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your learning journey...</p>
            </div>
          </div>
        </div>
      </TraineeLayout>
    );
  }

  return (
    <TraineeLayout activeMenu="Dashboard">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500"></div>
          <div className="relative px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6">
                  <LuSparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  Ready to Learn, {user?.name}? 🚀
                </h1>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Your personalized learning dashboard is here to guide you through your journey to success!
                </p>
                <div className="flex flex-wrap justify-center gap-6 text-white">
                  <div className="flex items-center space-x-2">
                    <LuBookOpen className="w-6 h-6" />
                    <span className="text-lg font-semibold">{stats.totalAssignments} Assignments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <LuCheck className="w-6 h-6" />
                    <span className="text-lg font-semibold">{stats.completedAssignments} Completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <LuClock className="w-6 h-6" />
                    <span className="text-lg font-semibold">{stats.totalHours}h Learned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <LuTarget className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{stats.completedAssignments}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Completed</h3>
                <p className="text-sm text-gray-600">Assignments finished</p>
                <div className="mt-4 bg-purple-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.totalAssignments > 0 ? (stats.completedAssignments / stats.totalAssignments) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <LuTrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.averageScore}%</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance</h3>
                <p className="text-sm text-gray-600">Average score</p>
                <div className="mt-4 bg-blue-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.averageScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <LuZap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-green-600">{stats.currentStreak}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Streak</h3>
                <p className="text-sm text-gray-600">Days in a row</p>
                <div className="mt-4 bg-green-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((stats.currentStreak / 30) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <LuClock className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{stats.totalHours}h</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Study Time</h3>
                <p className="text-sm text-gray-600">Total hours</p>
                <div className="mt-4 bg-orange-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((stats.totalHours / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Learning Path */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Your Learning Path</h2>
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <LuRocket className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                        <LuCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Complete Assignments</h3>
                        <p className="text-sm text-gray-600">Finish your pending tasks to progress</p>
                      </div>
                      <span className="text-blue-600 font-semibold">{stats.completedAssignments}/{stats.totalAssignments}</span>
                    </div>

                    <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                        <LuStar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Improve Performance</h3>
                        <p className="text-sm text-gray-600">Aim for higher scores in your tests</p>
                      </div>
                      <span className="text-green-600 font-semibold">{stats.averageScore}%</span>
                    </div>

                    <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                        <LuHeart className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Maintain Streak</h3>
                        <p className="text-sm text-gray-600">Keep learning every day</p>
                      </div>
                      <span className="text-purple-600 font-semibold">{stats.currentStreak} days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
                    <LuTrophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="space-y-3">
                    {achievements.slice(0, 4).map((achievement) => (
                      <div key={achievement.id} className={`p-3 rounded-lg border-2 ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            achievement.unlocked 
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                              : 'bg-gray-300'
                          }`}>
                            <achievement.icon className={`w-4 h-4 ${
                              achievement.unlocked ? 'text-white' : 'text-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {achievement.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-1">
                                <div 
                                  className={`h-1 rounded-full ${
                                    achievement.unlocked 
                                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                                      : 'bg-gray-300'
                                  }`}
                                  style={{ width: `${achievement.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{achievement.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <a href="/trainee/assignments" className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
                      <LuBookOpen className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="font-medium text-gray-900">View Assignments</span>
                      <LuChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </a>
                    <a href="/trainee/results" className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all duration-200">
                      <LuTrendingUp className="w-5 h-5 text-green-600 mr-3" />
                      <span className="font-medium text-gray-900">Check Results</span>
                      <LuChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </a>
                    <a href="/trainee/day-plans" className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200">
                      <LuCalendar className="w-5 h-5 text-purple-600 mr-3" />
                      <span className="font-medium text-gray-900">Plan Your Day</span>
                      <LuChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TraineeLayout>
  );
};

export default TraineeDashboard;