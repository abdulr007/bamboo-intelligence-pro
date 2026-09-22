import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AmbientBackground from "../visual/AmbientBackground";
import useApp from "../../hooks/useApp";
import Tutorial, { TutorialLauncher } from "../tutorial/Tutorial";
import QuickGuide from "../tutorial/QuickGuide";
import { configureAmbientMusic, unlockAudio } from "../../services/audio";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [tutorial, setTutorial] = useState(
    () => localStorage.getItem("bi:tutorial-complete") !== "true"
  );
  const [guide, setGuide] = useState(false);
  const app = useApp();

  const musicEnabled = app.prefs.music ?? true;
  const musicVolume = app.prefs.musicVolume ?? 0.08;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", app.prefs.theme === "dark");
  }, [app.prefs.theme]);

  useEffect(() => {
    configureAmbientMusic({ enabled: musicEnabled, volume: musicVolume });
  }, [musicEnabled, musicVolume]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <div className="theme-shell min-h-screen relative">
      <AmbientBackground />
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobile={mobile}
        setMobile={setMobile}
      />

      <motion.div animate={{ marginLeft: collapsed ? 80 : 256 }} className="hidden lg:block relative z-10">
        <Header menu={() => setMobile(true)} onGuide={() => setGuide(true)} />
        <main className="grid-paper min-h-[calc(100vh-5rem)] p-8"><Outlet /></main>
      </motion.div>

      <div className="lg:hidden relative z-10">
        <Header menu={() => setMobile(true)} onGuide={() => setGuide(true)} />
        <main className="grid-paper min-h-[calc(100vh-5rem)] p-4"><Outlet /></main>
      </div>

      <Tutorial open={tutorial} onClose={() => setTutorial(false)} />
      <QuickGuide open={guide} onClose={() => setGuide(false)} onTour={() => setTutorial(true)} />
      <TutorialLauncher onStart={() => setTutorial(true)} />
    </div>
  );
}
