import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sprout, Volume2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import Button from "../components/ui/Button";
import hero from "../assets/images/bamboo-intelligence-hero.png";

export default function Login() {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "analyst@bamboo.io",
    password: "bamboo123",
  });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  if (auth.isAuthenticated) return <Navigate to="/dashboard" />;

  async function go(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      if (mode === "signup") {
        const result = await auth.signup(form);
        if (result?.created) {
          setSuccess("Account created. Check your email to confirm, then sign in.");
          setMode("login");
          return;
        }
      } else {
        await auth.login(form);
        nav(loc.state?.from?.pathname || "/dashboard");
        return;
      }

      if (mode === "signup") {
        nav(loc.state?.from?.pathname || "/dashboard");
      }
    } catch (x) {
      setErr(x.message || "Something went wrong.");
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.15fr_.85fr] bg-paper">
      <section className="hidden lg:flex text-white p-14 flex-col justify-between relative overflow-hidden bg-ink">
        <img
          src={hero}
          alt="Bamboo materials and sustainability intelligence"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -right-32 -top-32 w-[34rem] h-[34rem] border border-lime/30 rounded-full"
        />

        <div className="relative flex gap-3 items-center">
          <span className="w-11 h-11 bg-lime text-ink grid place-items-center">
            <Sprout />
          </span>
          <b>BAMBOO INTELLIGENCE</b>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-2xl"
        >
          <span className="font-mono text-[10px] text-lime tracking-[.2em]">
            MATERIAL DECISIONS / MADE VISIBLE
          </span>
          <h1 className="text-6xl font-extrabold leading-[.92] mt-5">
            Move from sustainability data to confident action.
          </h1>
          <p className="text-slate-200 mt-6 leading-7">
            Model transitions, log verified impact, compare suppliers and grow a smarter circularity programme.
          </p>
        </motion.div>

        <div className="relative flex gap-2 text-xs items-center">
          <Volume2 size={15} /> Optional spatial feedback sounds after sign-in
        </div>
      </section>

      <form onSubmit={go} className="m-auto w-full max-w-md p-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex rounded border overflow-hidden bg-slate-100">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`px-4 py-2 text-sm font-semibold ${mode === "login" ? "bg-ink text-white" : "text-slate-600"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`px-4 py-2 text-sm font-semibold ${mode === "signup" ? "bg-ink text-white" : "text-slate-600"}`}
            >
              Create account
            </button>
          </div>

          <span className="font-mono text-[9px] block mt-6">SECURE WORKSPACE</span>
          <h2 className="text-4xl font-extrabold mt-3">
            {mode === "signup" ? "Create account" : "Sign in"}
          </h2>
          <p className="mt-2 text-slate-500">
            {mode === "signup"
              ? "Create a workspace account to save your progress."
              : "Access materials, simulations and program metrics."}
          </p>

          {err && (
            <div className="mt-4 rounded border border-clay bg-clay/10 p-3 text-sm text-clay">
              {err}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded border border-lime bg-lime/10 p-3 text-sm text-ink">
              {success}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Full name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-3 bg-white"
                  placeholder="Your name"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded px-3 py-3 bg-white"
                placeholder="name@company.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border rounded px-3 py-3 bg-white"
                placeholder="••••••••"
                required
              />
            </label>
          </div>

          <div className="mt-6">
            <Button type="submit" className="w-full" disabled={auth.loading}>
              {auth.loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {mode === "signup" ? "Creating account..." : "Signing in..."}
                </>
              ) : mode === "signup" ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Demo mode: analyst@bamboo.io / bamboo123
          </p>
        </motion.div>
      </form>
    </main>
  );
}
