#!/usr/bin/env node

/**
 * Script para facilitar el desarrollo
 * 
 * Uso:
 *   yarn dev-api    -> Desarrollo con API (sin prefetch)
 *   yarn dev-cache  -> Desarrollo con cache local (requiere prebuild)
 *   yarn dev        -> Desarrollo automático (detecta config)
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(__dirname, '.cache');
const hasCacheFiles = existsSync(cacheDir) && 
  existsSync(join(cacheDir, 'documentos.json')) &&
  existsSync(join(cacheDir, 'personajes.json'));

const command = process.argv[2] || 'auto';
// const isDev = !['build', 'production'].includes(command);

console.log('\n🚀 Historia del Internet - Modo Desarrollo\n');

if (command === 'api' || (command === 'auto' && !hasCacheFiles)) {
  console.log('📡 Usando API de WordPress en tiempo real');
  console.log('   Los cambios en WordPress se verán inmediatamente\n');
  runAstro('dev');
} else if (command === 'cache' || (command === 'auto' && hasCacheFiles)) {
  console.log('💾 Usando cache local');
  console.log('   Para actualizaciones: yarn prebuild\n');
  runAstro('dev');
} else if (command === 'build') {
  console.log('🏗️  Buildando para producción...\n');
  runAstro('build');
} else {
  console.log(`❌ Comando desconocido: ${command}`);
  console.log(`   Usa: yarn dev-api, yarn dev-cache, o yarn dev\n`);
  process.exit(1);
}

function runAstro(mode) {
  const astro = spawn('astro', [mode], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  astro.on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

  astro.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Listo!\n');
    } else {
      process.exit(code);
    }
  });
}
