import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Patterns from './pages/Patterns';
import PrivateUploads from './pages/PrivateUploads';
import Generate from './pages/Generate';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  const { checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, []);

  return (
    <Router {...routerConfig}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white,theme(colors.pink.50))]" />
        <Navbar />
        <main className="relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] -z-10" />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Patterns />
                </ProtectedRoute>
              } />
              <Route path="/uploads" element={
                <ProtectedRoute>
                  <PrivateUploads />
                </ProtectedRoute>
              } />
              <Route path="/generate" element={
                <ProtectedRoute>
                  <Generate />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App