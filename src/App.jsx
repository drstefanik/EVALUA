
import React from "react"; import { Outlet } from "react-router-dom"; import Navbar from "./components/Navbar.jsx"; import Footer from "./components/Footer.jsx";
export default function App(){ return (<div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900"><Navbar/><main className="mx-auto max-w-7xl p-4"><Outlet/></main><Footer/></div>); }
