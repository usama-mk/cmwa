import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  FileText,
  Upload,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  Check,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status:
    | "planning"
    | "in_progress"
    | "review"
    | "waiting_feedback"
    | "completed";
  completion_percentage: number;
  notes: string | null;
  drive_link: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export function ClientDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLink, setUpdatingLink] = useState<string | null>(null);
  const [editingLinks, setEditingLinks] = useState<{ [key: string]: string }>(
    {}
  );
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch projects when we have a profile
    if (profile?.id) {
      fetchProjects();
      fetchUpdates();
    }
  }, [profile?.id]);

  const fetchProjects = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdates = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from("project_updates")
        .select(
          `
          *,
          projects!inner(client_id)
        `
        )
        .eq("projects.client_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching updates:", error);
    }
  };

  const updateDriveLink = async (projectId: string, driveLink: string) => {
    setUpdatingLink(projectId);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ drive_link: driveLink })
        .eq("id", projectId);

      if (error) throw error;

      // Update local state immediately
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, drive_link: driveLink } : p
        )
      );

      // Clear the editing state
      setEditingLinks((prev) => {
        const newState = { ...prev };
        delete newState[projectId];
        return newState;
      });

      // Show success message
      setUpdateSuccess(projectId);
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating drive link:", error);
      alert("Failed to update drive link. Please try again.");
    } finally {
      setUpdatingLink(null);
    }
  };

  const handleLinkEdit = (projectId: string, currentLink: string) => {
    setEditingLinks((prev) => ({
      ...prev,
      [projectId]: currentLink || "",
    }));
  };

  const handleLinkUpdate = (projectId: string) => {
    const newLink = editingLinks[projectId];
    if (newLink !== undefined) {
      updateDriveLink(projectId, newLink.trim());
    }
  };

  const cancelLinkEdit = (projectId: string) => {
    setEditingLinks((prev) => {
      const newState = { ...prev };
      delete newState[projectId];
      return newState;
    });
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "review":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "waiting_feedback":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "review":
        return <AlertCircle className="h-4 w-4" />;
      case "waiting_feedback":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: Project["status"]) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  // Show loading if auth is loading OR if we have user but no profile yet OR if data is loading
  if (authLoading || (user && !profile) || (profile && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Loading your projects...
          </p>
        </div>
      </div>
    );
  }

  // If no user or profile, the ProtectedRoute will handle redirect
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {profile.full_name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {profile.company_name && `${profile.company_name} • `}
            {projects.length} active project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {project.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Last updated {formatDate(project.updated_at)}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center space-x-1 ${getStatusColor(
                      project.status
                    )} self-start`}
                  >
                    {getStatusIcon(project.status)}
                    <span>{formatStatus(project.status)}</span>
                  </div>
                </div>

                {project.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base">
                    {project.description}
                  </p>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Project Progress
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.completion_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${project.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {project.notes && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {project.notes}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Google Drive Link
                      </span>
                    </div>
                    {updateSuccess === project.id && (
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Updated!</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="url"
                      placeholder="Enter your Google Drive link"
                      value={
                        editingLinks[project.id] !== undefined
                          ? editingLinks[project.id]
                          : project.drive_link || ""
                      }
                      onChange={(e) =>
                        setEditingLinks((prev) => ({
                          ...prev,
                          [project.id]: e.target.value,
                        }))
                      }
                      onFocus={() =>
                        handleLinkEdit(project.id, project.drive_link || "")
                      }
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 text-sm"
                    />
                    {editingLinks[project.id] !== undefined && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => cancelLinkEdit(project.id)}
                          className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleLinkUpdate(project.id)}
                          disabled={updatingLink === project.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
                        >
                          {updatingLink === project.id ? (
                            <Upload className="h-4 w-4 animate-pulse" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>
                            {updatingLink === project.id
                              ? "Updating..."
                              : "Update"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors duration-200">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your projects will appear here once they're created.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Recent Updates
              </h3>
              <div className="space-y-4">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className="border-l-2 border-blue-500 pl-4"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                      {update.title}
                    </h4>
                    {update.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {update.description}
                      </p>
                    )}
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                      {formatDate(update.created_at)}
                    </p>
                  </div>
                ))}
                {updates.length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No recent updates
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
