const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'shared', 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add print event listeners for tables to toggle all rows on print
  if (content.includes('paginatedTasks')) {
    if (!content.includes('const [isPrinting, setIsPrinting] = useState(false);')) {
      content = content.replace(
        'const itemsPerPage = 7;',
        `const itemsPerPage = 7;\n  const [isPrinting, setIsPrinting] = useState(false);\n  useEffect(() => {\n    const handleBeforePrint = () => setIsPrinting(true);\n    const handleAfterPrint = () => setIsPrinting(false);\n    window.addEventListener('beforeprint', handleBeforePrint);\n    window.addEventListener('afterprint', handleAfterPrint);\n    return () => {\n      window.removeEventListener('beforeprint', handleBeforePrint);\n      window.removeEventListener('afterprint', handleAfterPrint);\n    };\n  }, []);`
      );
      changed = true;
    }

    if (content.includes('paginatedTasks.map')) {
      content = content.replace(/paginatedTasks\.map/g, '(isPrinting ? filteredTasks : paginatedTasks).map');
      changed = true;
    }
  }

  // Fix overflow classes so they don't break print
  if (content.includes('overflow-hidden') || content.includes('overflow-x-auto')) {
    content = content.replace(/overflow-hidden(?!\s*print:overflow-visible)/g, 'overflow-hidden print:overflow-visible print:border-none print:shadow-none');
    content = content.replace(/overflow-x-auto(?!\s*print:overflow-visible)/g, 'overflow-x-auto print:overflow-visible print:overflow-x-visible');
    changed = true;
  }

  // Fix hidden print mobile table issue
  if (content.includes('print:grid') && content.includes('md:hidden')) {
      content = content.replace(/md:hidden print:grid/g, 'md:hidden print:hidden');
      changed = true;
  }
  
  if (content.includes('hidden md:block overflow-x-auto')) {
      content = content.replace(/hidden md:block overflow-x-auto/g, 'hidden md:block print:block overflow-x-auto print:w-full');
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
