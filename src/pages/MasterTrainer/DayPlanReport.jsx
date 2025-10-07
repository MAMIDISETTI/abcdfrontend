import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const DayPlanReport = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(API_PATHS.TRAINEE_DAY_PLANS.GET_BY_ID(id));
        setPlan(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load day plan");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading...</div>
      </DashboardLayout>
    );
  }

  if (error || !plan) {
    return (
      <DashboardLayout>
        <div className="p-6 text-red-600">{error || "Day plan not found"}</div>
      </DashboardLayout>
    );
  }

  const submittedAt = plan?.submittedAt ? moment(plan.submittedAt).format("l, LTS") : "N/A";
  const completedAt = plan?.completedAt ? moment(plan.completedAt).format("l, LTS") : "N/A";
  const planDate = plan?.date ? moment(plan.date).format("YYYY-MM-DD") : "N/A";

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Day Plan Report</h1>
            <p className="text-sm text-gray-600">
              {plan?.trainee?.name || "Trainee"} - {planDate}
            </p>
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              plan.status === "completed"
                ? "bg-green-100 text-green-700"
                : plan.status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>{plan.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Trainee Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Name:</span><span>{plan?.trainee?.name || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">ID:</span><span>{plan?.trainee?._id || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="capitalize">{plan?.status}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Submitted:</span><span>{submittedAt}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Completed:</span><span>{completedAt}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Date:</span><span>{planDate}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks ({plan?.tasks?.length || 0})</h3>
          <div className="divide-y">
            {(plan?.tasks || []).map((task, idx) => (
              <div key={idx} className="py-3 flex items-start justify-between">
                <div>
                  <p className="font-medium">{task.title || task.name || `Task ${idx + 1}`}</p>
                  {task?.time && (
                    <p className="text-xs text-gray-500">{task.time}</p>
                  )}
                  {Array.isArray(task?.checkboxes) && task.checkboxes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-700 mb-1">Additional Activities</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {task.checkboxes.map((cb, cidx) => (
                          <li key={cidx} className="flex items-center justify-between">
                            <span>{cb.label || cb.text || `Checkbox ${cidx + 1}`}</span>
                            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                              cb.completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}>{cb.completed ? "Completed" : "Not Completed"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "in_progress"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>{task.status || "pending"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">EOD Review</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="capitalize">{plan?.eodUpdate?.status || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Reviewed By:</span><span>{plan?.eodUpdate?.reviewedBy || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Reviewed At:</span><span>{plan?.eodUpdate?.reviewedAt ? moment(plan.eodUpdate.reviewedAt).format("l, LTS") : "N/A"}</span></div>
            {plan?.eodUpdate?.reviewComments && (
              <div className="pt-2">
                <p className="text-gray-600 mb-1">Comments:</p>
                <p className="text-gray-800 whitespace-pre-wrap">{plan.eodUpdate.reviewComments}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DayPlanReport;


