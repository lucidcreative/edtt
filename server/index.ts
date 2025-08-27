#!/usr/bin/env node
import { spawn } from 'child_process'

console.log('Starting Next.js development server...')

// Start Next.js development server
const nextProcess = spawn('npx', ['next', 'dev', '--port', '5000'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
})

nextProcess.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`)
  process.exit(code)
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  nextProcess.kill('SIGTERM')
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...')
  nextProcess.kill('SIGINT')
})