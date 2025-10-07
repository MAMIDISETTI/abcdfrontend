export const BASE_URL = import.meta.env.VITE_API_URL || 'https://abcdbackend-wytb.onrender.com';


// utils/apiPaths.js
export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register", // Register a new user
    LOGIN: "/api/auth/login", // Authenticate user & return JWT token
    GET_PROFILE: "/api/auth/profile", // Get logged-in user details
    CHANGE_PASSWORD: "/api/auth/change-password", // Change password
  },

  USERS: {
    GET_ALL_USERS: "/api/users", // Get all users
    LIST: "/api/users", // Get users list (same as GET_ALL_USERS but more semantic)
    GET_USER_BY_ID: (userId) => `/api/users/${userId}`, // Get user by ID
    CREATE_USER: "/api/users", // Create a new user
    UPDATE_USER: (userId) => `/api/users/${userId}`, // Update user details
    DELETE_USER: (userId) => `/api/users/${userId}`, // Delete a user
  },

  // Training Management Platform APIs
  DASHBOARD: {
    MASTER_TRAINER: "/api/dashboard/master-trainer",
    TRAINER: "/api/dashboard/trainer",
    TRAINEE: "/api/dashboard/trainee",
  },

  ATTENDANCE: {
    CLOCK_IN: "/api/attendance/clock-in",
    CLOCK_OUT: "/api/attendance/clock-out",
    TODAY: "/api/attendance/today",
    HISTORY: "/api/attendance/history",
    TRAINEES: "/api/attendance/trainees",
    VALIDATE: (id) => `/api/attendance/validate/${id}`,
  },

  DAY_PLANS: {
    CREATE: "/api/dayplans",
    GET_ALL: "/api/dayplans",
    GET_BY_ID: (id) => `/api/dayplans/${id}`,
    UPDATE: (id) => `/api/dayplans/${id}`,
    PUBLISH: (id) => `/api/dayplans/${id}/publish`,
    DELETE: (id) => `/api/dayplans/${id}`,
    TRAINEE_LIST: "/api/dayplans/trainee/list",
    GET_TRAINEE_PLANS: "/api/dayplans/trainee/assigned",
    UPDATE_TASK: (id, taskIndex) => `/api/dayplans/${id}/tasks/${taskIndex}`,
  },

  ASSIGNMENTS: {
    CREATE: "/api/assignments",
    GET_ALL: "/api/assignments",
    GET_TRAINER: "/api/assignments/trainer",
    GET_TRAINEE: "/api/assignments/trainee",
    UPDATE: (id) => `/api/assignments/${id}`,
    ACKNOWLEDGE: (id) => `/api/assignments/${id}/acknowledge`,
    COMPLETE: (id) => `/api/assignments/${id}/complete`,
    AVAILABLE_TRAINERS: "/api/assignments/trainers/available",
    UNASSIGNED_TRAINEES: "/api/assignments/trainees/unassigned",
  },

  OBSERVATIONS: {
    CREATE: "/api/observations",
    GET_ALL: "/api/observations",
    GET_MASTER_TRAINER: "/api/observations/master-trainer/list",
    GET_TRAINEE: "/api/observations/trainee/list",
    GET_BY_ID: (id) => `/api/observations/${id}`,
    UPDATE: (id) => `/api/observations/${id}`,
    SUBMIT: (id) => `/api/observations/${id}/submit`,
    REVIEW: (id) => `/api/observations/${id}/review`,
    STATS: "/api/observations/stats",
  },

  NOTIFICATIONS: {
    GET_ALL: "/api/notifications",
    UNREAD_COUNT: "/api/notifications/unread-count",
    MARK_AS_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: "/api/notifications/mark-all-read",
    DELETE: (id) => `/api/notifications/${id}`,
    CREATE: "/api/notifications/create",
    BULK: "/api/notifications/bulk",
    STATS: "/api/notifications/stats",
  },

  REPORTS: {
    ATTENDANCE: "/api/reports/attendance",
    DAY_PLAN_COMPLIANCE: "/api/reports/day-plan-compliance",
    OBSERVATIONS: "/api/reports/observations",
    ASSIGNMENTS: "/api/reports/assignments",
    AUDIT: "/api/reports/audit",
  },

  // Legacy task management (keeping for backward compatibility)
  TASKS: {
    GET_DASHBOARD_DATA: "/api/tasks/dashboard-data",
    GET_USER_DASHBOARD_DATA: "/api/tasks/user-dashboard-data",
    GET_ALL_TASKS: "/api/tasks",
    GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`,
    CREATE_TASK: "/api/tasks",
    UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`,
    DELETE_TASK: (taskId) => `/api/tasks/${taskId}`,
    UPDATE_TASK_STATUS: (taskId) => `/api/tasks/${taskId}/status`,
    UPDATE_TODO_CHECKLIST: (taskId) => `/api/tasks/${taskId}/todo`,
  },

  IMAGE: {
    UPLOAD_IMAGE: "api/auth/upload-image",
  },

  JOINERS: {
    CREATE: "/api/joiners",
    GET_ALL: "/api/joiners",
    GET_BY_ID: (id) => `/api/joiners/${id}`,
    UPDATE: (id) => `/api/joiners/${id}`,
    DELETE: (id) => `/api/joiners/${id}`,
    CREATE_ACCOUNT: (id) => `/api/joiners/${id}/create-account`,
    STATS: "/api/joiners/stats",
    VALIDATE_SHEETS: "/api/joiners/validate-sheets",
    BULK_UPLOAD: "/api/joiners/bulk-upload",
  },

  RESULTS: {
    CREATE: "/api/results",
    GET_ALL: "/api/results",
    GET_BY_ID: (id) => `/api/results/${id}`,
    UPDATE: (id) => `/api/results/${id}`,
    DELETE: (id) => `/api/results/${id}`,
    BULK_UPLOAD: "/api/results/bulk-upload",
    VALIDATE_SHEETS: "/api/results/validate-sheets",
    GET_BY_EXAM_TYPE: (examType) => `/api/results/exam-type/${examType}`,
    GET_BY_AUTHOR_ID: (authorId) => `/api/results/author/${authorId}`,
    STATISTICS: "/api/results/statistics",
  },

  TRAINEE_DAY_PLANS: {
    CREATE: "/api/trainee-dayplans",
    GET_ALL: "/api/trainee-dayplans",
    GET_BY_ID: (id) => `/api/trainee-dayplans/${id}`,
    UPDATE: (id) => `/api/trainee-dayplans/${id}`,
    SUBMIT: (id) => `/api/trainee-dayplans/${id}/submit`,
    REVIEW: (id) => `/api/trainee-dayplans/${id}/review`,
    EOD_REVIEW: (id) => `/api/trainee-dayplans/${id}/eod-review`,
    DELETE: (id) => `/api/trainee-dayplans/${id}`,
  },

  DEMO: {
    UPLOAD: "/api/demos/upload",
    GET_ALL: "/api/demos",
    GET_BY_ID: (id) => `/api/demos/${id}`,
    UPDATE: (id) => `/api/demos/${id}`,
    DELETE: (id) => `/api/demos/${id}`,
    DOWNLOAD: (id) => `/api/demos/${id}/download`,
    RATE: (id) => `/api/demos/${id}/rate`,
    FEEDBACK: (id) => `/api/demos/${id}/feedback`,
    AVAILABLE_SLOTS: "/api/demos/slots/available",
    REQUEST_SLOT: "/api/demos/slots/request",
    CANCEL_REQUEST: (id) => `/api/demos/slots/request/${id}/cancel`,
    OFFLINE_REQUESTS: "/api/demos/slots/requests",
    REVIEW_SLOT: (id) => `/api/demos/slots/request/${id}/review`,
  },

  TRAINEE: {
    CAMPUS_ALLOCATION: "/api/trainee/campus-allocation",
    MCQ_DEPLOYMENTS: "/api/mcq-deployments/trainee",
    START_MCQ: (deploymentId) => `/api/mcq-deployments/trainee/${deploymentId}/start`,
    SUBMIT_MCQ: (deploymentId) => `/api/mcq-deployments/trainee/${deploymentId}/submit`,
    MCQ_RESULTS: "/api/mcq-deployments/trainee/results",
  },
  CAMPUS: {
    CREATE: "/api/campus",
    GET_ALL: "/api/campus",
    GET_BY_ID: (id) => `/api/campus/${id}`,
    UPDATE: (id) => `/api/campus/${id}`,
    DELETE: (id) => `/api/campus/${id}`,
  },
  ALLOCATION: {
    CREATE: "/api/allocation",
    GET_ALL: "/api/allocation",
    GET_BY_ID: (id) => `/api/allocation/${id}`,
    UPDATE: (id) => `/api/allocation/${id}`,
    DELETE: (id) => `/api/allocation/${id}`,
  },

  ADMIN: {
    CREATE: "/api/admin/create",
    USERS: "/api/admin/users",
    PROMOTE_USER: "/api/admin/users/promote",
    DEACTIVATE_USER: "/api/admin/users/deactivate",
    REACTIVATE_USER: "/api/admin/users/reactivate",
    USER_ROLE_HISTORY: (userId) => `/api/admin/users/${userId}/role-history`,
    STATS: "/api/admin/stats",
    MCQ_DEPLOYMENTS: "/api/mcq-deployments/admin",
  },

  MASTER_TRAINER: {
    MCQ_DEPLOYMENTS: "/api/mcq-deployments/master-trainer",
  },

  TRAINER: {
    ASSIGNED_TRAINEES: "/api/trainer/assigned-trainees",
    TRAINEE_RESULTS: "/api/trainer/trainee-results",
  },

  BOA: {
    MCQ_RESULTS: "/api/mcq-deployments/boa",
    UPLOAD_RESULTS: "/api/mcq-deployments/boa/upload-results",
  },

  // Notifications API paths
  NOTIFICATIONS: {
    GET_NOTIFICATIONS: "/api/notifications",
    GET_UNREAD_COUNT: "/api/notifications/unread-count",
    MARK_AS_READ: (notificationId) => `/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: "/api/notifications/mark-all-read",
    DELETE: (notificationId) => `/api/notifications/${notificationId}`,
  },
};
