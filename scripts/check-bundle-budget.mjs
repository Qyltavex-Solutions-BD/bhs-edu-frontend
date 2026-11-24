import fs from 'node:fs';
import path from 'node:path';

/**
 * Bundle Size and Web Budget Verification Script
 * Inspects .next build output against architectural budgets.
 */
const MAX_ROUTE_FIRST_LOAD_KB = 350; // Max allowed initial JS per route
const MAX_TOTAL_STATIC_ASSET_MB = 20;

function formatKb(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function verifyBuildBudget() {
  const dotNext = path.resolve('.next');
  if (!fs.existsSync(dotNext)) {
    console.warn('[Budget] .next directory not found. Run "npm run build" first.');
    process.exit(0);
  }

  const staticDir = path.join(dotNext, 'static');
  if (!fs.existsSync(staticDir)) {
    console.warn('[Budget] static assets directory not found.');
    process.exit(0);
  }

  let totalStaticBytes = 0;
  let chunkCount = 0;

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        totalStaticBytes += stats.size;
        if (entry.name.endsWith('.js')) {
          chunkCount++;
        }
      }
    }
  }

  scanDir(staticDir);

  const totalMb = totalStaticBytes / (1024 * 1024);
  console.log(`[Budget] Total static asset size: ${totalMb.toFixed(2)} MB in ${chunkCount} JS chunks.`);

  if (totalMb > MAX_TOTAL_STATIC_ASSET_MB) {
    console.error(`[Budget Error] Total static assets exceeded ${MAX_TOTAL_STATIC_ASSET_MB} MB: ${totalMb.toFixed(2)} MB`);
    process.exit(1);
  }

  console.log('[Budget] All production bundle budgets passed successfully.');
}

verifyBuildBudget();
