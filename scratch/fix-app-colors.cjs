const fs = require('fs');
const path = require('path');

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else if (file.endsWith('.html')) {
      const content = fs.readFileSync(file, 'utf8');
      let modified = content;
      
      // Step 1: Replace existing dark:text-muted-foreground with dark:text-gray-400
      modified = modified.replace(/dark:text-muted-foreground/g, 'dark:text-gray-400');
      
      // Step 2: Replace text-muted-foreground with text-gray-500 dark:text-gray-400 
      // Ensure we don't double up on dark:text-gray-400 if it was already there (from step 1).
      modified = modified.replace(/text-muted-foreground(\s+dark:text-gray-400)?/g, 'text-gray-500 dark:text-gray-400');
      
      // Step 3: Ensure text-foreground without a dark:text- variant gets a default one
      modified = modified.replace(/text-foreground/g, (match, offset, string) => {
        // If there's already a dark:text- class in this specific class attribute string, leave it.
        // Or simply replace text-foreground with text-gray-900 (because text-foreground IS black in light mode anyway).
        // Wait, if it has dark:text-gray-100 right next to it, replacing it with text-gray-900 is safe: 
        // e.g. text-gray-900 dark:text-gray-100
        return 'text-gray-900';
      });

      // Remove double spaces if any
      modified = modified.replace(/  +/g, ' ');

      if (content !== modified) {
        fs.writeFileSync(file, modified, 'utf8');
        console.log('Fixed', file);
      }
    }
  });
}

walk('registry/apps');
