# 🏥 MediGuide — Find the right care, anywhere

A global, patient-friendly healthcare directory and appointment platform, built as a Final Year Project.

Patients browse **Country → City → Facility Type (Hospital / Clinic / Medical Complex / Lab) → Facility → Doctor profile**, then book **in-person or video consultations** — while admins manage all platform data from a dedicated admin panel. The interface supports **multiple languages with full RTL** (Arabic, Urdu).

---

## ✨ Features

### Patient website
- **Cascading location discovery** — Home → Country (flags) → City → Facility-type cards → Facility list
- **Facility pages** — verified badge, description, contact info, map link, photo gallery, doctor list
- **Doctor profiles** — specialty, qualifications, experience, dual fees (in-person + video), weekly availability table, patient reviews with star ratings
- **Find Doctors directory** — global search + filters (country, city, specialty, video-only) + sorting (rating, experience, fee, name)
- **Dual-mode booking** — pick 🏥 In-Person or 🎥 Video → date strip (disabled days greyed) → live slot grid → notes → confirm
- **Live slot engine** — generates bookable times from doctor availability windows; removes booked/past slots; prevents double-booking (action check + DB unique constraint)
- **Patient dashboard** — upcoming/history appointments, cancel, **🎥 Join Call** button (Jitsi) for confirmed video appointments
- **Reviews** — star picker, gated to patients with a *completed* appointment, public only after admin approval
- **Favourites** — heart any doctor; favourites grid on the dashboard
- **Notifications** — bell with unread badge; events for booking, confirmations, completions, cancellations
- **Multi-language** — 6 UI languages, switcher in header, per-language content translations, RTL mirroring for Arabic/Urdu

### Admin panel (`/admin`)
- Secure login, role-guarded layout, sidebar navigation
- **Dashboard** — live stat cards (countries, cities, facilities, doctors, patients, today's appointments)
- **Full CRUD** — Countries, Cities, Facility Types, Facilities, Specialties, Doctors, Users
- **Doctor availability editor** — per-weekday time windows with slot duration and mode (in-person / video / both)
- **Appointments manager** — status filters, Confirm → Complete → Cancel workflow, Jitsi join links
- **Review moderation** — Pending/Approved tabs, approve/unpublish/delete; doctor ratings recompute automatically
- **Languages Manager** — add languages (auto LTR/RTL), enable/disable, set default
- **Translations editor** — spreadsheet-style editor for translating country/city/type/specialty/facility names per language
- **Settings** — change admin password, platform overview

### Roles
| Role | Capabilities |
|---|---|
| **ADMIN** | Everything in the admin panel |
| **PATIENT** | Browse, book, review, favourite, notifications |
| **DOCTOR** | Account role ready (self-service dashboard is future work) |

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions, Cache Components) |
| Language | TypeScript |
| Database | **SQLite** (dev) via **Prisma 7** driver adapter — swappable to PostgreSQL |
| Styling | **Tailwind CSS 4** |
| Auth | Custom JWT sessions (`jose`) + `bcryptjs` password hashing, HttpOnly cookies |
| i18n | Cookie-based locale + typed dictionaries + DB `ContentTranslation` table |
| Video | Jitsi Meet (free) — link generated per confirmed video appointment |
| Validation | Zod-style manual validation + Prisma error mapping |

## 🗃 Database Schema (13 models)

`User`, `Country`, `City`, `FacilityType`, `Facility`, `Specialty`, `Doctor`,
`Availability`, `Appointment`, `Review`, `Favourite`, `Notification`,
`Language`, `ContentTranslation`

SQLite has no enums — statuses/modes are validated string constants in `src/lib/constants.ts`.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (already provided in .env)
#    DATABASE_URL="file:./prisma/dev.db"
#    AUTH_SECRET=...

# 3. Create the database and push the schema
npx prisma db push

# 4. Seed demo data (admin, countries, cities, facilities, doctors, reviews, translations)
npx tsx prisma/seed.ts

# 5. Run the dev server
npm run dev
```

Open **http://localhost:3000**.

### Demo accounts (after seeding)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@mediguide.com` | `Admin@123` |
| Patient | `patient@mediguide.com` | `Patient@123` |

### Production build
```bash
npm run build && npm start
```

### Switching to PostgreSQL (Neon) later
1. `npm i @prisma/adapter-pg` and swap the adapter in `src/lib/db.ts`
2. Change `provider = "postgresql"` in `prisma/schema.prisma` (enums can then be restored)
3. Update `DATABASE_URL` in `.env` / deployment env vars
4. `npx prisma db push`

---

## 📁 Project Structure

```
mediguide/
├── prisma/
│   ├── schema.prisma        # 13 models
│   └── seed.ts              # admin + demo data + translations
├── prisma.config.ts
├── src/
│   ├── app/
│   │   ├── (patient)/       # public website (route group)
│   │   │   ├── page.tsx             # home (hero, countries, featured)
│   │   │   ├── c/[countryCode]/     # country → city → type cascade
│   │   │   ├── facility/[id]/       # facility detail
│   │   │   ├── doctor/[id]/         # doctor profile
│   │   │   ├── doctors/             # directory with filters
│   │   │   ├── book/[id]/           # booking flow
│   │   │   ├── account/             # patient dashboard + notifications
│   │   │   ├── login/ register/
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   └── (protected)/         # role-guarded admin area
│   │   │       ├── countries/ cities/ facility-types/
│   │   │       ├── facilities/ specialties/
│   │   │       ├── doctors/[id]/availability/
│   │   │       ├── appointments/ reviews/ users/
│   │   │       └── languages/ translations/ settings/
│   │   └── api/slots/       # live slot API
│   ├── components/
│   │   ├── admin/           # EntityDialog, DeleteButton, Table, PageHeader…
│   │   ├── patient/         # cards, BookingWidget, ReviewForm, FavouriteButton…
│   │   └── auth/            # LoginForm, RegisterForm
│   ├── lib/
│   │   ├── actions/         # server actions (auth, admin, booking, engagement, i18n)
│   │   ├── i18n/            # config + 6 dictionaries + server helpers
│   │   ├── auth.ts db.ts constants.ts slots.ts notifications.ts …
│   └── generated/prisma/    # generated client (gitignored)
```

## 🌍 Adding a Language (3 steps)

1. **Admin → Languages → Add Language** (e.g. code `es`, direction `LTR`)
2. **Admin → Translations → Español** — translate country/city/type/specialty/facility names (empty = English fallback)
3. Optionally add UI strings in `src/lib/i18n/dictionaries/es.ts` — missing keys automatically fall back to English

## 📈 Development Phases (completed)

| Phase | Scope |
|---|---|
| 0–1 | Planning, Next.js setup, Prisma schema, JWT auth, seeded SQLite |
| 2 | Admin panel with full CRUD + availability editor |
| 3 | Patient website with cascading location flow, filters, profiles |
| 4 | Dual-mode booking, slot engine API, patient dashboard, admin appointment manager, Jitsi video links |
| 5 | Reviews with moderation, favourites, notifications |
| 6 | Multi-language (6 UI languages), DB content translations, RTL, Languages Manager, Translations editor |
| 7 | Users manager, settings, documentation, polish |

## 🔮 Future Work

- Doctor self-service portal (own login: edit profile, availability, confirm appointments)
- Embedded branded video (100ms / Daily.co) instead of Jitsi redirect
- Image uploads via Cloudinary (URLs supported today)
- SMS/WhatsApp notifications, Google Maps embeds
- Sub-admins per country, analytics dashboard
