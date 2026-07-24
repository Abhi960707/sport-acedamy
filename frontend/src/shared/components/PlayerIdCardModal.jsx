import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiPrinter, FiDownload, FiRotateCw, FiX, FiShield } from 'react-icons/fi';
import { API_BASE } from '../../api';
import PlayerIdCardPrint from './PlayerIdCardPrint';

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
  const [playerImageBase64, setPlayerImageBase64] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    if (player?.playerImage) {
      const src = getImageUrl(player.playerImage);
      if (src.startsWith('data:')) {
        setPlayerImageBase64(src);
      } else {
        fetch(src)
          .then(res => res.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (isMounted) setPlayerImageBase64(reader.result);
            };
            reader.readAsDataURL(blob);
          })
          .catch(() => {
            if (isMounted) setPlayerImageBase64(src);
          });
      }
    } else {
      setPlayerImageBase64('');
    }
    return () => { isMounted = false; };
  }, [player]);

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
        scale: 4, // Higher DPI resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      };

      const frontCanvas = await html2canvas(frontCardRef.current, canvasOpts);
      const backCanvas = await html2canvas(backCardRef.current, canvasOpts);

      const frontImg = frontCanvas.toDataURL('image/png');
      const backImg = backCanvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Front Card (Centered Top)
      pdf.addImage(frontImg, 'PNG', 62.2, 25, 85.60, 53.98);

      // Back Card (Centered Below Front Card)
      pdf.addImage(backImg, 'PNG', 62.2, 90, 85.60, 53.98);

      pdf.save(`Player_ID_Card_${player.playerId || player.fullName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintCard = () => {
    document.body.classList.add('printing-id-card');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-id-card');
      }, 1000);
    }, 150);
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
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'flip' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <FiRotateCw />
              <span>3D Flip Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${viewMode === 'both' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Both Sides
            </button>
            <button
              type="button"
              onClick={() => setViewMode('front')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${viewMode === 'front' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Front Only
            </button>
            <button
              type="button"
              onClick={() => setViewMode('back')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${viewMode === 'back' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
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
              onClick={handlePrintCard}
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

          {/* Off-screen renders for PDF generator (opacity 1 for html2canvas, hidden offscreen) */}
          <div style={{ position: 'absolute', top: 0, left: '-9999px', pointerEvents: 'none', zIndex: -100 }}>
            <FrontCardComponent
              player={player}
              academy={academy}
              qrCodeDataUrl={qrCodeDataUrl}
              playerImageBase64={playerImageBase64}
              ref={frontCardRef}
            />
            <BackCardComponent
              player={player}
              academy={academy}
              ref={backCardRef}
            />
          </div>

          {/* Dedicated print component for browser print */}
          <PlayerIdCardPrint player={player} academy={academy} />

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
   FRONT CARD COMPONENT (Premium Theme)
========================================== */
const FrontCardComponent = React.forwardRef(({ player, academy, qrCodeDataUrl, playerImageBase64 }, ref) => {
  const [imgError, setImgError] = React.useState(false);

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

  const photoSrc = playerImageBase64 || getImageUrl(player.playerImage);

  return (
    <div
      ref={ref}
      className="w-[428px] h-[270px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative select-none font-sans print:shadow-none"
      style={{ boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white z-0" />

      {/* Header Banner - Dark Blue/Gold */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between border-b-[3px] border-amber-400 relative z-10 h-14 shrink-0">
        <div className="flex items-center gap-2.5 max-w-[70%]">
          {academyLogo && !imgError ? (
            <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center shrink-0">
              <img src={getImageUrl(academyLogo)} alt="" className="max-w-full max-h-full object-contain" onError={() => setImgError(true)} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              🏆
            </div>
          )}
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-[11px] font-bold uppercase truncate text-amber-400">
              {academyName}
            </h1>
            <p className="text-[7.5px] text-slate-300 font-medium truncate opacity-90">{academyAddress}</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center h-full">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-amber-300 text-[6.5px] font-bold uppercase px-2 py-1 rounded-full">
            OFFICIAL PLAYER ID
          </div>
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 flex px-4 py-3 gap-4 relative z-10 overflow-hidden">

        {/* Left Column: Photo & QR */}
        <div className="flex flex-col items-center justify-between w-[84px] shrink-0">
          <div className="w-[84px] h-[104px] rounded-xl border-2 border-white shadow-md bg-slate-100 overflow-hidden relative flex items-center justify-center">
            {photoSrc && !imgError ? (
              <img
                src={photoSrc}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400 bg-slate-100">
                👤
              </div>
            )}
          </div>

          <div className="mt-2 w-[48px] h-[48px] bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-300">QR</div>
            )}
          </div>
        </div>

        {/* Right Column: Player Details */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-2 border-b border-slate-200 pb-1.5">
            <h2 className="text-[15px] font-bold text-slate-900 uppercase truncate">
              {player.fullName}
            </h2>
            <div className="flex gap-2 mt-1">
              <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-blue-200">
                ID: {player.playerId}
              </span>
              <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-slate-200">
                REG: {regNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8px] mt-0.5">
            <div className="flex flex-col overflow-hidden">
              <span className="text-slate-400 font-bold uppercase text-[6.5px]">Sport</span>
              <span className="font-bold text-slate-800 truncate">{sportName || '-'}</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-slate-400 font-bold uppercase text-[6.5px]">Batch</span>
              <span className="font-bold text-slate-800 truncate">{batch || '-'}</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-slate-400 font-bold uppercase text-[6.5px]">Coach</span>
              <span className="font-bold text-slate-800 truncate">{player.coachAssigned || 'N/A'}</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-slate-400 font-bold uppercase text-[6.5px]">DOB / Gender</span>
              <span className="font-bold text-slate-800 capitalize truncate">{player.dateOfBirth || '-'} / {player.gender || '-'}</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-slate-400 font-bold uppercase text-[6.5px]">Contact</span>
              <span className="font-bold text-slate-800 truncate">{player.contactNumber || '-'}</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-slate-400 font-bold uppercase text-[6.5px]">Joining Date</span>
              <span className="font-bold text-slate-800 truncate">{player.joiningDate || '-'}</span>
            </div>
            <div className="col-span-2 flex flex-col overflow-hidden">
              <span className="text-slate-400 font-bold uppercase text-[6.5px]">Address</span>
              <span className="font-bold text-slate-800 truncate">{player.address || '-'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="bg-slate-100 text-slate-500 px-4 py-1.5 flex justify-between items-center text-[7px] font-bold border-t border-slate-200 relative z-10 shrink-0">
        <span className="uppercase">SN: <span className="text-slate-800">{serialNumber}</span></span>
        <span className="uppercase text-slate-400 text-[6px]">www.sportacademy.com</span>
      </div>
    </div>
  );
});

/* ==========================================
   BACK CARD COMPONENT (Premium Theme)
========================================== */
const BackCardComponent = React.forwardRef(({ player, academy }, ref) => {
  const academyName = academy?.academyName || 'SPORT ACADEMY';
  const academyAddress = academy?.address || 'Solapur, Maharashtra, India';
  const academyPhone = academy?.phone || '+91 98765 43210';
  const academyEmail = academy?.email || 'contact@sportacademy.com';
  const academyWebsite = academy?.website || 'www.sportacademy.com';
  const issueDate = player.joiningDate || new Date().toISOString().split('T')[0];

  return (
    <div
      ref={ref}
      className="w-[428px] h-[270px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative select-none font-sans print:shadow-none"
      style={{ boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <div className="absolute inset-0 bg-slate-50/50 z-0" />

      {/* Top Header - Matches Front */}
      <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center border-b-[3px] border-amber-400 relative z-10 h-10 shrink-0">
        <span className="text-[10px] font-black tracking-wider text-amber-400 uppercase leading-none">
          CARD DETAILS & TERMS
        </span>
        <span className="text-[8px] text-slate-300 font-medium leading-none">{academyEmail}</span>
      </div>

      {/* Body Area */}
      <div className="flex-1 p-3.5 relative z-10 flex flex-col justify-between">

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col">
            <span className="text-slate-400 font-bold uppercase text-[6.5px] leading-tight">Emergency Contact</span>
            <span className="font-black text-red-600 text-[8.5px] leading-tight">{player.emergencyContact || player.contactNumber || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-bold uppercase text-[6.5px] leading-tight">Academy Phone</span>
            <span className="font-bold text-slate-800 text-[8.5px] leading-tight">{academyPhone}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-bold uppercase text-[6.5px] leading-tight">Issue Date</span>
            <span className="font-bold text-slate-800 text-[8.5px] leading-tight">{issueDate}</span>
          </div>
          <div className="col-span-3 flex flex-col">
            <span className="text-slate-400 font-bold uppercase text-[6.5px] leading-tight">Academy Address</span>
            <span className="font-bold text-slate-800 text-[8px] leading-tight">{academyAddress}</span>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <span className="font-black text-slate-800 uppercase text-[7.5px] tracking-wide mb-1 block">
            TERMS & CONDITIONS
          </span>
          <ul className="text-[7px] text-slate-600 space-y-0.5 ml-3 list-disc font-medium">
            <li>This card is non-transferable and remains the property of the academy.</li>
            <li>Must be presented upon request during any academy activities.</li>
            <li>If found, please return to the academy address mentioned above.</li>
          </ul>
        </div>

        <div className="flex-1 min-h-[4px]" />

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col items-center justify-end">
            <div className="w-32 border-b-2 border-slate-400 mb-1" />
            <span className="text-[7px] font-bold text-slate-600 uppercase tracking-wider">Authorized Signature</span>
          </div>
          <div className="flex flex-col items-center justify-end">
            <div className="w-28 h-11 border-2 border-slate-400 border-dashed rounded-lg flex flex-col items-center justify-center bg-slate-50/80 shadow-xs">
              <span className="text-[7.5px] font-extrabold text-slate-600 uppercase tracking-widest">OFFICIAL STAMP</span>
              <span className="text-[5.5px] font-semibold text-slate-400 uppercase tracking-tight">[ HERE ]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-white px-4 py-1.5 text-center text-[7px] font-medium relative z-10 border-t border-amber-400 shrink-0">
        "Nurturing the Champions of Tomorrow"
      </div>
    </div>
  );
});

