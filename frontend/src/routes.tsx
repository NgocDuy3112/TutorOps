import { Navigate, createBrowserRouter } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailPage from './pages/StudentDetailPage'
import TutorsPage from './pages/TutorsPage'
import TutorDetailPage from './pages/TutorDetailPage'
import NotFoundPage from './pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/students', element: <StudentsPage /> },
  { path: '/students/:id', element: <StudentDetailPage /> },
  { path: '/tutors', element: <TutorsPage /> },
  { path: '/tutors/:id', element: <TutorDetailPage /> },
  { path: '*', element: <NotFoundPage /> },
])
