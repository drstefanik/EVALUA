# EVALUA Education Frontend

Marketing and onboarding experience for EVALUA Education. The project includes the public site, contact form, and access flows for schools and students.

- Built with React, Vite, Tailwind CSS, and Framer Motion
- Theme variables in `src/styles/theme.css`
- Internationalised marketing copy in `src/i18n/en/marketing.json`
- Public routes: `/`, `/about`, `/quaet`, `/solutions`, `/solutions/testing-platform`, `/solutions/certification`, `/solutions/partnerships`, `/recognition`, `/resources`, `/contact`, `/privacy`, `/terms`
- Auth routes: `/login`, `/signup-school`, `/signup-student`, `/logout`, `/forgot`
- Role dashboards remain available at `/admin`, `/school`, `/student`

## Setup

```bash
npm install
cp .env.example .env
npm run build && npm run preview
```
