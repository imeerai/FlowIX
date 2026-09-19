import { Loader2 } from "lucide-react";
import LoginLeft from "../components/LoginLeft";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";

const AuthPage = ({ mode }) => {
  const { login, register } = useAppContext();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/");
    } catch (error) {
      setError(
        error.message ||
          (mode === "login"
            ? "Invalid Email or Password"
            : "Registration failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex text-zinc-900 font-sans">
      {/* left panel branding */}
      <LoginLeft />
      {/* right panel branding */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-1.5 font-sans">
              {isLogin ? "Sign in" : "Create an account"}
            </h1>
            <p className="text-zinc-400 text-sm">
              {isLogin
                ? "Enter your credentials to access your account."
                : "Get started by creating a new account."}
            </p>
          </div>
          {error && (
            <div className="mb-6 p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:ring-zinc-950 text-sm text-zinc-900 bg-transparent placeholder-zinc-300 transition-colors"
                  placeholder="Meer Abbas"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:ring-zinc-950 text-sm text-zinc-900 bg-transparent placeholder-zinc-300 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:ring-zinc-950 text-sm text-zinc-900 bg-transparent placeholder-zinc-300 transition-colors"
                placeholder="***************"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 bg-linear-to-br from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 hover:scale-[1.01] text-white font-semibold disabled:opacity-40 flex items-center justify-center cursor-pointer mt-2 rounded-lg transition-all"
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" />}
              {!loading && (isLogin ? "Sign in" : "sign up")}
            </button>
          </form>
          <p className="text-sm text-zinc-400 mt-8 pt-6 border-t border-zinc-100 font-sans">
            {isLogin ? (
              <>
                New to FlowIX?{""}
                <Link
                  className="text-zinc-900 hover:underline font-medium"
                  to="/register"
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{""}
                <Link
                  className="text-zinc-900 hover:underline font-medium"
                  to="/login"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
