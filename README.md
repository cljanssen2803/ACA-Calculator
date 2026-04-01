# Wabash Center — ACA Eligibility Calculator

Internal HR tool for calculating ACA measurement periods, eligibility windows, and break-in-service rules using Wabash Center's specific thresholds.

---

## Deploy to Vercel (free, ~10 minutes)

### Step 1: Get the code onto GitHub

1. Go to [github.com](https://github.com) and create a free account if you don't have one
2. Click **New repository** (the green button)
3. Name it `wabash-aca-calculator`, set it to **Private**, click **Create repository**
4. On your computer, unzip this folder
5. Open Terminal (Mac) or Command Prompt (Windows) and navigate into the folder:
   ```
   cd wabash-aca-calculator
   ```
6. Run these commands one at a time:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/wabash-aca-calculator.git
   git push -u origin main
   ```
   (Replace YOUR-USERNAME with your GitHub username)

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **Add New Project**
3. Find `wabash-aca-calculator` in the list and click **Import**
4. Leave all settings as-is — Vercel will auto-detect it's a Vite project
5. Click **Deploy**
6. In about 60 seconds you'll get a live URL like `wabash-aca-calculator.vercel.app`

### Step 3: Add to iPhone home screen

1. Open the URL in **Safari** on your iPhone
2. Tap the **Share** button (box with arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Name it "ACA Calc" and tap **Add**

It will now live on your home screen and open full-screen like a native app.

---

## Thresholds Used

| Rule | Value |
|------|-------|
| Initial Measurement Period | 3 months |
| Initial Stability Period | 6 months |
| Standard Measurement Period | Jan–Jun / Jul–Dec |
| Admin Period | ~1 month |
| Stability Period (Ongoing) | 6 months |
| Break — no break recognized | < 4 weeks |
| Break — parity rule | 4–12 weeks |
| Break — new employee | 13+ weeks |
| Full-time threshold | 30+ hrs/week |

---

## Making Changes Later

Any time you want to update the tool, edit `src/App.jsx` and push to GitHub. Vercel will auto-redeploy within a minute.
