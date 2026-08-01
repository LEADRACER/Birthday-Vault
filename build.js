#!/usr/bin/env node
// Build script for Birthday:Vault - replaces placeholders in config.js with env vars

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.js');

const name = process.env.BV_NAME || '';
const birthday = process.env.BV_BIRTHDAY || '';

let content = fs.readFileSync(configPath, 'utf8');
content = content.replace('__BV_NAME__', name);
content = content.replace('__BV_BIRTHDAY__', birthday);

fs.writeFileSync(configPath, content);

console.log('Build complete: config.js updated with env vars');
console.log(`  BV_NAME: "${name}"`);
console.log(`  BV_BIRTHDAY: "${birthday}"`);