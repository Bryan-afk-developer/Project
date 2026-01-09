# PostgreSQL Cloud Setup Guide

## Using Neon (Recommended)

### Step 1: Create Account
1. Go to https://neon.tech
2. Sign up with GitHub or Google (free)

### Step 2: Create Project
1. Click "Create Project"
2. Name: `azzuna-db`
3. Region: Choose closest to you
4. PostgreSQL version: 16 (latest)

### Step 3: Get Connection String
After creating project, you'll see a connection string like:
```
postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### Step 4: Update Your .env File

Replace the database section in `backend/.env` with:

```env
# Use the values from Neon connection string
DB_USER=your_neon_user
DB_HOST=ep-xxx-xxx.region.aws.neon.tech
DB_NAME=neondb
DB_PASSWORD=your_neon_password
DB_PORT=5432
```

OR use the full connection string:
```env
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### Step 5: Initialize Database

**Option A - Using SQL Editor in Neon Dashboard:**
1. Go to Neon dashboard
2. Click "SQL Editor"
3. Copy all contents from `backend/src/database/init.sql`
4. Paste and run in SQL Editor

**Option B - Using psql command line:**
```bash
psql "postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require" -f backend/src/database/init.sql
```

### Step 6: Restart Backend
```bash
cd backend
npm start
```

---

## Using Supabase (Alternative)

### Setup Steps:
1. Go to https://supabase.com
2. Create new project
3. Go to "Project Settings" → "Database"
4. Find "Connection string" (URI mode)
5. Update your `.env` with those credentials
6. In Supabase SQL Editor, run your `init.sql` script

---

## Connection String Format

If you get a full connection string, update `backend/src/config/database.js` to use it:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
```

Then in `.env`:
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

---

## Benefits of Cloud PostgreSQL

✅ **No installation needed** - Works immediately
✅ **24/7 availability** - Always running
✅ **Automatic backups** - Data safety
✅ **Scalable** - Upgrade when needed
✅ **Free tier** - Perfect for development and small apps
✅ **Secure** - SSL connections by default

---

## Local PostgreSQL (Windows)

If you prefer local development:

### Check if installed:
```powershell
Get-Service -Name postgresql*
```

### Start service:
```powershell
Start-Service postgresql-x64-16
```

### If not installed:
Download from: https://www.postgresql.org/download/windows/

After installation, PostgreSQL runs as a Windows service automatically.
