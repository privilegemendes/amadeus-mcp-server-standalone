#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { server, amadeus } from './index.js';

// Load environment variables
dotenv.config();

// Start the server
async function main() {
  // Check for Amadeus credentials
  if (!amadeus) {
    console.error('Error: Amadeus API client could not be initialized. Check your environment variables.');
    process.exit(1);
  }

  // Set up Express app
  const app = express();
  
  // Configure CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from ${origin}`;
        return callback(new Error(msg), false);
      }
      
      return callback(null, true);
    }
  }));
  
  app.use(express.json());

  const PORT = process.env.PORT || 3000;
  
  // Store active transports
  const activeTransports = new Map();

  // SSE endpoint
  app.get('/sse', async (req, res) => {
    console.error('New SSE connection requested');
    
    // Generate a unique ID for this connection
    const connectionId = Date.now().toString();
    
    const transport = new SSEServerTransport('/messages', res);
    activeTransports.set(connectionId, transport);
    
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    
    res.flushHeaders();
    
    // Send the connection ID to the client
    res.write(`data: ${JSON.stringify({ connectionId })}\n\n`);
    
    await server.connect(transport);
    
    req.on('close', () => {
      console.error(`SSE connection ${connectionId} closed`);
      activeTransports.delete(connectionId);
    });
  });

  // Handle client-to-server messages
  app.post('/messages', async (req, res) => {
    const connectionId = req.query.connectionId as string;
    const transport = activeTransports.get(connectionId);
    
    if (!transport) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    await transport.handlePostMessage(req, res);
  });

  // Status endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok',
      connections: activeTransports.size,
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.error(`Amadeus Flight MCP Server running on port ${PORT}`);
    console.error(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.error(`Amadeus API client initialized: ${!!amadeus}`);
  });
}

main().catch((error: unknown) => {
  console.error('Fatal error:', error);
  process.exit(1);
});