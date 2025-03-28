#!/usr/bin/env node

const { exec } = require('node:child_process');
const { promisify } = require('node:util');
const execAsync = promisify(exec);

// Common ports that might be used by the MCP server
const ports = [3000, 3001, 3002, 8080, 8081, 8082, 5173];

async function killPort(port) {
  try {
    // For macOS/Linux
    const { stdout } = await execAsync(`lsof -i :${port} -t`);
    if (stdout.trim()) {
      const pid = stdout.trim();
      await execAsync(`kill -9 ${pid}`);
      console.log(`Killed process on port ${port} (PID: ${pid})`);
    } else {
      console.log(`No process found on port ${port}`);
    }
  } catch (error) {
    if (error.message.includes('No such process')) {
      console.log(`No process found on port ${port}`);
    } else {
      console.error(`Error checking port ${port}:`, error.message);
    }
  }
}

async function killAllPorts() {
  console.log('Checking and killing processes on common ports...');
  
  for (const port of ports) {
    await killPort(port);
  }
  
  console.log('\nDone! All common ports have been checked.');
}

// Run the script
killAllPorts().catch(console.error); 