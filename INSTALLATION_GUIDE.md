# SmartBudget Installation Guide

A complete step-by-step guide to install and run the SmartBudget application on your Windows laptop.

---

## Table of Contents
1. [Quick Start (Recommended - Using Docker)](#quick-start-recommended--using-docker)
2. [Full Local Setup (Without Docker)](#full-local-setup-without-docker)
3. [Verify Everything Works](#verify-everything-works)
4. [Troubleshooting](#troubleshooting)

---

## Quick Start (Recommended - Using Docker)

**Why use Docker?** You don't need to install PostgreSQL separately. Docker handles everything.

### Step 1: Install Docker Desktop

1. Go to https://www.docker.com/products/docker-desktop
2. Click **"Download for Windows"** (blue button)
3. The file `Docker Desktop Installer.exe` will download
4. Double-click the installer file
5. Click **"OK"** if prompted by User Account Control
6. **Check the box** for "Install required Windows components for WSL 2" (if it appears)
7. Click **"Install"**
8. Wait for installation (5-10 minutes)
9. Click **"Close"** when done
10. Your computer will restart automatically
11. Docker Desktop will open automatically after restart

### Step 2: Verify Docker Installation

1. Press **Windows key + R** (opens Run dialog)
2. Type: `cmd` and press **Enter**
3. A black terminal window opens
4. Type these commands one by one and press Enter after each:

```
docker --version
docker compose version
```

**Expected output:**
```
Docker version 24.0.0 (or higher)
Docker Compose version 2.20.0 (or higher)
```

If you see version numbers, Docker is installed correctly. ✅

### Step 3: Navigate to Your Project Folder

1. Press **Windows key + R**
2. Type: `%USERPROFILE%\Projects\smartbudget\smartbudget`
3. Press **Enter**
4. A Windows Explorer folder opens showing: `client`, `server`, `docker-compose.yml`, etc.
5. This confirms you're in the correct project directory

### Step 4: Start the Project with Docker

1. In the explorer folder, right-click in the empty space (not on a file)
2. Click **"Open in Terminal"** (or "Open in Windows Terminal")
3. A terminal window opens at the bottom/top of the screen
4. Type:

```
docker compose up --build
```

5. Press **Enter**
6. Wait 1-2 minutes while Docker downloads images and starts services
7. You'll see messages like:
   - `✔ Container smartbudget-db-1 Started` (database)
   - `✔ Container smartbudget-server-1 Started` (API server)

**Services running:**
- Database (PostgreSQL): Running on `localhost:5432`
- Server (API): Running on `http://localhost:5000`

### Step 5: Install Client Dependencies & Run Frontend

1. Press **Windows key + R**
2. Type: `%USERPROFILE%\Projects\smartbudget\smartbudget\client`
3. Press **Enter**
4. Right-click in the empty space and click **"Open in Terminal"**
5. Type:

```
npm install
```

6. Press **Enter**
7. Wait for dependencies to install (2-5 minutes)
8. When done, type:

```
npm run dev
```

9. Press **Enter**
10. You'll see:
    ```
    VITE v8.0.4 ready in X ms
    ➜  Local:   http://localhost:5173/
    ➜  press h + enter to show help
    ```

### Step 6: Open the Application

1. Open your browser (Chrome, Firefox, Edge, etc.)
2. Go to: `http://localhost:5173`
3. You should see the SmartBudget login page

✅ **Application is running!**

---

## Full Local Setup (Without Docker)

Use this if you prefer not to use Docker.

### Step 1: Install Node.js v20

1. Go to https://nodejs.org
2. Click the **LTS** (Long Term Support) button
3. Download the `.msi` file for Windows
4. Double-click the installer
5. Click **"Next"** on all screens
6. **Check the box** for "Automatically install the necessary tools for native modules"
7. Click **"Install"**
8. Click **"Finish"** when done
9. Your computer may restart

### Step 2: Verify Node.js Installation

1. Press **Windows key + R**
2. Type: `cmd` and press **Enter**
3. Type:

```
node --version
npm --version
```

**Expected output:**
```
v20.x.x
10.x.x (or higher)
```

### Step 3: Install PostgreSQL

1. Go to https://www.postgresql.org/download/windows/
2. Click **"Download the installer"**
3. Choose **PostgreSQL 15** (matches your project)
4. Double-click the installer
5. Click **"Next"**
6. Choose installation folder (default is fine) → Click **"Next"**
7. Choose components (default is fine) → Click **"Next"**
8. Choose data folder (default is fine) → Click **"Next"**
9. Enter a superuser password:
   - Username: `postgres` (default, don't change)
   - Password: `postgres` (for development only!)
   - Confirm password: `postgres`
   - Click **"Next"**
10. Enter port: `5432` (default) → Click **"Next"**
11. Choose locale (default is fine) → Click **"Next"**
12. Review and click **"Next"** then **"Finish"**
13. Uncheck "Launch Stack Builder" → Click **"Finish"**

### Step 4: Create the Database

1. Press **Windows key + R**
2. Type: `cmd` and press **Enter**
3. Type:

```
psql -U postgres
```

4. Press **Enter**
5. You'll be prompted for a password: Type `postgres` and press **Enter**
6. You should see a prompt: `postgres=#`
7. Copy and paste this command:

```sql
CREATE DATABASE smartbudget;
```

8. Press **Enter**
9. You should see: `CREATE DATABASE`
10. Type:

```
\q
```

11. Press **Enter** to exit

### Step 5: Load Database Schema

1. Press **Windows key + R**
2. Type: `cmd` and press **Enter**
3. Navigate to your project:

```
cd %USERPROFILE%\Projects\smartbudget\smartbudget
```

4. Press **Enter**
5. Type:

```
psql -U postgres -d smartbudget -f database/schema.sql
```

6. Press **Enter**
7. You should see SQL output (no errors)

### Step 6: Install Server Dependencies

1. In the same terminal, type:

```
cd server
```

2. Press **Enter**
3. Type:

```
npm install
```

4. Press **Enter**
5. Wait for installation (2-3 minutes)

### Step 7: Create `.env` File for Server

1. Open a text editor (Notepad or VS Code)
2. Create a new file with this content:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=smartbudget
JWT_SECRET=your-secret-key-change-this-in-production
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

3. Save the file as `.env` in the `server` folder
   - Example path: `C:\Users\Austin\Projects\smartbudget\smartbudget\server\.env`

### Step 8: Start the Server

1. In the terminal (still in `server` folder), type:

```
npm run dev
```

2. Press **Enter**
3. You should see:
   ```
   Server running on port 5000
   ```

### Step 9: Install Client Dependencies

1. Open a **new terminal** (don't close the server terminal)
2. Press **Windows key + R**
3. Type: `cmd` and press **Enter**
4. Type:

```
cd %USERPROFILE%\Projects\smartbudget\smartbudget\client
npm install
```

5. Press **Enter**
6. Wait for installation (2-3 minutes)

### Step 10: Start the Client

1. In the client terminal, type:

```
npm run dev
```

2. Press **Enter**
3. You should see:
   ```
   VITE v8.0.4 ready in X ms
   ➜  Local:   http://localhost:5173/
   ```

### Step 11: Open the Application

1. Open your browser
2. Go to: `http://localhost:5173`
3. You should see the SmartBudget login page

✅ **Application is running!**

---

## Verify Everything Works

### Test the Application

1. Go to `http://localhost:5173` in your browser
2. Click **"Sign Up"** or **"Register"**
3. Create a test account with:
   - Email: `test@example.com`
   - Password: `Test123!`
4. Click **"Register"**
5. You should be logged in and see the **Dashboard**

### Check if All Services Are Running

**Using Docker:**
```
docker ps
```
You should see containers for `db` and `server` running.

**Local Setup:**
- Server terminal shows: `Server running on port 5000`
- Client terminal shows: `VITE ready on http://localhost:5173`
- PostgreSQL is running (Windows Services → search "postgresql")

---

## Troubleshooting

### Problem: "Docker command not found"
**Solution:**
- Docker Desktop may not be running
- Click the Docker icon on your taskbar (bottom right)
- Wait for Docker to start (check for "Docker is starting...")
- Wait 1-2 minutes, then try again

### Problem: "Port 5432 already in use"
**Solution:**
- Another PostgreSQL instance is running
- Stop all PostgreSQL services (Windows Services → stop "postgresql-x64-15")
- Try again

### Problem: "Database connection failed"
**Solution (Docker):**
- Make sure `docker compose up` is still running
- Check that `DB_HOST=db` (not localhost)

**Solution (Local):**
- Verify PostgreSQL is running
- Check `.env` file has correct DB credentials
- Verify database exists: `psql -U postgres -l`

### Problem: "npm: command not found"
**Solution:**
- Node.js is not installed or not in PATH
- Restart your terminal/computer after installing Node.js
- Verify: `node --version` and `npm --version`

### Problem: "Cannot find module"
**Solution:**
- Run `npm install` in the folder (client or server)
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Problem: "Connection refused at localhost:5000"
**Solution:**
- Server is not running
- Go to server folder and run: `npm run dev`
- Check for error messages in the terminal

### Problem: "CORS error in browser console"
**Solution:**
- Make sure `CLIENT_ORIGIN=http://localhost:5173` in `.env`
- Restart the server after changing `.env`

---

## Running Everything Again (Next Time)

### Using Docker (Easiest):
```
docker compose up
```
Then in another terminal:
```
cd client
npm run dev
```

### Local Setup:
1. Terminal 1 (Server):
   ```
   cd server
   npm run dev
   ```

2. Terminal 2 (Client):
   ```
   cd client
   npm run dev
   ```

3. Browser: `http://localhost:5173`

---

## Quick Reference

| Component | Port | Command |
|-----------|------|---------|
| Database (PostgreSQL) | 5432 | `docker compose up` or PostgreSQL service |
| Server (API) | 5000 | `cd server && npm run dev` |
| Client (React) | 5173 | `cd client && npm run dev` |
| Browser | - | http://localhost:5173 |

---

## Need Help?

- **Docker issues?** Check Docker Desktop logs (⚙️ Settings → Troubleshoot)
- **Node issues?** Check if Node.js is installed: `node --version`
- **Database issues?** Try: `psql -U postgres -l` (lists databases)
- **Port conflicts?** Check what's using ports: `netstat -ano | findstr :5000`

---

Good luck! 🚀
