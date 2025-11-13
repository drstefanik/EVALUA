
import React from "react"; import { Navigate } from "react-router-dom"; import { useAuth } from "../hooks/useAuth.js";
export default function Protected({roles,children}){ const {user,role,loading}=useAuth(); if(loading) return null; if(!user) return <Navigate to="/login-student" replace />; if(roles && !roles.includes(role)) return <Navigate to="/" replace />; return children; }
