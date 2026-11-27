import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { BookOpen, User, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.register(username, email, password);
      toast.success('Registration successful! Please Login.');
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Failed to register. Please try again.');
      toast.error(error.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-emerald-50 px-4 py-8 overflow-hidden">
      
      <div className="absolute inset-0 bg-[radial-gradient(#a5f3fc_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl border border-cyan-100 rounded-3xl shadow-xl shadow-cyan-900/10 p-7 sm:p-10">
          
          {/* Header */}
          <div className="text-center mb-9">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/25 mb-6">
              <BookOpen className="text-white w-8 h-8" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">
              Create an Account
            </h1>
            <p className="text-slate-900 text-base">
              Join us and start your journey <br/> to smarter learning
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Username
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${
                  focusedField === 'username' ? 'text-cyan-600' : 'text-slate-400'
                }`}>
                  <User className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/70 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 
                  focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="Enter your Username"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Email
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${
                  focusedField === 'email' ? 'text-cyan-600' : 'text-slate-400'
                }`}>
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/70 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 
                  focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="Enter your Email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Password
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${
                  focusedField === 'password' ? 'text-cyan-600' : 'text-slate-400'
                }`}>
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/70 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 
                  focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="Password (min. 6 characters)"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-600 font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-cyan-500/25 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing up...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2.5} />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200/70">
            <p className="text-center text-sm text-slate-900">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-cyan-700 hover:text-emerald-600 transition-colors duration-200">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Subtle footer text */}
        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;