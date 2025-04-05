import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Palette, Upload, Sparkles, Grid } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Palette className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Motifs.AI</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Grid className="h-5 w-5" />
              <span>Patterns</span>
            </Link>
            
            <Link
              to="/uploads"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span>My Uploads</span>
            </Link>
            
            <Link
              to="/generate"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              <span>Generate</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all shadow-lg backdrop-blur-sm"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;