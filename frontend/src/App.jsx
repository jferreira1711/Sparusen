import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import MaterialDetalle from "./pages/MaterialDetalle";
import MiProgreso from "./pages/MiProgreso";
import Quiz from "./pages/Quiz"
import Classes from "./pages/Classes"
import Classroom from "./pages/Classroom"
import TeacherQuizEditor from "./pages/TeacherQuizEditor"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas privadas */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/catalogo" element={<PrivateRoute><Catalogo /></PrivateRoute>} />
          <Route path="/material/:id" element={<PrivateRoute><MaterialDetalle /></PrivateRoute>} />
          <Route path="/progreso" element={<PrivateRoute><MiProgreso /></PrivateRoute>} />

          {/* Rutas privadas — Fase 3 */}
          <Route path="/quiz/:id" element={
            <PrivateRoute><Quiz /></PrivateRoute>
          } />
          <Route path="/clases" element={
             <PrivateRoute><Classes /></PrivateRoute>
          } />
          <Route path="/classroom/:id" element={
            <PrivateRoute><Classroom /></PrivateRoute>
          } />
          <Route path="/quiz-editor/:materialId" element={
            <PrivateRoute><TeacherQuizEditor /></PrivateRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}