import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { NotificationProvider } from "./context/notificationContext";
import Dashboard from "./pages/Admin/Dashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminLayout from "./pages/Admin/AdminLayout";
import UserManagement from "./pages/Admin/UserManagement";
import MCQDeployments from "./pages/Admin/MCQDeployments";
import MasterTrainerDashboard from "./pages/MasterTrainer/MasterTrainerDashboard";
import MasterTrainerDayPlans from "./pages/MasterTrainer/DayPlans";
import MasterTrainerDayPlanReport from "./pages/MasterTrainer/DayPlanReport";
import Assignments from "./pages/MasterTrainer/Assignments";
import MasterTrainerObservations from "./pages/MasterTrainer/Observations";
import MasterTrainerDemoManagement from "./pages/MasterTrainer/DemoManagement";
import CampusAllocation from "./pages/MasterTrainer/CampusAllocation";
import MasterTrainerResults from "./pages/MasterTrainer/Results";
import Notifications from "./pages/Common/Notifications";
import NotFound from "./pages/Common/NotFound";

// BOA pages
import BOADashboard from "./pages/BOA/BOADashboard";
import NewJoiners from "./pages/BOA/NewJoiners";
import AssignTrainees from "./pages/BOA/AssignTrainees";
import UploadResults from "./pages/BOA/UploadResults";
import ReportsStats from "./pages/BOA/ReportsStats";
import BOASettings from "./pages/BOA/Settings";
import BOAResults from "./pages/BOA/Results";

import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import CreateAdmin from "./pages/Auth/CreateAdmin";
import ManageTasks from "./pages/Admin/ManageTasks";
import CreateTask from "./pages/Admin/CreateTask";
import ManageUsers from "./pages/Admin/ManageUsers";

import UserDashboard from "./pages/User/UserDashboard";
import MyTasks from "./pages/User/MyTasks";
import ViewTaskDetails from "./pages/User/ViewTaskDetails";

// Trainer pages
import TrainerDashboard from "./pages/Trainer/TrainerDashboard";
import DayPlans from "./pages/Trainer/DayPlans";
import TrainerResults from "./pages/Trainer/Results";
import Observations from "./pages/Trainer/Observations";
import TrainerDemoManagement from "./pages/Trainer/DemoManagement";
import LoggedHoursDashboard from "./pages/Trainer/LoggedHoursDashboard";
import WeeklyOffDashboard from "./pages/Trainer/WeeklyOffDashboard";
import LateByDashboard from "./pages/Trainer/LateByDashboard";
import AbsentDashboard from "./pages/Trainer/AbsentDashboard";

// Trainee pages
import TraineeMainDashboard from "./pages/Trainee/TraineeMainDashboard";
import TraineeDashboard from "./pages/Trainee/TraineeDashboard";
import TraineeAssignments from "./pages/Trainee/Assignments";
import TraineeResults from "./pages/Trainee/Results";
import DemoManagement from "./pages/Trainee/DemoManagement";
import LearningReports from "./pages/Trainee/LearningReports";
import ProfileSettings from "./pages/Trainee/ProfileSettings";

// Common pages
import Unauthorized from "./pages/Common/Unauthorized";

import PrivateRoute from "./routes/PrivateRoute";
import UserProvider, { UserContext } from "./context/userContext";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <UserProvider>
      <NotificationProvider>
        <div>
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signUp" element={<SignUp />} />
            <Route path="/create-admin" element={<CreateAdmin />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Master Trainer Routes */}
            <Route element={<PrivateRoute allowedRoles={["master_trainer"]} />}>
              <Route path="/master-trainer/dashboard" element={<MasterTrainerDashboard />} />
              <Route path="/master-trainer/day-plans" element={<MasterTrainerDayPlans />} />
              <Route path="/master-trainer/observations" element={<MasterTrainerObservations />} />
              <Route path="/master-trainer/assignments" element={<Assignments />} />
              <Route path="/master-trainer/demo-management" element={<MasterTrainerDemoManagement />} />
              <Route path="/master-trainer/campus-allocation" element={<CampusAllocation />} />
              <Route path="/master-trainer/reports" element={<CreateTask />} />
              <Route path="/master-trainer/reports/day-plan/:id" element={<MasterTrainerDayPlanReport />} />
              <Route path="/master-trainer/users" element={<ManageUsers />} />
              <Route path="/master-trainer/results" element={<MasterTrainerResults />} />
              <Route path="/master-trainer/notifications" element={<Notifications />} />
            </Route>

            {/* BOA Routes */}
            <Route element={<PrivateRoute allowedRoles={["boa"]} />}>
              <Route path="/boa/dashboard" element={<BOADashboard />} />
              <Route path="/boa/new-joiners" element={<NewJoiners />} />
              <Route path="/boa/assign-trainees" element={<AssignTrainees />} />
              <Route path="/boa/upload-results" element={<UploadResults />} />
              <Route path="/boa/results" element={<BOAResults />} />
              <Route path="/boa/reports-stats" element={<ReportsStats />} />
              <Route path="/boa/settings" element={<BOASettings />} />
              <Route path="/boa/notifications" element={<Notifications />} />
            </Route>

            {/* Trainer Routes */}
            <Route element={<PrivateRoute allowedRoles={["trainer"]} />}>
              <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              <Route path="/trainer/day-plans" element={<DayPlans />} />
              <Route path="/trainer/observations" element={<Observations />} />
              <Route path="/trainer/demo-management" element={<TrainerDemoManagement />} />
              <Route path="/trainer/results" element={<TrainerResults />} />
              <Route path="/trainer/logged-hours-dashboard" element={<LoggedHoursDashboard />} />
              <Route path="/trainer/weekly-off-dashboard" element={<WeeklyOffDashboard />} />
              <Route path="/trainer/late-by-dashboard" element={<LateByDashboard />} />
              <Route path="/trainer/absent-dashboard" element={<AbsentDashboard />} />
              <Route path="/trainer/notifications" element={<Notifications />} />
            </Route>

            {/* Trainee Routes */}
            <Route element={<PrivateRoute allowedRoles={["trainee"]} />}>
              <Route path="/trainee/dashboard" element={<TraineeMainDashboard />} />
              <Route path="/trainee/assignments" element={<TraineeAssignments />} />
              <Route path="/trainee/results" element={<TraineeResults />} />
              <Route path="/trainee/day-plans" element={<MyTasks />} />
              <Route path="/trainee/demo-management" element={<DemoManagement />} />
              <Route path="/trainee/learning-reports" element={<LearningReports />} />
              <Route path="/trainee/attendance" element={<ViewTaskDetails />} />
              <Route path="/trainee/profile-settings" element={<ProfileSettings />} />
              <Route path="/trainee/notifications" element={<Notifications />} />
            </Route>

            {/* Legacy Admin Routes (keeping for backward compatibility) */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/*" element={<AdminLayout />} />
              <Route path="/admin/tasks" element={<ManageTasks />} />
              <Route path="/admin/create-task" element={<CreateTask />} />
              <Route path="/admin/legacy-users" element={<ManageUsers />} />
            </Route>

            {/* Legacy User Routes (keeping for backward compatibility) */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/tasks" element={<MyTasks />} />
              <Route
                path="/user/task-details/:id"
                element={<ViewTaskDetails />}
              />
            </Route>

             {/* Default Route */}
            <Route path="/" element={<Root />} />
            
            {/* 404 - Catch all unmatched routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </div>

      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "13px",
          },
        }}
      />
      </NotificationProvider>
    </UserProvider>
  );
};

export default App;

const Root = () => {
  const { user, loading } = useContext(UserContext);

  if(loading) return <Outlet />
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Route based on user role
  if (user.role === "master_trainer") {
    return <Navigate to="/master-trainer/dashboard" />;
  } else if (user.role === "boa") {
    return <Navigate to="/boa/dashboard" />;
  } else if (user.role === "trainer") {
    return <Navigate to="/trainer/dashboard" />;
  } else if (user.role === "trainee") {
    return <Navigate to="/trainee/dashboard" />;
  } else if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" />;
  } else {
    return <Navigate to="/user/dashboard" />;
  }
};