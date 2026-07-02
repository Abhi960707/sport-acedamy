import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const escapeCsvValue = (value) => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

export const downloadCsv = (filename, columns, rows) => {
  const headerRow = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const bodyRows = rows.map((row) =>
    columns.map((column) => escapeCsvValue(typeof column.value === 'function' ? column.value(row) : row[column.value])).join(',')
  );

  const csvContent = [headerRow, ...bodyRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadPdf = (filename, columns, rows, title = 'Report') => {
  const doc = new jsPDF('landscape'); // Landscape is usually better for reports with many columns
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  const tableColumn = columns.map(col => col.label);
  const tableRows = rows.map(row => 
    columns.map(column => typeof column.value === 'function' ? column.value(row) : String(row[column.value] ?? ''))
  );

  autoTable(doc, {
    startY: 30,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] }, // Matches Tailwind blue-600
    styles: { fontSize: 8 },
  });

  doc.save(filename);
};