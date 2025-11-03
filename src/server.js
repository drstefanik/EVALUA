import "dotenv/config.js";
import express from "express";
import cors from "cors";
import { tbl } from "./airtable.js";
import { hashPassword, comparePassword, signJWT } from "./util.js";
import { findAdminByEmail, findSchoolByEmail, findStudentByEmail, findOTP } from "./finders.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

/** ---------- LOGIN UNIFICATO ---------- **/
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const tryLogin = async (user, role, nameField, extra = {}) => {
      if (!user) return false;
      if (user.status !== "active") {
        res.status(423).json({ error: "Utente disabilitato" });
        return true;
      }
      if (!(await comparePassword(password, user.password_hash))) {
        return false;
      }

      const sanitizedExtra = Object.fromEntries(
        Object.entries(extra).filter(([, value]) => value !== undefined)
      );
      const payload = { role, id: user.id, email: user.email, ...sanitizedExtra };

      res.json({
        token: signJWT(payload),
        role,
        id: user.id,
        name: user[nameField],
        ...sanitizedExtra,
      });
      return true;
    };

    if (await tryLogin(await findAdminByEmail(email), "admin", "full_name")) return;
    if (await tryLogin(await findSchoolByEmail(email), "school", "name")) return;
    const student = await findStudentByEmail(email);
    if (await tryLogin(student, "student", "full_name", { schoolId: student?.school?.[0] })) return;

    return res.status(401).json({ error: "Email o password non valide" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- SIGNUP STUDENTE ---------- **/
app.post("/auth/signup-student", async (req, res) => {
  try {
    const { full_name, email, password, schoolId } = req.body;

    // E-mail unica tra gli studenti
    const exists = await findStudentByEmail(email);
    if (exists) return res.status(409).json({ error: "Email già registrata" });

    const password_hash = await hashPassword(password);

    const created = await tbl.STUDENTS.create([
      { fields: { full_name, email, password_hash, status: "active", school: schoolId ? [schoolId] : [] } }
    ]);

    const id = created[0].id;
    const token = signJWT({ role: "student", id, email, schoolId });
    res.status(201).json({ token, role: "student", id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- SIGNUP SCUOLA CON OTP ---------- **/
app.post("/auth/signup-school", async (req, res) => {
  try {
    const { name, email, password, otp_code } = req.body;

    const already = await findSchoolByEmail(email);
    if (already) return res.status(409).json({ error: "Email scuola già registrata" });

    const otp = await findOTP(otp_code);
    if (!otp || otp.used === true) return res.status(400).json({ error: "OTP non valido o già usato" });

    const password_hash = await hashPassword(password);

    const created = await tbl.SCHOOLS.create([{ fields: { name, email, password_hash, status: "active" } }]);
    const schoolId = created[0].id;

    await tbl.SCHOOL_OTP.update([{ id: otp.id, fields: { used: true, school: [schoolId] } }]);

    const token = signJWT({ role: "school", id: schoolId, email });
    res.status(201).json({ token, role: "school", id: schoolId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Avvio server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Auth API running on :${port}`));
