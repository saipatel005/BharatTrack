import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Bus, Loader2, Play, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export const Login = () => {
  const [loginRole, setLoginRole] = useState('admin'); // 'admin', 'driver', 'student'
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { currentUser, userData, enableDemoMode, loginAsDriver, loginAsStudent } = useAuth();

  useEffect(() => {
    if (currentUser && userData) {
      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'driver') navigate('/driver');
      else if (userData.role === 'student') navigate('/student');
    }
  }, [currentUser, userData, navigate]);

  const handleDemoLogin = (role) => {
    enableDemoMode(role);
    navigate(`/${role}`);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (loginRole !== 'admin') {
      setError('Please contact the school administrator to reset your password.');
      return;
    }
    
    if (!identifier) {
      setError('Please enter your admin email address above first.');
      return;
    }

    try {
      setLoading(true);

      // Verify if the email is an authorized admin in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', identifier), where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Invalid mail: No authorized admin account found for this email.');
        return;
      }

      await sendPasswordResetEmail(auth, identifier);
      alert("Password reset email sent! Please check your inbox.");
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No admin account found with that email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginRole === 'admin') {
        await signInWithEmailAndPassword(auth, identifier, password);
        // Redirection is handled by the useEffect above once AuthContext updates
        return; // Keep loading true until unmount
      } else if (loginRole === 'driver') {
        const response = await loginAsDriver(identifier, password);
        if (response.success) {
          navigate('/driver');
          return; // Keep loading true until unmount
        } else {
          setError(response.error);
        }
      } else if (loginRole === 'student') {
        const response = await loginAsStudent(identifier, password);
        if (response.success) {
          navigate('/student');
          return; // Keep loading true until unmount
        } else {
          setError(response.error);
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid password");
      } else if (err.code === 'auth/user-not-found') {
        setError("User not found");
      } else {
        setError("Invalid credentials or server error.");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-3xl filter" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-3xl filter" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Bharat Track Logo" className="h-28 object-contain mx-auto mb-4 drop-shadow-sm" />
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-2">Sign in to your account</p>
          </div>

          <div className="flex mb-6 p-1 bg-gray-100 rounded-lg">
            {['admin', 'driver', 'student'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setLoginRole(role);
                  setIdentifier('');
                  setPassword('');
                  setError('');
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${
                  loginRole === role 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {loginRole === 'admin' ? 'Email Address' : loginRole === 'student' ? 'Roll Number' : 'Full Name (Username)'}
              </label>
              <input
                type={loginRole === 'admin' ? "email" : "text"}
                required
                value={identifier}
                autoComplete="off"
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-white/50"
                placeholder={loginRole === 'admin' ? "admin@college.edu" : loginRole === 'student' ? "e.g. 21XJ1A0501" : "e.g. John Doe"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-white/50 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};
