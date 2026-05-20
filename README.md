# 🗺️ Herts Quest

A gamified university treasure hunt web app for the University of Hertfordshire. Students scan QR codes around campus, answer puzzles, earn points, and compete on a live leaderboard.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run database migrations & seed sample puzzles
npx prisma migrate dev --name init
npx prisma db seed

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
herts-quest/
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.ts              # Sample puzzle data
├── src/
│   ├── app/
│   │   ├── page.tsx         # Home page
│   │   ├── leaderboard/     # Live leaderboard
│   │   ├── quest/[code]/    # Puzzle solving page
│   │   ├── admin/           # Admin dashboard
│   │   │   └── puzzles/     # Puzzle CRUD + QR generator
│   │   └── api/             # API routes
│   │       ├── leaderboard/ # GET leaderboard data
│   │       ├── submit/      # POST answer submission
│   │       ├── qr/          # GET QR code PNG
│   │       └── admin/       # Admin CRUD endpoints
│   └── lib/
│       ├── prisma.ts        # Prisma client singleton
│       └── auth.ts          # Admin password check
├── .env                     # DATABASE_URL + ADMIN_PASSWORD
└── tailwind.config.ts
```

---

## 🔑 Pages

| Route | Description |
|-------|-------------|
| `/` | Home / landing page |
| `/leaderboard` | Live leaderboard (auto-refreshes every 5s) |
| `/quest/[code]` | Puzzle page (reached by scanning QR) |
| `/admin` | Admin login |
| `/admin/puzzles` | Create / edit / delete puzzles + QR generation |

---

## ⚙️ Configuration

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="hertsquest2024"   # Change this!
```

---

## 🧩 How It Works

1. **Admin** creates puzzles at `/admin/puzzles` and downloads QR code PNGs
2. QR codes are printed and placed around campus
3. **Students** scan a QR code → opens `/quest/[CODE]`
4. Student enters name (saved to localStorage for session)
5. Student answers the puzzle
6. Correct answer → points awarded, submission recorded, duplicate-solve prevented
7. Live leaderboard updates every 5 seconds

---

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark gamified UI)
- **Prisma** + **SQLite**
- **qrcode** npm package for QR generation

---

## 🌱 Seed Data

Running `npx prisma db seed` creates 5 sample puzzles:

| Code | Title | Points |
|------|-------|--------|
| LIB001 | The Library Lion | 10 |
| SCI002 | Science Lab Secret | 15 |
| STU003 | Student Union Cipher | 10 |
| SPT004 | Sports Hall Challenge | 20 |
| CAF005 | Canteen Conundrum | 25 |

To use seed: add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```
And install: `npm install -D ts-node`

---

## 🎨 Design

- Deep purple/navy dark theme with amber gold accents
- Boogaloo display font + Nunito body font
- Smooth CSS animations (float, bounce-in, slide-up, shimmer)
- Podium view for top 3 on leaderboard
- Glow effects on interactive elements
- Mobile-first (max-width containers, touch-friendly buttons)
