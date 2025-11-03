import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Particles from "../components/Particles.jsx";
import nextLogo from "../assets/NEXT2.2BG.png";
import logoBI from "../assets/BRITISH INSTITUTES INTERNATIONAL SCHOOL.png";
import illStudent from "../assets/illustration-student.svg";

const card = (d = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5, delay: d },
  viewport: { once: true, amount: 0.6 },
});

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-biwhite via-biwhite to-binavy/10 text-center dark:from-[#0a0f1f] dark:via-[#0a0f1f] dark:to-[#001c5e]">
      {/* === BACKGROUNDS === */}
      <div className="pointer-events-none absolute inset-0 -z-30 animate-gradient-x bg-gradient-to-r from-binavy via-biwhite to-bireg bg-[length:200%_200%] opacity-80 dark:from-[#001c5e] dark:via-[#0a0f1f] dark:to-[#7a0b18] dark:opacity-60" />
      <div className="absolute inset-0 -z-20 bg-hero-gradient" />
      <div className="absolute inset-0 -z-10 bg-network bg-cover bg-center opacity-[0.18] dark:opacity-[0.12]" />
      <div className="absolute inset-0 -z-5">
        <Particles density={110} />
      </div>

      {/* === HERO === */}
      <section className="relative z-10 mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex w-full max-w-4xl flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white/80 p-10 text-center shadow-sm shadow-soft backdrop-blur dark:border-white/10 dark:bg-[#0a0f1f]/70"
        >
          {nextLogo && (
            <motion.img
              src={nextLogo}
              alt="NEXT"
              className="h-20 w-auto drop-shadow-lg transition-transform duration-500 hover:scale-105 md:h-24"
              whileHover={{ scale: 1.05 }}
            />
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="inline-flex items-center rounded-full border border-binavy/20 bg-binavy/10 px-4 py-1 text-sm font-semibold text-binavy shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white md:text-base"
          >
            Native English eXperience Test
          </motion.div>

          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-binavy md:text-5xl dark:text-white">
            The horizontal certification program for every student in Italy's public schools
          </h1>

          <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
            Official materials always up to date, a download area dedicated to your campus, and student sign-ups with a School Code.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup-school"
              className="rounded-full bg-binavy px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#001c5e] focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-[#16348f] dark:focus-visible:ring-[#6a87ff] dark:focus-visible:ring-offset-[#0a0f1f]"
            >
              Register your school
            </Link>
            <Link
              to="/signup-student"
              className="rounded-full border border-binavy/30 bg-white px-6 py-3 text-sm font-semibold text-binavy shadow-sm transition hover:border-binavy hover:bg-biwhite focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-[#152044] dark:text-white dark:hover:bg-[#001c5e] dark:focus-visible:ring-[#6a87ff] dark:focus-visible:ring-offset-[#0a0f1f]"
            >
              I'm a student
            </Link>
          </div>
        </motion.div>
      </section>

      {/* === CARD SEZIONI === */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-20 md:grid-cols-2">
        <motion.div
          {...card(0.1)}
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm shadow-soft transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-slate-900/70"
        >
          <div className="aspect-[21/9] w-full overflow-hidden rounded-2xl bg-binavy/5 dark:bg-white/10">
            <img src={logoBI} alt="British Institutes" className="h-full w-full object-contain p-6" />
          </div>
          <div className="mt-5">
            <h3 className="mb-2 text-xl font-semibold text-binavy dark:text-white">School</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              A dedicated space for the campus to share materials with its classes.
            </p>
            <Link
              to="/signup-school"
              className="inline-flex items-center text-sm font-semibold text-bireg transition hover:text-bireg/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[#ff7a88] dark:focus-visible:ring-white/20 dark:focus-visible:ring-offset-[#0a0f1f]"
            >
              Open →
            </Link>
          </div>
        </motion.div>

        <motion.div
          {...card(0.2)}
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm shadow-soft transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-slate-900/70"
        >
          <div className="aspect-[21/9] w-full overflow-hidden rounded-2xl bg-binavy/5 dark:bg-white/10">
            <img src={illStudent} alt="Student" className="h-full w-full object-contain p-6" />
          </div>
          <div className="mt-5">
            <h3 className="mb-2 text-xl font-semibold text-binavy dark:text-white">Student</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Sign up with your School Code and access the downloads for your campus.
            </p>
            <Link
              to="/signup-student"
              className="inline-flex items-center text-sm font-semibold text-bireg transition hover:text-bireg/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[#ff7a88] dark:focus-visible:ring-white/20 dark:focus-visible:ring-offset-[#0a0f1f]"
            >
              Open →
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
