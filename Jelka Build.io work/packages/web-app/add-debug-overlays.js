#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of components that need debug overlays
const componentsToUpdate = [
  // Communications Features
  'src/features/communications/components/AddChildModal.tsx',
  'src/features/communications/components/ChildDetailView.tsx',
  'src/features/communications/components/Events.tsx',
  'src/features/communications/components/ParentDashboard.tsx',
  'src/features/communications/components/ParentProfileModal.tsx',
  'src/features/communications/components/ParentStats.tsx',
  'src/features/communications/components/PickupRequestModal.tsx',
  'src/features/communications/components/SickReportModal.tsx',
  
  // Klassenbuch Features
  'src/features/klassenbuch/components/AddExcuseModal.tsx',
  'src/features/klassenbuch/components/ExcuseEditModal.tsx',
  'src/features/klassenbuch/components/KlassenbuchApp.tsx',
  'src/features/klassenbuch/components/KlassenbuchAttendanceModal.tsx',
  'src/features/klassenbuch/components/KlassenbuchHeader.tsx',
  'src/features/klassenbuch/components/KlassenbuchLiveView.tsx',
  'src/features/klassenbuch/components/KlassenbuchStatisticsView.tsx',
  
  // Lessons Features
  'src/features/lessons/components/LessonSchedule.tsx',
  
  // Reports Features
  'src/features/reports/components/AvailableReports.tsx',
  'src/features/reports/components/ExternalAccessNotice.tsx',
  'src/features/reports/components/ExternalDashboard.tsx',
  'src/features/reports/components/ExternalStats.tsx',
  
  // Task Management Features
  'src/features/task-management/components/AddTaskDialog.tsx',
  'src/features/task-management/components/TaskManagement.tsx',
  
  // User Management Features
  'src/features/user-management/components/AdminActions.tsx',
  'src/features/user-management/components/AdminDashboard.tsx',
  'src/features/user-management/components/SystemStats.tsx',
  
  // Core Components
  'src/components/AddTaskDialog.tsx',
  'src/components/AttendanceMatrix.tsx',
  'src/components/Header.tsx',
  'src/components/Infoboard.tsx',
  'src/components/MissingStaff.tsx',
  'src/components/Navigation.tsx',
  'src/components/TodosPlaceholder.tsx',
  'src/components/Veranstaltungen.tsx',
  'src/components/AuthStatus.jsx',
  'src/components/LoadingScreen.jsx',
  'src/components/PWAInstallBanner.jsx',
  'src/components/PWANotifications.jsx',
  'src/components/Settings.jsx',
  
  // Fix partial implementation
  'src/app/dashboard/teacher.tsx'
];

function calculateRelativePath(filePath) {
  const depth = filePath.split('/').length - 2; // subtract 'src' and filename
  return '../'.repeat(depth) + 'debug';
}

function extractComponentName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function addDebugOverlay(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const componentName = extractComponentName(filePath);
    const debugImportPath = calculateRelativePath(filePath);
    
    // Check if already has DebugOverlay import
    if (content.includes('DebugOverlay')) {
      console.log(`⚠️  Already has DebugOverlay: ${filePath}`);
      return false;
    }

    // Add import after the last import statement
    const importRegex = /import.*from.*['"];?\s*$/gm;
    const imports = content.match(importRegex);
    
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      const debugImport = `\nimport { DebugOverlay } from '${debugImportPath}';`;
      content = content.slice(0, insertIndex) + debugImport + content.slice(insertIndex);
    } else {
      // No imports found, add at the beginning
      const debugImport = `import { DebugOverlay } from '${debugImportPath}';\n\n`;
      content = debugImport + content;
    }

    // Find the main return statement and wrap it
    // Look for patterns like "return (<JSX>..." or "return \n  <JSX>..."
    const returnRegex = /return\s*(\n\s*)?(\(|\s*<)/;
    const returnMatch = content.match(returnRegex);
    
    if (!returnMatch) {
      console.log(`❌ Could not find return statement in: ${filePath}`);
      return false;
    }

    // Find the JSX content to wrap
    let returnStart = content.indexOf(returnMatch[0]);
    let returnContent = '';
    let openParens = 0;
    let openAngleBrackets = 0;
    let i = returnStart + returnMatch[0].length;
    
    // Handle opening parenthesis or angle bracket
    if (returnMatch[2] === '(') {
      openParens = 1;
      i--; // Back up to include the opening paren
    } else {
      // Direct JSX, find the opening tag
      while (i < content.length && content[i] !== '<') i++;
      openAngleBrackets = 1;
      i--; // Back up to include the opening bracket
    }
    
    let returnEnd = i;
    
    // Find the matching closing bracket/paren
    while (i < content.length && (openParens > 0 || openAngleBrackets > 0)) {
      const char = content[i];
      
      if (char === '(') openParens++;
      else if (char === ')') openParens--;
      else if (char === '<') {
        // Check if it's a closing tag
        if (content[i + 1] === '/') {
          openAngleBrackets--;
        } else if (content[i - 1] !== '=' && !content.slice(i - 10, i).includes('=')) {
          openAngleBrackets++;
        }
      }
      
      i++;
      returnEnd = i;
    }
    
    // Extract the JSX content
    const beforeReturn = content.slice(0, returnStart);
    const returnPrefix = content.slice(returnStart, returnStart + returnMatch[0].length);
    returnContent = content.slice(returnStart + returnMatch[0].length, returnEnd);
    const afterReturn = content.slice(returnEnd);
    
    // Clean up the return content (remove outer parens if present)
    let cleanedContent = returnContent.trim();
    if (cleanedContent.startsWith('(') && cleanedContent.endsWith(')')) {
      cleanedContent = cleanedContent.slice(1, -1).trim();
    }
    
    // Create the new wrapped content
    const wrappedContent = `(\n    <DebugOverlay name="${componentName}">\n      ${cleanedContent.split('\n').join('\n      ')}\n    </DebugOverlay>\n  )`;
    
    // Reconstruct the file
    const newContent = beforeReturn + returnPrefix + wrappedContent + afterReturn;
    
    // Write the updated content
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Added DebugOverlay to: ${filePath}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting bulk debug overlay addition...\n');
  
  let successCount = 0;
  let totalCount = componentsToUpdate.length;
  
  componentsToUpdate.forEach(filePath => {
    if (addDebugOverlay(filePath)) {
      successCount++;
    }
  });
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Successfully updated: ${successCount}/${totalCount} files`);
  console.log(`❌ Failed/Skipped: ${totalCount - successCount}/${totalCount} files`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All components successfully updated with debug overlays!');
  } else {
    console.log('\n⚠️  Some files need manual attention. Check the output above for details.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { addDebugOverlay, calculateRelativePath, extractComponentName };
