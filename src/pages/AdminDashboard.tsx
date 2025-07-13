import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  sendProjectUpdateEmail,
  formatStatusForEmail,
} from "../lib/emailService";
import { EmailSetupBanner } from "../components/EmailSetupBanner";
import {
  Plus,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Edit3,
  Trash2,
  Save,
  X,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  role: "client" | "admin";
  full_name: string | null;
  company_name: string | null;
  created_at: string;
}

interface Project {
  id: string;
  client_id: string;
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

interface ClientWithProjects extends Profile {
  projects: Project[];
}

export function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProject, setNewProject] = useState({
    clientId: "",
    name: "",
    description: "",
    status: "planning" as
      | "planning"
      | "in_progress"
      | "review"
      | "waiting_feedback"
      | "completed",
    completion_percentage: 0,
    notes: "",
  });

  useEffect(() => {
    // Only fetch data when we have a profile
    if (profile?.id) {
      console.log("Profile found, fetching fresh data...");
      fetchClientsAndProjects();
    }
  }, [profile]);

  // Add a refresh mechanism to clear any cached state
  const refreshData = () => {
    console.log("Refreshing data...");
    setLoading(true);
    fetchClientsAndProjects();
  };

  const fetchClientsAndProjects = async () => {
    try {
      console.log("Fetching fresh data from database...");

      // Cache-busting timestamp for debugging
      console.log("Fetch timestamp:", Date.now());

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      console.log("Profiles fetched:", profilesData?.length || 0);

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        throw projectsError;
      }

      console.log("Projects fetched:", projectsData?.length || 0);

      const clientsWithProjects = profilesData.map((client) => ({
        ...client,
        projects: projectsData.filter(
          (project) => project.client_id === client.id
        ),
      }));

      console.log("Setting clients data:", clientsWithProjects.length);
      setClients(clientsWithProjects);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      console.log("Data fetch completed");
    }
  };

  const addProject = async () => {
    // Prevent double submission
    if (isSubmitting) {
      console.log("Already submitting, ignoring request");
      return;
    }

    console.log("Starting project creation");

    // Basic validation
    if (!newProject.name.trim()) {
      alert("Please enter a project name");
      return;
    }

    if (!newProject.clientId) {
      alert("Please select a client");
      return;
    }

    if (
      newProject.completion_percentage < 0 ||
      newProject.completion_percentage > 100
    ) {
      alert("Completion percentage must be between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    console.log("Set isSubmitting to true");

    try {
      console.log("Creating project in database...");
      const { data, error } = await supabase
        .from("projects")
        .insert({
          client_id: newProject.clientId,
          name: newProject.name.trim(),
          description: newProject.description.trim() || null,
          status: newProject.status,
          completion_percentage: newProject.completion_percentage,
          notes: newProject.notes.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Database insert error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned from project creation");
      }

      console.log("Project created successfully:", data);

      // Update local state
      setClients((prev) =>
        prev.map((client) =>
          client.id === newProject.clientId
            ? { ...client, projects: [...client.projects, data] }
            : client
        )
      );

      console.log("Local state updated");

      // Reset form and close modal
      setNewProject({
        clientId: "",
        name: "",
        description: "",
        status: "planning",
        completion_percentage: 0,
        notes: "",
      });
      setShowAddProject(false);

      alert("Project added successfully!");
      console.log("Add project completed successfully");
    } catch (error) {
      console.error("Error in addProject:", error);
      alert(
        `Failed to add project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      console.log("Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const updateProject = async (project: Project) => {
    // Prevent double submission
    if (isSubmitting) {
      console.log("Already submitting, ignoring request");
      return;
    }

    console.log("Starting project update for:", project.id);

    // Basic validation
    if (!project.name.trim()) {
      alert("Please enter a project name");
      return;
    }

    if (
      project.completion_percentage < 0 ||
      project.completion_percentage > 100
    ) {
      alert("Completion percentage must be between 0 and 100");
      return;
    }

    // Get the original project data to compare changes
    const originalProject = clients
      .flatMap((client) => client.projects)
      .find((p) => p.id === project.id);

    if (!originalProject) {
      console.error("Original project not found");
      alert("Error: Original project not found");
      return;
    }

    // Get client information for email
    const client = clients.find((c) => c.id === project.client_id);
    if (!client) {
      console.error("Client not found for project");
      alert("Error: Client not found for project");
      return;
    }

    // Set submitting state
    setIsSubmitting(true);
    console.log("Set isSubmitting to true");

    try {
      // Simple database update without select
      console.log("Updating project in database...");
      const { error } = await supabase
        .from("projects")
        .update({
          name: project.name.trim(),
          description: project.description?.trim() || null,
          status: project.status,
          completion_percentage: project.completion_percentage,
          notes: project.notes?.trim() || null,
          drive_link: project.drive_link,
        })
        .eq("id", project.id);

      if (error) {
        console.error("Database update error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("Database update successful");

      // Update local state
      setClients((prev) =>
        prev.map((client) => ({
          ...client,
          projects: client.projects.map((p) =>
            p.id === project.id ? project : p
          ),
        }))
      );

      console.log("Local state updated");

      // Close modal and show success
      setEditingProject(null);
      alert("Project updated successfully!");

      console.log("Update completed successfully");

      // Send email notifications for significant changes (non-blocking)
      setTimeout(async () => {
        try {
          console.log("Sending email notifications...");
          let emailSent = false;

          // Check for status change
          if (originalProject.status !== project.status) {
            console.log("Status changed, sending email...");
            await sendProjectUpdateEmail({
              clientEmail: client.email,
              clientName:
                client.full_name || client.company_name || "Valued Client",
              projectName: project.name,
              updateType: "status",
              oldValue: formatStatusForEmail(originalProject.status),
              newValue: formatStatusForEmail(project.status),
              message: project.notes || undefined,
            });
            emailSent = true;
            console.log("Status change email sent");
          }

          // Check for significant progress change (10% or more)
          const progressDiff = Math.abs(
            project.completion_percentage -
              originalProject.completion_percentage
          );
          if (!emailSent && progressDiff >= 10) {
            console.log("Progress changed significantly, sending email...");
            await sendProjectUpdateEmail({
              clientEmail: client.email,
              clientName:
                client.full_name || client.company_name || "Valued Client",
              projectName: project.name,
              updateType: "progress",
              oldValue: originalProject.completion_percentage.toString(),
              newValue: project.completion_percentage.toString(),
              message: project.notes || undefined,
            });
            emailSent = true;
            console.log("Progress change email sent");
          }

          // If notes were added/changed significantly and no other email was sent
          if (
            !emailSent &&
            project.notes &&
            project.notes !== originalProject.notes &&
            project.notes.length > 20
          ) {
            console.log("Notes changed significantly, sending email...");
            await sendProjectUpdateEmail({
              clientEmail: client.email,
              clientName:
                client.full_name || client.company_name || "Valued Client",
              projectName: project.name,
              updateType: "general",
              message: project.notes,
            });
            console.log("Notes change email sent");
          }

          if (emailSent) {
            console.log("Email notification sent successfully");
          } else {
            console.log("No email notification needed");
          }
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Don't fail the update if email fails
        }
      }, 100);
    } catch (error) {
      console.error("Error in updateProject:", error);
      alert(
        `Failed to update project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      console.log("Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setClients((prev) =>
        prev.map((client) => ({
          ...client,
          projects: client.projects.filter((p) => p.id !== projectId),
        }))
      );
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "waiting_feedback":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatStatus = (status: Project["status"]) => {
    switch (status) {
      case "waiting_feedback":
        return "Waiting for Feedback";
      case "in_progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const stats = {
    totalClients: clients.length,
    activeProjects: clients.reduce(
      (acc, client) =>
        acc + client.projects.filter((p) => p.status === "in_progress").length,
      0
    ),
    pendingFeedback: clients.reduce(
      (acc, client) =>
        acc +
        client.projects.filter((p) => p.status === "waiting_feedback").length,
      0
    ),
    completed: clients.reduce(
      (acc, client) =>
        acc + client.projects.filter((p) => p.status === "completed").length,
      0
    ),
  };

  const filteredClients =
    selectedClient === "all"
      ? clients
      : clients.filter((client) => client.id === selectedClient);

  // Show loading if auth is loading OR if we have user but no profile yet OR if data is loading
  if (authLoading || (user && !profile) || (profile && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Loading dashboard...
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={refreshData}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 shadow-sm w-full sm:w-auto"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddProject(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-sm w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Email Setup Banner */}
        <EmailSetupBanner />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalClients}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Total Clients
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeProjects}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Active Projects
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingFeedback}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Pending Feedback
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completed}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Management Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Management
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Filter by Client:
                </span>
                <div className="relative">
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                  >
                    <option value="all">All Clients</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name || client.full_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Clients & Projects
              </h3>

              {/* Mobile View */}
              <div className="block lg:hidden space-y-4">
                {filteredClients.map((client) => (
                  <div key={client.id} className="space-y-3">
                    {client.projects.length > 0 ? (
                      client.projects.map((project, index) => (
                        <div
                          key={project.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200"
                        >
                          {/* Client Info - Show only for first project */}
                          {index === 0 && (
                            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                                {(client.company_name || client.full_name || "")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {client.company_name || client.full_name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {client.email}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Project Info */}
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {project.name}
                              </p>
                              {project.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {project.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  project.status
                                )}`}
                              >
                                {formatStatus(project.status)}
                              </span>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {project.completion_percentage}%
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${project.completion_percentage}%`,
                                }}
                              ></div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                {project.drive_link ? (
                                  <a
                                    href={project.drive_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Drive Link
                                  </a>
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                                    No drive link
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setEditingProject(project)}
                                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                  title="Edit Project"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteProject(project.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Delete Project"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                            {(client.company_name || client.full_name || "")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {client.company_name || client.full_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {client.email}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No projects yet
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-4">
                  <div className="col-span-2">CLIENT</div>
                  <div className="col-span-3">PROJECT</div>
                  <div className="col-span-2">STATUS</div>
                  <div className="col-span-2">PROGRESS</div>
                  <div className="col-span-2">DRIVE LINK</div>
                  <div className="col-span-1">ACTIONS</div>
                </div>

                {/* Table Content */}
                <div className="space-y-3">
                  {filteredClients.map((client) => (
                    <div key={client.id}>
                      {client.projects.length > 0 ? (
                        client.projects.map((project, index) => (
                          <div
                            key={project.id}
                            className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200"
                          >
                            {/* Client Info */}
                            <div className="col-span-2">
                              {index === 0 && (
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                                    {(
                                      client.company_name ||
                                      client.full_name ||
                                      ""
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                      {client.company_name || client.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {client.email}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Project Info */}
                            <div className="col-span-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {project.name}
                                </p>
                                {project.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  project.status
                                )}`}
                              >
                                {formatStatus(project.status)}
                              </span>
                            </div>

                            {/* Progress */}
                            <div className="col-span-2">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${project.completion_percentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[35px]">
                                  {project.completion_percentage}%
                                </span>
                              </div>
                            </div>

                            {/* Drive Link - Read Only for Admin */}
                            <div className="col-span-2">
                              {project.drive_link ? (
                                <a
                                  href={project.drive_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                  Waiting for client
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="col-span-1">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setEditingProject(project)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                  title="Edit Project"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteProject(project.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Delete Project"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                          <div className="col-span-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                                {(client.company_name || client.full_name || "")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {client.company_name || client.full_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {client.email}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-10">
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              No projects yet
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredClients.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No clients found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Clients will appear here once they sign up
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Project
              </h3>
              <button
                onClick={() => setShowAddProject(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client
                </label>
                <div className="relative">
                  <select
                    value={newProject.clientId}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        clientId: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 appearance-none"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name || client.full_name} (
                        {client.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Project description..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Initial Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        status: e.target.value as
                          | "planning"
                          | "in_progress"
                          | "review"
                          | "waiting_feedback"
                          | "completed",
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="waiting_feedback">Waiting Feedback</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newProject.completion_percentage}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        completion_percentage: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Notes (Optional)
                </label>
                <textarea
                  value={newProject.notes}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Any initial notes or requirements..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setShowAddProject(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={addProject}
                disabled={
                  !newProject.name || !newProject.clientId || isSubmitting
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Edit3 className="h-5 w-5 mr-2" />
                Edit Project
              </h3>
              <button
                onClick={() => setEditingProject(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) =>
                    setEditingProject((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editingProject.description || ""}
                  onChange={(e) =>
                    setEditingProject((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter project description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editingProject.status}
                    onChange={(e) =>
                      setEditingProject((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: e.target.value as
                                | "planning"
                                | "in_progress"
                                | "review"
                                | "waiting_feedback"
                                | "completed",
                            }
                          : null
                      )
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="waiting_feedback">Waiting Feedback</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingProject.completion_percentage}
                    onChange={(e) =>
                      setEditingProject((prev) =>
                        prev
                          ? {
                              ...prev,
                              completion_percentage:
                                parseInt(e.target.value) || 0,
                            }
                          : null
                      )
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={editingProject.notes || ""}
                  onChange={(e) =>
                    setEditingProject((prev) =>
                      prev ? { ...prev, notes: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter project notes"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={() => updateProject(editingProject)}
                disabled={!editingProject.name || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
