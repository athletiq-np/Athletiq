import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Animations
  const container = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.15 } }
  };
  const fadeIn = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100"
      initial="hidden"
      animate="show"
      variants={container}
      style={{
        background:
          "linear-gradient(120deg, #dbeafe 0%, #67e8f9 45%, #bbf7d0 100%)"
      }}
    >
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold mb-3 text-blue-800 text-center drop-shadow"
        variants={fadeIn}
      >
        ATHLETIQ
      </motion.h1>
      <motion.h2
        className="text-lg md:text-2xl font-medium mb-7 text-blue-900 text-center max-w-xl"
        variants={fadeIn}
      >
        {t("welcome") ||
          "Welcome to ATHLETIQ: A new era of youth sports data, registration & tournaments—powered by technology, built for every school in the world."}
      </motion.h2>
      <motion.p
        className="mb-9 text-base md:text-lg text-blue-700 text-center max-w-xl"
        variants={fadeIn}
      >
        {t("athletiq_mission") ||
          "Digitally connecting every school, athlete, coach, and tournament in Nepal and beyond."}
      </motion.p>
      <motion.div
        className="flex flex-col md:flex-row gap-5 mb-9"
        variants={fadeIn}
      >
        <button
          onClick={() => navigate("/register")}
          className="px-7 py-2 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow-lg hover:bg-blue-700 transition"
        >
          {t("start_registration") || "Register"}
        </button>
        <button
          onClick={() => navigate("/login")}
          className="px-7 py-2 rounded-xl bg-white text-blue-700 border border-blue-400 text-lg font-semibold shadow-lg hover:bg-blue-100 transition"
        >
          {t("login") || "Login"}
        </button>
      </motion.div>
      <motion.div className="flex gap-2" variants={fadeIn}>
        <button
          onClick={() => i18n.changeLanguage("en")}
          className={`px-3 py-1 rounded ${
            i18n.language === "en"
              ? "bg-blue-600 text-white"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage("np")}
          className={`px-3 py-1 rounded ${
            i18n.language === "np"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-600"
          }`}
        >
          ने
        </button>
      </motion.div>
      <motion.div
        className="absolute bottom-6 text-xs text-blue-400"
        variants={fadeIn}
      >
        Powered by ATHLETIQ &nbsp;|&nbsp; © {new Date().getFullYear()}
      </motion.div>
    </motion.div>
  );
}
