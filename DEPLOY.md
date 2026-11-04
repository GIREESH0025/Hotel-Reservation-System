# Harbour Row Hotel — Deployment Guide

> **This file contains instructions for HUMAN-only tasks.**
> Never commit `.env` files. Fill in real values only in the platform dashboards.

---

## Step 1: MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign in (or create a free account)
2. Create a new **Free Tier (M0)** cluster (choose a region near your users — e.g., Mumbai / AP South)
3. Under **Security > Database Access**: create a database user
   - Username: e.g. `hotelapp`
   - Password: generate a strong password, copy it
   - Role: **Read and write to any database**
4. Under **Security > Network Access**: add `0.0.0.0/0` for Render (or restrict to Render's IP range)
5. Under **Data Services > Database > Connect**: choose "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - Copy the connection string — it looks like:
     ```
     mongodb+srv://hotelapp:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Append the database name: `mongodb+srv://hotelapp:<password>@cluster0.xxxxx.mongodb.net/hotel_reservation?retryWrites=true&w=majority`

---

## Step 2: Push to GitHub

```bash
cd "Hotel Reservation System"
git init
git add .
git commit -m "feat: initial full implementation — Hotel Reservation System"
git branch -M main
git remote add origin https://github.com/<your-username>/hotel-reservation-system.git
git push -u origin main
```

> **IMPORTANT**: Confirm `.env` files are NOT tracked before pushing:
> ```bash
> git ls-files | grep "\.env$"
> # Should return EMPTY
> ```

---

## Step 3: Deploy Backend on Render

1. Go to [https://render.com](https://render.com) → **New > Web Service**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `harbour-row-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Free (or Starter for always-on)

4. Set Environment Variables (under **Environment** tab):
   ```
   MONGODB_URI      = mongodb+srv://hotelapp:<password>@cluster0.xxxxx.mongodb.net/hotel_reservation?retryWrites=true&w=majority
   JWT_SECRET       = <generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
   JWT_EXPIRES_IN   = 7d
   NODE_ENV         = production
   CLIENT_ORIGIN    = https://your-netlify-app.netlify.app
   AUTH_RATE_LIMIT  = 20
   PORT             = 10000
   ```

5. Click **Create Web Service** — wait for the first deploy to complete
6. Test: visit `https://harbour-row-backend.onrender.com/health`
   - Expected: `{"success":true,"status":"ok",...}`

> **Note on Render free tier**: The service sleeps after 15 minutes of inactivity.
> The first request may take 30-60 seconds to wake up.
> The frontend shows a "Waking the server…" message during this time.

---

## Step 4: Seed the Database

After the Render backend is live and Atlas is connected, run the seed script **once**:

```bash
cd backend
# Set env variables locally (use your Atlas URI)
MONGODB_URI="mongodb+srv://..." NODE_ENV=production node src/scripts/seed.js --force
```

This creates demo accounts:
- Admin: `admin@harbourrow.com` / `Admin@1234`
- Receptionist: `priya@harbourrow.com` / `Staff@1234`
- Customer: `rahul@example.com` / `Guest@1234`

---

## Step 5: Deploy Frontend on Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com) → **Add new site > Import an existing project**
2. Connect your GitHub repository
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

4. Set Environment Variables (under **Site settings > Environment variables**):
   ```
   VITE_API_URL    = https://harbour-row-backend.onrender.com/api/v1
   VITE_BRAND_NAME = Harbour Row Hotel
   ```

5. Create `frontend/public/_redirects` with the content:
   ```
   /*  /index.html  200
   ```
   (This enables SPA client-side routing — the file already exists in the repo)

6. Click **Deploy site**

---

## Step 6: Update CORS on Render

After getting your Netlify URL (e.g., `https://harbour-row-hotel.netlify.app`):

1. Go to your Render backend service → **Environment**
2. Update: `CLIENT_ORIGIN = https://harbour-row-hotel.netlify.app`
3. Click **Save changes** — Render will redeploy automatically

---

## Step 7: Verify End-to-End

1. Open your Netlify URL in a browser
2. Try logging in as admin: `admin@harbourrow.com` / `Admin@1234`
3. Navigate to Staff Dashboard — confirm data loads
4. Try availability search on the home page
5. Test a booking as customer: `rahul@example.com` / `Guest@1234`
6. Check CORS: open browser DevTools → Network tab → no CORS errors on API calls

---

## Step 8: Submission Artefacts

- [ ] **GitHub repo URL**: `https://github.com/<username>/hotel-reservation-system`
- [ ] **Frontend URL**: `https://harbour-row-hotel.netlify.app`
- [ ] **Backend URL**: `https://harbour-row-backend.onrender.com`
- [ ] **Postman collection**: in `docs/postman/`
- [ ] **Demo credentials**: in `README.md`
- [ ] **ER diagram**: in `docs/er-diagram.md`
- [ ] **Screenshots**: take and include in `docs/screenshots/`
- [ ] **Demo video**: record 2-3 minute walkthrough (login as each role, show key flows)

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Backend returns 503 | Render free tier sleeping | Wait 60 seconds and retry |
| CORS error in browser | CLIENT_ORIGIN not set correctly | Update env var on Render, redeploy |
| Login returns 401 | MONGODB_URI wrong or Atlas network access blocked | Check Atlas network access, add `0.0.0.0/0` |
| Vite build fails | Missing env var | Add VITE_API_URL to Netlify env |
| `/health` returns 500 | DB connection failed | Check MONGODB_URI in Render env |

