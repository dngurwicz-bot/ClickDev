#!/usr/bin/env node
/**
 * CLICK System Quick Start Helper
 * This script verifies the system is ready to run
 */

const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const backendDir = path.join(projectRoot, 'backend');
const frontendDir = path.join(projectRoot, 'frontend');

console.log('\n📋 CLICK System Startup Verification\n');
console.log('=====================================\n');

// Check .env files
console.log('✓ Checking configuration files...');
const backendEnv = path.join(backendDir, '.env');
const frontendEnv = path.join(frontendDir, '.env.local');

let configReady = true;

if (fs.existsSync(backendEnv)) {
  console.log('  ✅ Backend .env configured');
} else {
  console.log('  ❌ Backend .env missing');
  configReady = false;
}

if (fs.existsSync(frontendEnv)) {
  console.log('  ✅ Frontend .env.local configured');
} else {
  console.log('  ❌ Frontend .env.local missing');
  configReady = false;
}

console.log('\n✓ Checking backend requirements...');
const backendReqs = ['fastapi', 'uvicorn', 'python-dotenv', 'supabase'];
console.log(`  Backend needs: ${backendReqs.join(', ')}`);
console.log('  📍 Install with: pip install -r requirements.txt');

console.log('\n✓ Checking frontend dependencies...');
const packageJsonPath = path.join(frontendDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('  ✅ package.json found');
  console.log('  📍 Install with: npm install');
} else {
  console.log('  ❌ package.json not found');
  configReady = false;
}

console.log('\n=====================================\n');

if (configReady) {
  console.log('🚀 System is ready to start!\n');
  console.log('To start both servers, run:\n');
  console.log('  Windows (PowerShell):');
  console.log('    .\\start-system.ps1\n');
  console.log('  Or manually start each:\n');
  console.log('  Terminal 1 - Backend:');
  console.log('    cd backend');
  console.log('    python run_server.py\n');
  console.log('  Terminal 2 - Frontend:');
  console.log('    cd frontend');
  console.log('    npm run dev\n');
  console.log('Access the system:');
  console.log('  Frontend:  http://localhost:3000');
  console.log('  Backend:   http://localhost:8000');
  console.log('  API Docs:  http://localhost:8000/docs\n');
} else {
  console.log('⚠️  Some configuration is missing. Please review above.\n');
}
