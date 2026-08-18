import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const directoriesToScan = ['app', 'components'];

function scanAndReplace(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanAndReplace(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const originalContent = content;

      // 1. Remove redundant dark: classes we might have added or exist
      content = content.replace(/dark:bg-slate-[0-9]{2,3}(?:\/[0-9]{2})?\s*/g, '');
      content = content.replace(/dark:border-slate-[0-9]{2,3}(?:\/[0-9]{2})?\s*/g, '');
      content = content.replace(/dark:text-slate-[0-9]{2,3}(?:\/[0-9]{2})?\s*/g, '');
      content = content.replace(/dark:text-white\s*/g, '');
      content = content.replace(/dark:hover:bg-slate-[0-9]{2,3}(?:\/[0-9]{2})?\s*/g, '');
      content = content.replace(/dark:hover:border-slate-[0-9]{2,3}(?:\/[0-9]{2})?\s*/g, '');
      content = content.replace(/dark:hover:text-white\s*/g, '');
      content = content.replace(/dark:bg-gray-[0-9]{2,3}(?:\/[0-9]{2})?\s*/g, '');
      content = content.replace(/dark:text-gray-[0-9]{2,3}(?:\/[0-9]{2})?\s*/g, '');

      // 2. Map light theme hardcoded classes to semantic variables
      // Text
      content = content.replace(/\btext-slate-900\b/g, 'text-foreground');
      content = content.replace(/\btext-slate-950\b/g, 'text-foreground');
      content = content.replace(/\btext-gray-900\b/g, 'text-foreground');
      content = content.replace(/\btext-slate-800\b/g, 'text-foreground');
      content = content.replace(/\btext-gray-800\b/g, 'text-foreground');
      content = content.replace(/\btext-slate-700\b/g, 'text-foreground');
      content = content.replace(/\btext-gray-700\b/g, 'text-foreground');
      
      content = content.replace(/\btext-slate-500\b/g, 'text-muted-foreground');
      content = content.replace(/\btext-gray-500\b/g, 'text-muted-foreground');
      content = content.replace(/\btext-slate-600\b/g, 'text-muted-foreground');
      content = content.replace(/\btext-gray-600\b/g, 'text-muted-foreground');
      content = content.replace(/\btext-slate-400\b/g, 'text-muted-foreground');
      content = content.replace(/\btext-gray-400\b/g, 'text-muted-foreground');

      // Backgrounds
      content = content.replace(/\bbg-white\b/g, 'bg-card');
      content = content.replace(/\bbg-white\/([0-9]{2,3})\b/g, 'bg-card/$1');

      content = content.replace(/\bbg-slate-50\b/g, 'bg-muted');
      content = content.replace(/\bbg-gray-50\b/g, 'bg-muted');
      content = content.replace(/\bbg-slate-100\b/g, 'bg-muted');
      content = content.replace(/\bbg-gray-100\b/g, 'bg-muted');
      content = content.replace(/\bbg-slate-200\b/g, 'bg-muted');
      content = content.replace(/\bbg-gray-200\b/g, 'bg-muted');

      // Hover states that cause glaring white rows
      content = content.replace(/\bhover:bg-slate-50\b/g, 'hover:bg-muted');
      content = content.replace(/\bhover:bg-gray-50\b/g, 'hover:bg-muted');
      content = content.replace(/\bhover:bg-blue-50\b/g, 'hover:bg-muted');

      // Colored Backgrounds, Borders, and Texts (Badges, Alerts) -> Append Dark Variant
      const colors = ['red', 'blue', 'green', 'emerald', 'indigo', 'purple', 'amber', 'rose', 'sky', 'yellow', 'orange'];
      colors.forEach(color => {
        // bg-color-50 -> bg-color-50 dark:bg-color-950/40
        const bgRegex = new RegExp(`\\bbg-${color}-50(?!\\/|\\s*dark:)`, 'g');
        content = content.replace(bgRegex, `bg-${color}-50 dark:bg-${color}-950/40`);
        
        // border-color-100/200 -> border-color-100 dark:border-color-900/50
        const borderRegex = new RegExp(`\\bborder-${color}-(100|200)(?!\\/|\\s*dark:)`, 'g');
        content = content.replace(borderRegex, `border-${color}-$1 dark:border-${color}-900/50`);
        
        // text-color-600/700/800 -> text-color-700 dark:text-color-300
        const textRegex = new RegExp(`\\btext-${color}-(600|700|800)(?!\\/|\\s*dark:)`, 'g');
        content = content.replace(textRegex, `text-${color}-$1 dark:text-${color}-300`);
      });
      content = content.replace(/\bbg-gray-100\b/g, 'bg-muted');
      content = content.replace(/\bbg-slate-200\b/g, 'bg-muted');
      content = content.replace(/\bbg-gray-200\b/g, 'bg-muted');

      // Borders
      content = content.replace(/\bborder-slate-200\b/g, 'border-border');
      content = content.replace(/\bborder-gray-200\b/g, 'border-border');
      content = content.replace(/\bborder-slate-100\b/g, 'border-border');
      content = content.replace(/\bborder-slate-300\b/g, 'border-border');
      // Keep opacity if exists
      content = content.replace(/\bborder-slate-200\/([0-9]{2,3})\b/g, 'border-border/$1');

      // Hover states
      content = content.replace(/\bhover:bg-slate-50\b/g, 'hover:bg-muted');
      content = content.replace(/\bhover:bg-slate-100\b/g, 'hover:bg-muted/80');
      content = content.replace(/\bhover:border-slate-300\b/g, 'hover:border-border/80');
      content = content.replace(/\bhover:text-slate-900\b/g, 'hover:text-foreground');

      // Clean up extra spaces inside classes without breaking newlines
      content = content.replace(/ {2,}/g, ' ');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of directoriesToScan) {
  const fullDirPath = path.join(rootDir, dir);
  if (fs.existsSync(fullDirPath)) {
    console.log(`Scanning ${fullDirPath}...`);
    scanAndReplace(fullDirPath);
  }
}

console.log('Done refactoring semantic tokens!');
