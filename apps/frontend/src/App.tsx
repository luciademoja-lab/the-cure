import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/organisms/Navbar';
import { OrbitNav } from './components/organisms/OrbitNav';
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
import { PlansPage } from './pages/PlansPage';
import { ProfilePage } from './pages/ProfilePage';
import { FaqPage } from './pages/FaqPage';
import { PrivacyPage } from './pages/legal/PrivacyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { CookiePage } from './pages/legal/CookiePage';
import { DisclaimerPage } from './pages/legal/DisclaimerPage';
import { Footer } from './components/organisms/Footer';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <OrbitNav />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
          <Route path="/reset-password" element={<Navigate to="/login" replace />} />
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
          <Route path="/plans" element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/termini" element={<TermsPage />} />
          <Route path="/cookie" element={<CookiePage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/contatti" element={<Contatti />} />
          <Route path="/gaming" element={
            <ProtectedRoute>
              <GamingPage />
            </ProtectedRoute>
          } />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
