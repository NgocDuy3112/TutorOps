import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import "./styles.css";
import { LoginPage } from "./auth/LoginPage";
import { LessonsPage } from "./lessons/LessonsPage";
import { SignupPage } from "./auth/SignupPage";
import { DashboardPage } from "./dashboard/DashboardPage";
import { AssignmentsPage } from "./assignments/AssignmentsPage";
import { StudentProfilePage } from "./students/StudentProfilePage";
import { StudentsPage } from "./students/StudentsPage";
import { StudentSubmissionPage } from "./public/StudentSubmissionPage";
import { ParentReportPage } from "./public/ParentReportPage";
import { SettingsPage } from "./settings/SettingsPage";
import { PersonalInfoPage } from "./settings/PersonalInfoPage";
import { ChangePasswordPage } from "./settings/ChangePasswordPage";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const isPublicSubmission = window.location.pathname.startsWith("/submit/");
  const isPublicParent = window.location.pathname.startsWith("/parent/");

  useEffect(() => {
    if (isPublicSubmission || isPublicParent) return;
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((response) => setAuthenticated(response.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  if (isPublicSubmission || isPublicParent) {
    return (
      <Routes>
        <Route path="/submit/:token" element={<StudentSubmissionPage />} />
        <Route path="/parent/:token" element={<ParentReportPage />} />
      </Routes>
    );
  }

  if (authenticated === null) {
    return <div className="p-6 text-sm text-slate-500">Đang tải...</div>;
  }

  return (
    <>
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
          path="/lessons"
          element={
            authenticated ? <LessonsPage /> : <Navigate to="/login" replace />
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

function StudentProfileRoute() {
  const { studentId = "" } = useParams();
  return <StudentProfilePage studentId={studentId} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
