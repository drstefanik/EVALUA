import { useState } from "react";
import { at } from "../lib/airtable.js";

export function useAuth() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("binext_user") || "null")
  );
  const [role, setRole] = useState(() =>
    localStorage.getItem("binext_role") || null
  );
  const [loading, setLoading] = useState(false);

  const login = async ({ email, password, mode }) => {
    setLoading(true);
    try {
      const tbl =
        mode === "admin"
          ? import.meta.env.VITE_AT_TABLE_ADMINS
          : mode === "school"
          ? import.meta.env.VITE_AT_TABLE_SCHOOLS
          : import.meta.env.VITE_AT_TABLE_STUDENTS;

      const res = await at.list(tbl, {
        filterByFormula: "{email} = '" + email + "'",
      });

      const rec = res.records?.[0];
      if (!rec) throw new Error("User not found");

      const ok =
        !rec.fields.password_hash || rec.fields.password_hash === password;
      if (!ok) throw new Error("Wrong password");

      const u = {
        id: rec.id,
        email,
        name: rec.fields.full_name || rec.fields.name,
        role: mode,
      };

      // ✅ Salva anche token “finto” e ID/email standardizzati
      localStorage.setItem("authToken", `FAKE-${rec.id}`);
      localStorage.setItem("userId", rec.id);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("binext_user", JSON.stringify(u));
      localStorage.setItem("binext_role", mode);

      setUser(u);
      setRole(mode);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("binext_user");
    localStorage.removeItem("binext_role");
  };

  return { user, role, loading, login, logout };
}
