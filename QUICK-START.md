# ⚡ CLICK System - Quick Reference

## 🚀 Start the System (Pick One)

### Option 1: Batch File (Easiest for Windows)
Double-click:
```
start-system.bat
```

### Option 2: PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File .\start-system.ps1
```

### Option 3: Manual (Two Terminals)

**Terminal 1 - Backend:**
```powershell
cd backend
python run_server.py
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install  # First time only
npm run dev
```

---

## 🌐 Access Points

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | Check here first |
| Backend | http://localhost:8000 | API service |
| API Docs | http://localhost:8000/docs | Self-documenting |

---

## 📌 System Status

```
Backend Configuration:    ✅ Ready
Frontend Configuration:   ✅ Ready
Database Connection:      ✅ Configured
Environment Variables:    ✅ Set
Python Dependencies:      ✅ Installed
Node.js Ready:            ⏳ Needs npm install (first time)
```

---

## 🔑 First Login

1. Open http://localhost:3000
2. Click "Sign Up" or "Create Account"
3. Use email and password
4. After sign up, set yourself as Super Admin:

**In Supabase SQL Editor:**
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'your-email@example.com'
LIMIT 1;
```

Or use the Quick Admin Script: `backend/scripts/create_admin.py`

---

## 📊 Admin Features

Once logged in as Super Admin:
- View Dashboard: `/admin/dashboard`
- Create Organization: `/admin/organizations`
- Manage Users: `/admin/users`
- View Analytics: `/admin/analytics`

---

## 🏢 Create Your First Organization

1. Go to `/admin/organizations`
2. Click "New Organization"
3. Fill in:
   - Organization Name
   - Email
   - Phone
   - Subscription Tier (default: Basic)
4. Click "Create"
5. Set up organizational structure with Setup Wizard

---

## 📁 Project Root Files

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_READY.md` | Full implementation guide |
| `start-system.bat` | Windows batch startup |
| `start-system.ps1` | PowerShell startup |
| `verify-setup.js` | Verify system readiness |
| `README.md` | Original project README |

---

## 🐛 Common Issues

### "Module not found: fastapi"
```powershell
cd backend
pip install -r requirements.txt
```

### "npm: command not found"
- Install Node.js from https://nodejs.org
- Restart terminal
- Run `npm install` in frontend directory

### Backend won't start (port 8000 in use)
```powershell
# Kill the process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend won't start (port 3000 in use)
```powershell
# Kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🎯 Next Steps

1. ✅ Start the system using one of the methods above
2. ⏳ Wait for both servers to fully start (30-60 seconds)
3. 🌐 Open http://localhost:3000 in browser
4. 📝 Sign up and create Super Admin role
5. 🏢 Create organization and add employees

---

## 📞 System Health Check

When both servers are running:

```bash
# Check Backend API
curl http://localhost:8000/health

# Check Frontend
curl http://localhost:3000

# Expected Responses
# Backend: { "status": "ok" }
# Frontend: HTML page content
```

---

## 🔧 Development Commands

```powershell
# Backend - with auto-reload
cd backend & python -m uvicorn main:app --reload

# Frontend - production build
cd frontend & npm run build

# Frontend - production start
cd frontend & npm run start

# Lint code
cd frontend & npm run lint
```

---

## 📚 Documentation

- **Full System Docs**: `docs/SYSTEM_DOCUMENTATION.md`
- **Implementation Guide**: `IMPLEMENTATION_READY.md`
- **This Quick Ref**: `QUICK-START.md`

---

## ✨ System is Ready!

All prerequisites are configured. 
**Start the system now and begin using CLICK!**

Status: **🟢 READY TO RUN**
