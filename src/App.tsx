import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/organisms/Navbar';
import { LandingPage } from './pages/LandingPage';
import { JournalPage } from './pages/JournalPage';
import { DailyLightPracticePage } from './pages/DailyLightPracticePage';
import { TheForge } from './pages/TheForgePage';
import { Contatti } from './pages/Contatti';
import { GamingPage } from './pages/GamingPage';
import { SynchronicitiesPage } from './pages/SynchronicitiesPage';
import { CollectivePage } from './pages/CollectivePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/journal" element={
            <ProtectedRoute>
              <JournalPage />
            </ProtectedRoute>
          } />
          <Route path="/daily-light" element={
            <ProtectedRoute>
              <DailyLightPracticePage />
            </ProtectedRoute>
          } />
          <Route path="/forge" element={
            <ProtectedRoute>
              <TheForge />
            </ProtectedRoute>
          } />
          <Route path="/synchronicities" element={
            <ProtectedRoute>
              <SynchronicitiesPage />
            </ProtectedRoute>
          } />
          <Route path="/collective" element={
            <ProtectedRoute>
              <CollectivePage />
            </ProtectedRoute>
          } />
          <Route path="/contatti" element={<Contatti />} />
          <Route path="/gaming" element={
            <ProtectedRoute>
              <GamingPage />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
