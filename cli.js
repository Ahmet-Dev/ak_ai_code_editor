#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createProject(projectName) {
  console.log(`Creating AI Code Editor project: ${projectName}...`);

  // Create project directory
  fs.mkdirSync(projectName);
  process.chdir(projectName);

  // Initialize package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    type: "module",
    scripts: {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      "preview": "vite preview"
    }
  };

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install react@^18.3.1 react-dom@^18.3.1 lucide-react@^0.344.0', { stdio: 'inherit' });
  execSync('npm install -D @types/react@^18.3.5 @types/react-dom@^18.3.0 @vitejs/plugin-react@^4.3.1 autoprefixer@^10.4.18 eslint@^9.9.1 eslint-plugin-react-hooks@^5.1.0-rc.0 eslint-plugin-react-refresh@^0.4.11 postcss@^8.4.35 tailwindcss@^3.4.1 typescript@^5.5.3 vite@^5.4.2', { stdio: 'inherit' });

  // Copy template files
  const templateDir = path.join(__dirname, 'template');
  copyDir(templateDir, process.cwd());

  console.log('\nSuccess! Created', projectName, 'at', process.cwd());
  console.log('\nInside that directory, you can run several commands:');
  console.log('\n  npm run dev');
  console.log('    Starts the development server.');
  console.log('\n  npm run build');
  console.log('    Bundles the app into static files for production.');
  console.log('\n  npm run preview');
  console.log('    Previews the built app before deployment.');
  console.log('\nWe suggest that you begin by typing:');
  console.log('\n  cd', projectName);
  console.log('  npm run dev');
  console.log('\nHappy coding!');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Get project name from command line arguments
const projectName = process.argv[2];

if (!projectName) {
  console.error('Please specify the project name:');
  console.error('  npx create-ai-code-editor my-app');
  process.exit(1);
}

createProject(projectName);