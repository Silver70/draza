#!/usr/bin/env node

/**
 * Script to migrate API utility files from axios to centralized apiClient
 *
 * This script will:
 * 1. Replace `import axios from 'redaxios'` with `import apiClient from '~/lib/apiClient'`
 * 2. Remove the API_BASE_URL constant and comments
 * 3. Replace `axios.get/post/put/delete` with `apiClient.get/post/put/delete`
 * 4. Remove `${API_BASE_URL}` prefix from API calls
 */

const fs = require('fs');
const path = require('path');

const utilsDir = path.join(__dirname, 'src', 'utils');

// Files to migrate
const filesToMigrate = [
  'products.ts',
  'orders.ts',
  'analytics.ts',
  'campaigns.ts',
  'taxSettings.ts',
  'cart.ts',
  'tax.ts',
  'orderSettings.ts',
  'discounts.ts',
  'customers.ts'
];

function migrateFile(filePath) {
  console.log(`\nMigrating ${path.basename(filePath)}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = false;

  // 1. Replace axios import
  if (content.includes("import axios from 'redaxios'")) {
    content = content.replace(
      "import axios from 'redaxios'",
      "import apiClient from '~/lib/apiClient'"
    );
    changesMade = true;
    console.log('  ✓ Replaced axios import with apiClient');
  }

  // 2. Remove API_BASE_URL constant and related comment
  const apiBaseUrlPattern = /\/\/ TODO: Update this to your actual API URL\s*\nconst API_BASE_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\s*\n/g;
  if (apiBaseUrlPattern.test(content)) {
    content = content.replace(apiBaseUrlPattern, '');
    changesMade = true;
    console.log('  ✓ Removed API_BASE_URL constant');
  }

  // Also try without the comment
  const apiBaseUrlPatternNoComment = /const API_BASE_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\s*\n/g;
  if (apiBaseUrlPatternNoComment.test(content)) {
    content = content.replace(apiBaseUrlPatternNoComment, '');
    changesMade = true;
    console.log('  ✓ Removed API_BASE_URL constant');
  }

  // 3. Replace axios.get/post/put/delete with apiClient
  const axiosMethodPattern = /\baxios\.(get|post|put|delete|patch)/g;
  const axiosMatches = content.match(axiosMethodPattern);
  if (axiosMatches) {
    content = content.replace(axiosMethodPattern, 'apiClient.$1');
    changesMade = true;
    console.log(`  ✓ Replaced ${axiosMatches.length} axios method call(s) with apiClient`);
  }

  // 4. Remove ${API_BASE_URL} from API calls
  // Pattern 1: `${API_BASE_URL}/path`
  const urlPattern1 = /`\$\{API_BASE_URL\}(\/[^`]*)`/g;
  const urlMatches1 = content.match(urlPattern1);
  if (urlMatches1) {
    content = content.replace(urlPattern1, '`$1`');
    changesMade = true;
    console.log(`  ✓ Removed API_BASE_URL prefix from ${urlMatches1.length} API call(s)`);
  }

  // Pattern 2: "${API_BASE_URL}/path"
  const urlPattern2 = /"\$\{API_BASE_URL\}(\/[^"]*)"/g;
  const urlMatches2 = content.match(urlPattern2);
  if (urlMatches2) {
    content = content.replace(urlPattern2, '"$1"');
    changesMade = true;
    console.log(`  ✓ Removed API_BASE_URL prefix from ${urlMatches2.length} API call(s)`);
  }

  // Pattern 3: '${API_BASE_URL}/path'
  const urlPattern3 = /'\$\{API_BASE_URL\}(\/[^']*)'/g;
  const urlMatches3 = content.match(urlPattern3);
  if (urlMatches3) {
    content = content.replace(urlPattern3, "'$1'");
    changesMade = true;
    console.log(`  ✓ Removed API_BASE_URL prefix from ${urlMatches3.length} API call(s)`);
  }

  if (changesMade) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Successfully migrated ${path.basename(filePath)}`);
    return true;
  } else {
    console.log(`  ℹ️  No changes needed for ${path.basename(filePath)}`);
    return false;
  }
}

// Main execution
console.log('='.repeat(60));
console.log('API Client Migration Script');
console.log('='.repeat(60));
console.log(`\nUtils directory: ${utilsDir}\n`);

let totalMigrated = 0;
let totalSkipped = 0;
let totalErrors = 0;

filesToMigrate.forEach(fileName => {
  const filePath = path.join(utilsDir, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`\n⚠️  File not found: ${fileName}`);
    totalSkipped++;
    return;
  }

  try {
    const migrated = migrateFile(filePath);
    if (migrated) {
      totalMigrated++;
    } else {
      totalSkipped++;
    }
  } catch (error) {
    console.error(`\n❌ Error migrating ${fileName}:`, error.message);
    totalErrors++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('Migration Summary');
console.log('='.repeat(60));
console.log(`✅ Successfully migrated: ${totalMigrated} file(s)`);
console.log(`ℹ️  Skipped (no changes): ${totalSkipped} file(s)`);
console.log(`❌ Errors: ${totalErrors} file(s)`);
console.log('='.repeat(60));

if (totalMigrated > 0) {
  console.log('\n✨ Migration complete! All API calls now use the centralized apiClient.');
  console.log('\n📝 Next steps:');
  console.log('   1. Review the changes with: git diff src/utils/');
  console.log('   2. Test your API calls to ensure they work correctly');
  console.log('   3. Run TypeScript check: bunx tsc --noEmit');
}

process.exit(totalErrors > 0 ? 1 : 0);
