

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FacebookIcon, TwitterIcon, GithubIcon, GoogleIcon, EyeIcon, EyeOffIcon } from './icons';

// @ts-ignore
const auth = window.firebase.auth;

interface LoginPageProps {
  // onLogin prop is no longer needed as App.tsx listens to auth state changes.
}

const TreeIllustrationLeft: React.FC = () => (
    <svg width="230" height="225" viewBox="0 0 230 225" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 z-0 hidden md:block">
      <path d="M6.61939 123.315C6.61939 123.315 25.9848 114.305 52.5025 123.315C79.0203 132.325 102.335 123.315 102.335 123.315V225H6.61939V123.315Z" fill="#F0EEFA"/>
      <path d="M102.335 123.315V225H122.766V152.34C122.766 152.34 114.821 154.522 102.335 123.315Z" fill="#EBE9F8"/>
      <path d="M117.893 225H134.112V180.33C134.112 180.33 131.139 181.711 117.893 162.274V225Z" fill="#F0EEFA"/>
      <path d="M134.112 180.33V225H144.327V199.355C144.327 199.355 140.865 200.046 134.112 180.33Z" fill="#EBE9F8"/>
      <circle cx="125.751" cy="46.0152" r="46.0152" fill="#D3CEF4"/>
      <circle cx="59.5838" cy="85.1269" r="29.0203" fill="#D3CEF4"/>
      <path d="M60.1837 71.302L49.3752 85.3435L60.1837 99.385L70.9922 85.3435L60.1837 71.302Z" fill="#B3ACE2"/>
      <path d="M125.751 71.302L114.943 85.3435L125.751 99.385L136.56 85.3435L125.751 71.302Z" fill="#B3ACE2"/>
      <path d="M59.5843 85.6269H60.7832" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M125.152 85.6269H126.351" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M125.751 28.1218V21.1066" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M125.751 71.302V64.2868" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M142.338 33.6444L146.945 29.0371" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M109.165 65.772L104.558 61.1646" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M153.957 46.0152H160.972" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M90.5303 46.0152H97.5455" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M142.338 58.3862L146.945 62.9935" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M109.165 26.2584L104.558 21.6511" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M59.5843 65.772V62.2644" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M59.5843 104.48H59.5843" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M70.3922 71.302L72.7963 68.8978" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M48.7764 99.385L46.3722 101.789" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M78.6044 85.6269H81.0086" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M38.16 85.6269H40.5642" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M70.3922 99.385L72.7963 101.789" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M48.7764 71.302L46.3722 68.8978" stroke="#A6A0D5" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const TreeIllustrationRight: React.FC = () => (
    <svg width="191" height="179" viewBox="0 0 191 179" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 right-0 z-0 hidden md:block">
      <path d="M101.652 110.457C121.341 113.382 149.366 102.733 160.525 81.562C171.685 60.391 162.153 32.2238 142.464 29.2988C122.775 26.3738 94.7505 37.0223 83.5909 58.1935C72.4314 79.3648 81.963 107.532 101.652 110.457Z" fill="#B3ACE2"/>
      <path d="M141.223 125.297C157.942 127.839 181.673 119.243 190.183 101.213C198.694 83.1831 187.933 60.0131 171.214 57.471C154.495 54.9289 130.764 63.525 122.254 81.5549C113.743 99.5849 124.504 122.755 141.223 125.297Z" fill="#D3CEF4"/>
      <path d="M132.823 178.99C143.256 178.58 152.173 168.966 151.763 158.533C151.353 148.1 141.739 139.183 131.306 139.593C120.873 140.003 111.956 149.617 112.366 160.05C112.776 170.483 122.39 179.4 132.823 178.99Z" fill="#F0EEFA"/>
    </svg>
);

const LoginPage: React.FC<LoginPageProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      // onAuthStateChanged in App.tsx will handle navigation.
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Email atau password salah.');
          break;
        case 'auth/invalid-email':
          setError('Format email tidak valid.');
          break;
        default:
          setError('Terjadi kesalahan saat login. Silakan coba lagi.');
          break;
      }
      console.error("Firebase login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F7FA] dark:bg-slate-900 font-sans relative overflow-hidden">
        <TreeIllustrationLeft />
        <TreeIllustrationRight />
        
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 z-10 m-4">
            <div className="flex flex-col items-center mb-6">
                <div className="flex items-center space-x-3">
                    <div className="bg-indigo-600 rounded-full p-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </div>
                    <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dakota</span>
                </div>
            </div>

            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Welcome to Dakota! 👋🏻</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Please sign-in to your account and start the adventure</p>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={passwordVisible ? "text" : "password"}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400"
                            aria-label="Toggle password visibility"
                        >
                            {passwordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-700"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                            Remember me
                        </label>
                    </div>
                    <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Forgot password?
                    </a>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    New on our platform?{' '}
                    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Create an account
                    </a>
                </p>
            </div>

            <div className="mt-6 flex items-center">
                <div className="flex-grow border-t border-gray-300 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-gray-400 dark:text-slate-500">or</span>
                <div className="flex-grow border-t border-gray-300 dark:border-slate-600"></div>
            </div>

            <div className="mt-6 flex justify-center space-x-4">
                 <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Login with Facebook"><FacebookIcon className="h-6 w-6" /></a>
                 <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Login with Twitter"><TwitterIcon className="h-6 w-6" /></a>
                 <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Login with Github"><GithubIcon className="h-6 w-6" /></a>
                 <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Login with Google"><GoogleIcon className="h-6 w-6" /></a>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;