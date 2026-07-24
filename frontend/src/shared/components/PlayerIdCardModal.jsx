import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiPrinter, FiDownload, FiRotateCw, FiX, FiShield, FiPhone, FiGlobe, FiMail, FiMapPin } from 'react-icons/fi';
import { API_BASE } from '../../api';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
  if (url.includes('/uploads/')) {
    const filename = url.split('/uploads/')[1];
    return `${API_BASE}/uploads/${filename}`;
  }
  return url;
};

export default function PlayerIdCardModal({ player, academy, onClose, onPrint }) {
  const [viewMode, setViewMode] = useState('flip'); // 'flip', 'both', 'front', 'back'
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);

  useEffect(() => {
    if (player) {
      const qrPayload = JSON.stringify({
        id: player.playerId || player._id,
        name: player.fullName,
        sport: player.sportChosen,
        contact: player.contactNumber
      });
      QRCode.toDataURL(qrPayload, { margin: 1, width: 140 })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [player]);

  if (!player) return null;

  // Handle PDF Export
  const handleDownloadPdf = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    setDownloadingPdf(true);

    try {
      const canvasOpts = {
        scale: 3, // 300 DPI quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      };

      const frontCanvas = await html2canvas(frontCardRef.current, canvasOpts);
      const backCanvas = await html2canvas(backCardRef.current, canvasOpts);

      const frontImg = frontCanvas.toDataURL('image/png');
      const backImg = backCanvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.60, 53.98]
      });

      // Front Page
      pdf.addImage(frontImg, 'PNG', 0, 0, 85.60, 53.98);

      // Back Page
      pdf.addPage([85.60, 53.98], 'landscape');
      pdf.addImage(backImg, 'PNG', 0, 0, 85.60, 53.98);

      pdf.save(`Player_ID_Card_${player.playerId || player.fullName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto print:hidden">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-3xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xl shadow-inner">
              🪪
            </span>
            <div>
              <h3 className="text-lg font-bold tracking-wide text-white">
                Player ID Card
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {player.fullName} ({player.playerId}) • Standard CR80 PVC Specs
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="px-6 py-3 bg-slate-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setViewMode('flip'); setIsFlipped(false); }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'flip' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiRotateCw />
              <span>3D Flip Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'both' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Both Sides
            </button>
            <button
              type="button"
              onClick={() => setViewMode('front')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'front' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Front Only
            </button>
            <button
              type="button"
              onClick={() => setViewMode('back')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'back' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Back Only
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-gray-200 hover:bg-slate-800 hover:text-white rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" /> : <FiDownload />}
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onPrint) onPrint(player);
                else window.print();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer"
            >
              <FiPrinter />
              <span>Print Card</span>
            </button>
          </div>
        </div>

        {/* Display Area */}
        <div className="p-8 bg-slate-100/75 flex-1 flex flex-col items-center justify-center overflow-y-auto min-h-[380px]">
          
          {/* 3D FLIP MODE */}
          {viewMode === 'flip' && (
            <div className="flex flex-col items-center gap-6">
              <div className="group perspective cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`relative w-[428px] h-[270px] transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  <div className="absolute inset-0 backface-hidden">
                    <FrontCardComponent 
                      player={player} 
                      academy={academy} 
                      qrCodeDataUrl={qrCodeDataUrl}
                      ref={frontCardRef}
                    />
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <BackCardComponent 
                      player={player} 
                      academy={academy} 
                      ref={backCardRef}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-xs font-semibold rounded-full shadow-md border border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
              >
                <FiRotateCw className={`text-sm transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
                <span>Click Card or Here to Flip ({isFlipped ? 'Showing Back' : 'Showing Front'})</span>
              </button>
            </div>
          )}

          {/* BOTH SIDES MODE */}
          {viewMode === 'both' && (
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Front Side</span>
                <FrontCardComponent 
                  player={player} 
                  academy={academy} 
                  qrCodeDataUrl={qrCodeDataUrl}
                  ref={frontCardRef}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Back Side</span>
                <BackCardComponent 
                  player={player} 
                  academy={academy} 
                  ref={backCardRef}
                />
              </div>
            </div>
          )}

          {/* FRONT ONLY MODE */}
          {viewMode === 'front' && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Front Side</span>
              <FrontCardComponent 
                player={player} 
                academy={academy} 
                qrCodeDataUrl={qrCodeDataUrl}
                ref={frontCardRef}
              />
            </div>
          )}

          {/* BACK ONLY MODE */}
          {viewMode === 'back' && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Back Side</span>
              <BackCardComponent 
                player={player} 
                academy={academy} 
                ref={backCardRef}
              />
            </div>
          )}

          {/* Off-screen renders for PDF generator */}
          <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0">
            <FrontCardComponent 
              player={player} 
              academy={academy} 
              qrCodeDataUrl={qrCodeDataUrl}
              ref={frontCardRef}
            />
            <BackCardComponent 
              player={player} 
              academy={academy} 
              ref={backCardRef}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <FiShield className="text-blue-600" />
            Standard Light & Minimal PVC Player ID Card (CR80 Specs)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}

/* ==========================================
   FRONT CARD COMPONENT (Light Premium Theme)
========================================== */
const FrontCardComponent = React.forwardRef(({ player, academy, qrCodeDataUrl }, ref) => {
  let sportName = player.sportChosen || '';
  if (sportName.includes('(')) {
    const match = sportName.match(/(.+?)\s*\((.+?)\)/);
    if (match) sportName = match[1].trim();
  }

  const academyName = academy?.academyName || 'SPORT ACADEMY';
  const academyLogo = academy?.logo || '';
  const academyAddress = academy?.address || 'Solapur, Maharashtra, India';

  const batch = player.batch || 'Regular Batch';
  const regNumber = player.registrationNumber || player.playerId || 'REG-001';
  const issueDate = player.joiningDate || new Date().toISOString().split('T')[0];
  const serialNumber = `SN-${player.playerId || '001'}`;

  return (
    <div 
      ref={ref}
      className="w-[428px] h-[270px] rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col justify-between relative select-none font-sans"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Light Soft Navy Top Header Banner */}
      <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between border-b-2 border-amber-400 relative z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          {academyLogo ? (
            <img src={getImageUrl(academyLogo)} alt="Logo" className="w-6 h-6 object-contain bg-white rounded-md p-0.5 shadow-xs shrink-0" />
          ) : (
            <div className="w-6 h-6 bg-amber-400 text-slate-950 rounded-md flex items-center justify-center font-bold text-xs shrink-0">
              🏆
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[10px] font-bold uppercase tracking-wider truncate text-amber-300 leading-tight">
              {academyName}
            </h1>
            <p className="text-[7px] text-slate-300 font-medium truncate leading-none mt-0.5">{academyAddress}</p>
          </div>
        </div>

        {/* Header Right: OFFICIAL PLAYER ID Tag */}
        <div className="bg-blue-600/30 text-amber-300 border border-amber-400/40 text-[6.5px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0">
          OFFICIAL PLAYER ID
        </div>
      </div>

      {/* Main Body Layout */}
      <div className="px-3 py-1.5 flex items-start justify-between gap-2.5 relative z-10 flex-1 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 overflow-hidden">
        
        {/* Photo Box */}
        <div className="flex flex-col items-center shrink-0 pt-0.5">
          <div className="w-[76px] h-[92px] rounded-xl border border-slate-300 bg-slate-100 overflow-hidden shadow-sm relative">
            {player.playerImage ? (
              <img src={getImageUrl(player.playerImage)} alt={player.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl bg-slate-200">
                👤
              </div>
            )}
          </div>
        </div>

        {/* Player Information Matrix */}
        <div className="flex-1 min-w-0 pt-0.5 space-y-0.5 leading-tight">
          {/* Player Name Header */}
          <div className="border-b border-slate-200 pb-0.5">
            <h2 className="text-[11px] font-bold text-slate-800 truncate uppercase tracking-tight leading-tight">
              {player.fullName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 text-[7.5px] font-medium text-slate-600 leading-none">
              <span className="text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200 font-mono font-semibold">
                ID: {player.playerId}
              </span>
              <span>REG: {regNumber}</span>
            </div>
          </div>

          {/* Clean 2-Column Details Layout */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-[1px] text-[6.5px] leading-tight pt-0.5">
            <div className="overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">SPORT</span>
              <span className="font-semibold text-slate-800 truncate block leading-tight">{sportName || '-'}</span>
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">BATCH</span>
              <span className="font-semibold text-slate-800 truncate block leading-tight">{batch || '-'}</span>
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">COACH</span>
              <span className="font-semibold text-slate-800 truncate block leading-tight">{player.coachAssigned || 'N/A'}</span>
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">GENDER</span>
              <span className="font-semibold text-slate-800 capitalize block leading-tight">{player.gender || 'N/A'}</span>
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">JOINING DATE</span>
              <span className="font-semibold text-slate-800 block leading-tight">{player.joiningDate || '—'}</span>
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">ISSUE DATE</span>
              <span className="font-semibold text-slate-800 block leading-tight">{issueDate}</span>
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">CONTACT</span>
              <span className="font-semibold text-slate-800 block leading-tight">{player.contactNumber || '—'}</span>
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">EMAIL</span>
              <span className="font-semibold text-slate-800 block truncate leading-tight">{player.email || '—'}</span>
            </div>
            <div className="col-span-2 overflow-hidden">
              <span className="text-slate-500 font-medium uppercase block text-[5.5px] leading-none">ADDRESS</span>
              <span className="font-semibold text-slate-800 block truncate leading-tight">{player.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Top-Right QR Code Zone */}
        <div className="shrink-0 flex flex-col items-center justify-start pt-0.5">
          <div className="p-0.5 bg-white border border-slate-200 rounded-lg shadow-xs">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="QR Code" className="w-[36px] h-[36px] object-contain" />
            ) : (
              <div className="w-[36px] h-[36px] bg-slate-100 rounded flex items-center justify-center text-[7px] font-medium text-slate-400">
                QR
              </div>
            )}
          </div>
          <span className="text-[6px] font-medium text-slate-500 mt-0.5 tracking-tight leading-none">Scan to Verify</span>
        </div>

      </div>

      {/* Light Footer Bar */}
      <div className="bg-slate-800 text-slate-200 px-3 py-0.8 flex justify-between items-center text-[7px] font-medium border-t border-amber-400 relative z-10 leading-none">
        <span>SERIAL NO: <strong className="text-amber-300 font-mono">{serialNumber}</strong></span>
        <span className="text-amber-300 font-medium">{academyName}</span>
      </div>

    </div>
  );
});

/* ==========================================
   BACK CARD COMPONENT (Light Premium Theme)
========================================== */
const BackCardComponent = React.forwardRef(({ player, academy }, ref) => {
  const academyName = academy?.academyName || 'SPORT ACADEMY';
  const academyAddress = academy?.address || 'Solapur, Maharashtra, India';
  const academyPhone = academy?.phone || '+91 98765 43210';
  const academyEmail = academy?.email || 'contact@sportacademy.com';
  const academyWebsite = academy?.website || 'www.sportacademy.com';

  return (
    <div 
      ref={ref}
      className="w-[428px] h-[270px] rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col justify-between relative select-none font-sans"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-3 py-1 flex justify-between items-center border-b-2 border-amber-400">
        <span className="text-[8px] font-bold tracking-wider text-amber-300 uppercase leading-none">
          CARD DETAILS & TERMS
        </span>
        <span className="text-[7px] text-slate-300 font-mono leading-none">{academyEmail}</span>
      </div>

      {/* Details Body */}
      <div className="px-3 py-1.5 space-y-1 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-slate-50 overflow-hidden">
        
        {/* Personal & Emergency Info Grid */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[7.5px] leading-tight">
          <div>
            <span className="text-slate-500 font-medium uppercase block text-[6px] leading-none">DATE OF BIRTH</span>
            <span className="font-semibold text-slate-800 leading-tight">{player.dateOfBirth || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium uppercase block text-[6px] leading-none">EMERGENCY CONTACT</span>
            <span className="font-semibold text-red-600 leading-tight">{player.emergencyContact || player.contactNumber || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium uppercase block text-[6px] leading-none">ACADEMY PHONE</span>
            <span className="font-semibold text-slate-800 leading-tight">{academyPhone}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium uppercase block text-[6px] leading-none">WEBSITE</span>
            <span className="font-semibold text-blue-700 leading-tight">{academyWebsite}</span>
          </div>
        </div>

        {/* Academy Terms & Return Clause */}
        <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-[6.5px] leading-tight text-slate-700 space-y-0.5">
          <span className="font-bold text-slate-800 uppercase block text-[6.5px] tracking-wide mb-0.5 leading-none">
            TERMS & CONDITIONS:
          </span>
          <p className="leading-tight">• This card is the property of the academy. Carry during activities.</p>
          <p className="leading-tight">• Report lost cards immediately to the administration.</p>
          <div className="bg-amber-50 text-amber-900 border border-amber-200 p-0.5 rounded font-medium mt-0.5 text-[6px] leading-tight">
            <strong>IF FOUND:</strong> Please drop this card at the nearest post box or return it to the academy address.
          </div>
        </div>
        
        {/* Academy Motto / Connect */}
        <div className="text-[6px] text-center font-medium text-slate-500 italic pb-0 leading-none">
          "Nurturing the Champions of Tomorrow" | @{academyName.replace(/\s+/g, '')}
        </div>

        {/* Signature & Stamp Areas */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <div className="border border-slate-300 rounded-lg p-0.8 h-7 flex flex-col items-center justify-between bg-white">
            <span className="text-[5.5px] font-semibold text-slate-500 uppercase leading-none">AUTHORIZED SIGNATURE</span>
            <div className="w-14 border-b border-slate-700 mb-0.5" />
          </div>
          <div className="border border-dashed border-slate-300 rounded-lg p-0.8 h-7 flex flex-col items-center justify-between bg-white">
            <span className="text-[5.5px] font-semibold text-slate-500 uppercase leading-none">ACADEMY STAMP AREA</span>
            <span className="text-[5px] text-slate-400 font-medium uppercase tracking-wider leading-none">[ STAMP ]</span>
          </div>
        </div>

      </div>

      {/* Light Footer Address Bar */}
      <div className="bg-slate-900 text-white px-3 py-0.8 text-center text-[7px] font-medium border-t border-amber-400 truncate leading-none">
        {academyAddress} • Ph: {academyPhone}
      </div>

    </div>
  );
});

