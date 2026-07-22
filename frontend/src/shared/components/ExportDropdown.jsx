import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiFileText, FiList, FiPrinter } from 'react-icons/fi';

export default function ExportDropdown({ onExportPdf, onExportCsv, onPrint, showPrint, title = "Export" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    if (action) action();
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 text-sm font-semibold transition-all"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FiDownload />
        {title}
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden print:overflow-visible print:border-none print:shadow-none animate-fade-in-up">
          <div className="p-1.5 flex flex-col gap-1">
            <button type="button"
              onClick={() => handleAction(onExportPdf)}
              className="inline-flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
            >
              <FiFileText className="text-gray-400" />
              Export PDF
            </button>
            <button type="button"
              onClick={() => handleAction(onExportCsv)}
              className="inline-flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
            >
              <FiList className="text-gray-400" />
              Export CSV
            </button>
            {showPrint && onPrint && (
              <button type="button"
                onClick={() => handleAction(onPrint)}
                className="inline-flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
              >
                <FiPrinter className="text-gray-400" />
                Print Report
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
