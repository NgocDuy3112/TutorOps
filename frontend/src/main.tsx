import { API } from "./lib/api";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./styles.css";
import { LoginPage } from "./auth/LoginPage";
import { SignupPage } from "./auth/SignupPage";
import { DashboardPage } from "./dashboard/DashboardPage";
import { AssignmentsPage } from "./assignments/AssignmentsPage";
import { AssignmentFormPage } from "./assignments/AssignmentFormPage";
import { AssignmentSubmissionsPage } from "./assignments/AssignmentSubmissionsPage";
import { StudentProfilePage } from "./students/StudentProfilePage";
import { StudentsPage } from "./students/StudentsPage";
import { StudentFormPage } from "./students/StudentFormPage";
import { ClassesPage } from "./classes/ClassesPage";
import { ClassFormPage } from "./classes/ClassFormPage";
import { ClassDetailPage } from "./classes/ClassDetailPage";
import { TuitionPage } from "./tuition/TuitionPage";
import { StudentSubmissionPage } from "./public/StudentSubmissionPage";
import { ParentReportPage } from "./public/ParentReportPage";
import { AssignmentDropboxPage } from "./public/AssignmentDropboxPage";
import { SettingsPage } from "./settings/SettingsPage";
import { PersonalInfoPage } from "./settings/PersonalInfoPage";
import { ChangePasswordPage } from "./settings/ChangePasswordPage";
import { VersionBanner } from "./components/VersionBanner";
import { OnboardingDialog } from "./onboarding/OnboardingDialog";
import { IosInstallBanner } from "./notifications/IosInstallBanner";

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const isPublicSubmission = window.location.pathname.startsWith("/submit/");
  const isPublicParent = window.location.pathname.startsWith("/parent/");
  const isAssignmentDropbox = window.location.pathname.startsWith(
    "/assignment-submit/",
  );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "navigate" && typeof event.data.url === "string") {
        navigate(event.data.url);
      }
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  useEffect(() => {
    if (isPublicSubmission || isPublicParent || isAssignmentDropbox) return;
    fetch(`${API}/auth/me`)
      .then((response) => setAuthenticated(response.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  if (isPublicSubmission || isPublicParent || isAssignmentDropbox) {
    return (
      <Routes>
        <Route path="/submit/:token" element={<StudentSubmissionPage />} />
        <Route path="/parent/:token" element={<ParentReportPage />} />
        <Route
          path="/assignment-submit/:token"
          element={<AssignmentDropboxRoute />}
        />
      </Routes>
    );
  }

  if (authenticated === null) {
    return <div className="p-6 text-sm text-slate-500">Đang tải...</div>;
  }

  return (
    <>
      {authenticated ? <OnboardingDialog /> : null}
      {authenticated ? <IosInstallBanner /> : null}
      <Routes>
        <Route
          path="/login"
          element={
            authenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLoggedIn={() => setAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            authenticated ? (
              <Navigate to="/" replace />
            ) : (
              <SignupPage onSignedUp={() => setAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/"
          element={
            authenticated ? <DashboardPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/students"
          element={
            authenticated ? <StudentsPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/classes"
          element={
            authenticated ? <ClassesPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/classes/new"
          element={
            authenticated ? <ClassFormPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/classes/:classId"
          element={
            authenticated ? (
              <ClassDetailPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assignments"
          element={
            authenticated ? (
              <AssignmentsPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assignments/new"
          element={
            authenticated ? (
              <AssignmentFormPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assignments/:assignmentId/submissions"
          element={
            authenticated ? (
              <AssignmentSubmissionsPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tuition"
          element={
            authenticated ? <TuitionPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/settings"
          element={
            authenticated ? <SettingsPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/settings/profile"
          element={
            authenticated ? (
              <PersonalInfoPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings/password"
          element={
            authenticated ? (
              <ChangePasswordPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/students/new"
          element={
            authenticated ? (
              <StudentFormPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/students/:studentId"
          element={
            authenticated ? (
              <StudentProfileRoute />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate to={authenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </>
  );
}

function AssignmentDropboxRoute() {
  const { token = "" } = useParams();
  return <AssignmentDropboxPage token={token} />;
}

function StudentProfileRoute() {
  const { studentId = "" } = useParams();
  return <StudentProfilePage studentId={studentId} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <VersionBanner />
      <App />
    </BrowserRouter>
  </StrictMode>,
);
