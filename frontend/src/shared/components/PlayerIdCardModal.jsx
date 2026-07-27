        import React, { useState, useEffect, useRef } from 'react';
        import { createPortal } from 'react-dom';
        import QRCode from 'qrcode';
        import html2canvas from 'html2canvas';
        import jsPDF from 'jspdf';
        import { FiPrinter, FiDownload, FiRotateCw, FiX, FiShield } from 'react-icons/fi';
        import api, { API_BASE } from '../../api';
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
          const [academyLogoBase64, setAcademyLogoBase64] = useState('');
          const [downloadingPdf, setDownloadingPdf] = useState(false);
          const [fetchedAcademy, setFetchedAcademy] = useState(null);

          const pdfFrontRef = useRef(null);
          const pdfBackRef = useRef(null);

          useEffect(() => {
            if (!academy) {
              api.get('/settings')
                .then(res => {
                  if (res.data.success && res.data.data) {
                    setFetchedAcademy(res.data.data);
                  }
                })
                .catch(err => console.error('Failed to load academy settings in ID card modal:', err));
            }
          }, [academy]);

          const activeAcademy = academy || fetchedAcademy;

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
            let isMounted = true;
            const logoUrl = activeAcademy?.logo;
            if (logoUrl) {
              const src = getImageUrl(logoUrl);
              if (src.startsWith('data:')) {
                setAcademyLogoBase64(src);
              } else {
                fetch(src)
                  .then(res => res.blob())
                  .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (isMounted) setAcademyLogoBase64(reader.result);
                    };
                    reader.readAsDataURL(blob);
                  })
                  .catch(() => {
                    if (isMounted) setAcademyLogoBase64('');
                  });
              }
            } else {
              setAcademyLogoBase64('');
            }
            return () => { isMounted = false; };
          }, [activeAcademy?.logo]);

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
            if (!pdfFrontRef.current || !pdfBackRef.current) return;
            setDownloadingPdf(true);

            try {
              // 1. Wait for document fonts and all image elements to finish loading
              if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
              }

              const allImages = Array.from(pdfFrontRef.current.querySelectorAll('img')).concat(
                Array.from(pdfBackRef.current.querySelectorAll('img'))
              );

              await Promise.all(
                allImages.map(img => {
                  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                  return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                })
              );

              // Give browser one frame for layout repaint and ensure DOM styles are fully applied
              await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 100)));

              const frontRect = pdfFrontRef.current.getBoundingClientRect();
              const backRect = pdfBackRef.current.getBoundingClientRect();

              const canvasOptsFront = {
                scale: 4,
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: true,
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 15000,
                windowWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
                windowHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
                onclone: (clonedDoc, clonedElement) => {
                  clonedElement.style.position = 'static';
                  clonedElement.style.left = '0';
                  clonedElement.style.top = '0';
                  clonedElement.style.margin = '0';
                  clonedElement.style.opacity = '1';
                  clonedElement.style.visibility = 'visible';
                  clonedElement.style.transform = 'none';
                }
              };

              const canvasOptsBack = {
                scale: 4,
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: true,
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 15000,
                windowWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
                windowHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
                onclone: (clonedDoc, clonedElement) => {
                  clonedElement.style.position = 'static';
                  clonedElement.style.left = '0';
                  clonedElement.style.top = '0';
                  clonedElement.style.margin = '0';
                  clonedElement.style.opacity = '1';
                  clonedElement.style.visibility = 'visible';
                  clonedElement.style.transform = 'none';
                }
              };

              const frontCanvas = await html2canvas(pdfFrontRef.current, canvasOptsFront);
              const backCanvas = await html2canvas(pdfBackRef.current, canvasOptsBack);

              const frontImg = frontCanvas.toDataURL('image/png');
              const backImg = backCanvas.toDataURL('image/png');

              const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
              });

              // Front & Back Cards (Centered, Standard CR80 Dimensions: 85.60mm x 53.98mm)
              // A4 Width: 210mm -> Centered X: (210 - 85.60) / 2 = 62.2mm
              pdf.addImage(frontImg, 'PNG', 62.2, 25, 85.60, 53.98);
              pdf.addImage(backImg, 'PNG', 62.2, 90, 85.60, 53.98);

              const fileName = `${player.fullName.toLowerCase().trim()}.pdf`;
              pdf.save(fileName);

              // Auto-print the generated PDF
              try {
                const pdfBlob = pdf.output('blob');
                const blobUrl = URL.createObjectURL(pdfBlob);
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                iframe.src = blobUrl;
                document.body.appendChild(iframe);

                iframe.onload = () => {
                  iframe.contentWindow.focus();
                  iframe.contentWindow.print();
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(blobUrl);
                  }, 2000);
                };
              } catch (printErr) {
                console.error('Failed to auto-print PDF:', printErr);
              }
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

          return createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in print:p-0 print:bg-transparent print:static" style={{ zIndex: 9999 }}>

              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 print:shadow-none print:border-none print:p-0 print:max-w-none print:max-h-none">

                {/* Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                      <FiShield className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        Official Player Identification Card
                      </h3>
                      <p className="text-xs text-slate-400">
                        {player.fullName} ({player.playerId}) • High-Definition ID Badge
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrintCard}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 cursor-pointer"
                    >
                      <FiPrinter className="text-sm" />
                      <span>Print ID Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      <FiDownload className="text-sm" />
                      <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer ml-2"
                    >
                      <FiX className="text-lg" />
                    </button>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 bg-slate-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('flip')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${viewMode === 'flip' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-gray-100'
                        }`}
                    >
                      3D Interactive View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('both')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${viewMode === 'both' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-gray-100'
                        }`}
                    >
                      Both Sides
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('front')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${viewMode === 'front' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-gray-100'
                        }`}
                    >
                      Front Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('back')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${viewMode === 'back' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-gray-100'
                        }`}
                    >
                      Back Only
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 font-medium hidden sm:block">
                    CR80 Standard • 85.6mm × 53.98mm Format
                  </div>
                </div>

                {/* Display Area */}
                <div className="p-8 bg-slate-100/75 flex-1 flex flex-col items-center justify-center overflow-y-auto min-h-[380px]">

                  {/* 3D FLIP MODE */}
                  {viewMode === 'flip' && (
                    <div className="flex flex-col items-center gap-6">
                      <div className="group perspective cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                        <div className={`relative w-[480px] h-[300px] transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                          <div className="absolute inset-0 backface-hidden">
                            <FrontCardComponent
                              player={player}
                              academy={activeAcademy}
                              qrCodeDataUrl={qrCodeDataUrl}
                            />
                          </div>
                          <div className="absolute inset-0 backface-hidden rotate-y-180">
                            <BackCardComponent
                              player={player}
                              academy={activeAcademy}
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
                          academy={activeAcademy}
                          qrCodeDataUrl={qrCodeDataUrl}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Back Side</span>
                        <BackCardComponent
                          player={player}
                          academy={activeAcademy}
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
                        academy={activeAcademy}
                        qrCodeDataUrl={qrCodeDataUrl}
                      />
                    </div>
                  )}

                  {/* BACK ONLY MODE */}
                  {viewMode === 'back' && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Back Side</span>
                      <BackCardComponent
                        player={player}
                        academy={activeAcademy}
                      />
                    </div>
                  )}

                  {/* ISOLATED 2D FLAT CAPTURE CONTAINER FOR PDF GENERATOR (NO 3D TRANSFORMS) */}
                  {createPortal(
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '480px', height: '300px', opacity: 0, visibility: 'visible', pointerEvents: 'none', zIndex: -1, background: '#ffffff', overflow: 'hidden', transform: 'none' }}>
                      <div ref={pdfFrontRef} style={{ position: 'absolute', top: 0, left: 0, width: '480px', height: '300px', transform: 'none', perspective: 'none', background: '#ffffff' }}>
                        <FrontCardComponent
                          player={player}
                          academy={activeAcademy}
                          qrCodeDataUrl={qrCodeDataUrl}
                          playerImageBase64={playerImageBase64}
                          academyLogoBase64={academyLogoBase64}
                        />
                      </div>
                      <div ref={pdfBackRef} style={{ position: 'absolute', top: 0, left: 0, width: '480px', height: '300px', transform: 'none', perspective: 'none', background: '#ffffff' }}>
                        <BackCardComponent
                          player={player}
                          academy={activeAcademy}
                        />
                      </div>
                    </div>,
                    document.body
                  )}

                  {/* Dedicated print component for browser print */}
                  <PlayerIdCardPrint player={player} academy={activeAcademy} />

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
            </div>,
            document.body
          );
        }

        /* ==========================================
          FRONT CARD COMPONENT (Premium Theme)
        ========================================== */
        export const FrontCardComponent = React.forwardRef(({ player, academy, qrCodeDataUrl, playerImageBase64, academyLogoBase64 }, ref) => {
          const [imgError, setImgError] = React.useState(false);

          let sportName = player.sportChosen || '';
          if (sportName.includes('(')) {
            const match = sportName.match(/(.+?)\s*\((.+?)\)/);
            if (match) sportName = match[1].trim();
          }

          const academyName = (academy?.academyName && academy.academyName.trim()) ? academy.academyName : 'SPORT ACADEMY';
          const academyLogo = academyLogoBase64 || academy?.logo || '';
          const academyAddress = (academy?.address && academy.address.trim()) ? academy.address : 'Solapur, Maharashtra, India';
          const academyWebsite = (academy?.website && academy.website.trim()) ? academy.website : 'www.sportacademy.com';

          const batch = player.batch || 'Regular Batch';
          const regNumber = player.registrationNumber || player.playerId || 'REG-001';
          const serialNumber = `SN-${player.playerId || '001'}`;

          const photoSrc = playerImageBase64 || getImageUrl(player.playerImage);

          return (
            <div
              ref={ref}
              className="w-[480px] h-[300px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative select-none print:shadow-none"
              style={{ boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              {/* Background patterns */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-slate-50 z-0" />

              {/* Header Banner - Dark Blue/Gold */}
              <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b-[3px] border-amber-400 relative z-10 h-[64px] shrink-0">
                <div className="flex items-center gap-3 max-w-[74%] min-w-0">
                  {academyLogo && !imgError ? (
                    <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-700">
                      <img src={getImageUrl(academyLogo)} crossOrigin="anonymous" alt="" className="max-w-full max-h-full object-contain" onError={() => setImgError(true)} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
                      🏆
                    </div>
                  )}
                  <div className="flex flex-col justify-center min-w-0 py-0.5">
                    <h1 className="text-[13px] font-bold uppercase truncate text-amber-400 tracking-wider" style={{ margin: 0, padding: 0, lineHeight: 1.25 }}>
                      {academyName}
                    </h1>
                    <p className="text-[9px] text-slate-200 font-medium truncate mt-0.5" style={{ margin: 0, padding: 0, lineHeight: 1.2 }}>{academyAddress}</p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center justify-center h-full">
                  <div className="bg-blue-600/30 border border-amber-400/40 text-amber-300 text-[7px] font-bold uppercase px-2 py-1 rounded-md tracking-wider whitespace-nowrap">
                    OFFICIAL PLAYER ID
                  </div>
                </div>
              </div>

              {/* Body Area */}
              <div className="flex-1 flex px-4 py-3 gap-4 relative z-10 overflow-hidden bg-white/90">

                {/* Left Column: Photo & QR */}
                <div className="flex flex-col items-center justify-between w-[96px] shrink-0">
                  <div className="w-[96px] h-[116px] rounded-xl border-2 border-slate-200 shadow-sm bg-slate-50 overflow-hidden relative flex items-center justify-center">
                    {photoSrc && !imgError ? (
                      <img
                        src={photoSrc}
                        crossOrigin="anonymous"
                        alt=""
                        className="w-full h-full object-contain object-center bg-slate-50 p-0.5"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300 bg-slate-100">
                        👤
                      </div>
                    )}
                  </div>

                  <div className="mt-1 w-[50px] h-[50px] bg-white p-1 rounded-lg border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-300">QR</div>
                    )}
                  </div>
                </div>

                {/* Right Column: Player Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="border-b border-slate-200 pb-1.5">
                    <h2 className="text-[16px] font-bold text-slate-900 uppercase truncate tracking-wide" style={{ margin: 0, lineHeight: 1.25 }}>
                      {player.fullName}
                    </h2>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border border-blue-200 whitespace-nowrap">
                        ID: {player.playerId}
                      </span>
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border border-slate-200 whitespace-nowrap">
                        REG: {regNumber}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9.5px]">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-slate-500 font-semibold uppercase text-[8px] tracking-wider" style={{ lineHeight: 1.2 }}>Sport</span>
                      <span className="font-bold text-slate-800 truncate mt-0.5" style={{ lineHeight: 1.25, letterSpacing: '0.2px' }}>{sportName || '-'}</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-slate-500 font-semibold uppercase text-[8px] tracking-wider" style={{ lineHeight: 1.2 }}>Batch</span>
                      <span className="font-bold text-slate-800 truncate mt-0.5" style={{ lineHeight: 1.25, letterSpacing: '0.2px' }}>{batch || '-'}</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-slate-500 font-semibold uppercase text-[8px] tracking-wider" style={{ lineHeight: 1.2 }}>Coach</span>
                      <span className="font-bold text-slate-800 truncate mt-0.5" style={{ lineHeight: 1.25, letterSpacing: '0.2px' }}>{player.coachAssigned || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-slate-500 font-semibold uppercase text-[8px] tracking-wider" style={{ lineHeight: 1.2 }}>DOB / Gender</span>
                      <span className="font-bold text-slate-800 capitalize truncate mt-0.5" style={{ lineHeight: 1.25, letterSpacing: '0.2px' }}>{player.dateOfBirth || '-'} / {player.gender || '-'}</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-slate-500 font-semibold uppercase text-[8px] tracking-wider" style={{ lineHeight: 1.2 }}>Contact</span>
                      <span className="font-bold text-slate-800 truncate mt-0.5" style={{ lineHeight: 1.25, letterSpacing: '0.2px' }}>{player.contactNumber || '-'}</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-slate-500 font-semibold uppercase text-[8px] tracking-wider" style={{ lineHeight: 1.2 }}>Joining Date</span>
                      <span className="font-bold text-slate-800 truncate mt-0.5" style={{ lineHeight: 1.25, letterSpacing: '0.2px' }}>{player.joiningDate || '-'}</span>
                    </div>
                    <div className="col-span-2 flex flex-col overflow-hidden">
                      <span className="text-slate-500 font-semibold uppercase text-[8px] tracking-wider" style={{ lineHeight: 1.2 }}>Address</span>
                      <span className="font-bold text-slate-800 truncate mt-0.5" style={{ lineHeight: 1.25, letterSpacing: '0.2px' }}>{player.address || '-'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-slate-100 text-slate-600 px-4 py-1.5 flex justify-between items-center text-[8.5px] font-bold border-t border-slate-200 relative z-10 shrink-0">
                <span className="uppercase">SN: <span className="text-slate-900">{serialNumber}</span></span>
                <span className="uppercase text-slate-500">{academyWebsite}</span>
              </div>
            </div>
          );
        });

        /* ==========================================
          BACK CARD COMPONENT (Premium Theme)
        ========================================== */
        export const BackCardComponent = React.forwardRef(({ player, academy }, ref) => {
          const academyName = (academy?.academyName && academy.academyName.trim()) ? academy.academyName : 'SPORT ACADEMY';
          const academyAddress = (academy?.address && academy.address.trim()) ? academy.address : 'Solapur, Maharashtra, India';
          const academyPhone = (academy?.phone && academy.phone.trim()) ? academy.phone : '+91 98765 43210';
          const academyEmail = (academy?.email && academy.email.trim()) ? academy.email : 'contact@sportacademy.com';
          const academyWebsite = (academy?.website && academy.website.trim()) ? academy.website : 'www.sportacademy.com';
          const issueDate = player.joiningDate || new Date().toISOString().split('T')[0];

          return (
            <div
              ref={ref}
              className="w-[480px] h-[300px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative select-none print:shadow-none"
              style={{ boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              <div className="absolute inset-0 bg-slate-50/50 z-0" />

              {/* Top Header - Matches Front */}
              <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center border-b-[3px] border-amber-400 relative z-10 h-11 shrink-0">
                <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase" style={{ lineHeight: 1.25 }}>
                  CARD DETAILS & TERMS
                </span>
                <span className="text-[9px] text-slate-300 font-medium" style={{ lineHeight: 1.25 }}>{academyEmail}</span>
              </div>

              {/* Body Area */}
              <div className="flex-1 p-4 relative z-10 flex flex-col justify-between">

                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-semibold uppercase text-[8px]" style={{ lineHeight: 1.2 }}>Emergency Contact</span>
                    <span className="font-bold text-red-600 text-[9.5px] mt-0.5" style={{ lineHeight: 1.25 }}>{player.emergencyContact || player.contactNumber || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-semibold uppercase text-[8px]" style={{ lineHeight: 1.2 }}>Academy Phone</span>
                    <span className="font-bold text-slate-800 text-[9.5px] mt-0.5" style={{ lineHeight: 1.25 }}>{academyPhone}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-semibold uppercase text-[8px]" style={{ lineHeight: 1.2 }}>Issue Date</span>
                    <span className="font-bold text-slate-800 text-[9.5px] mt-0.5" style={{ lineHeight: 1.25 }}>{issueDate}</span>
                  </div>
                  <div className="col-span-3 flex flex-col mt-1">
                    <span className="text-slate-500 font-semibold uppercase text-[8px]" style={{ lineHeight: 1.2 }}>Academy Address</span>
                    <span className="font-bold text-slate-800 text-[9px] mt-0.5" style={{ lineHeight: 1.25 }}>{academyAddress}</span>
                  </div>
                </div>

                {/* Terms */}
                <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="font-bold text-slate-800 uppercase text-[8.5px] tracking-wide mb-1 block">
                    TERMS & CONDITIONS
                  </span>
                  <ul className="text-[8px] text-slate-700 space-y-0.5 ml-3.5 list-disc font-medium">
                    <li>This card is non-transferable and remains the property of {academyName}.</li>
                    <li>Must be presented upon request during any academy activities.</li>
                    <li>If found, please return to the academy address mentioned above.</li>
                  </ul>
                </div>

                <div className="flex-1 min-h-[4px]" />

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col items-center justify-end">
                    <div className="w-36 border-b-2 border-slate-400 mb-1" />
                    <span className="text-[8px] font-bold text-slate-700 uppercase tracking-wider">Authorized Signature</span>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    <div className="w-32 h-12 border-2 border-slate-400 border-dashed rounded-lg flex flex-col items-center justify-center bg-white shadow-xs">
                      <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">OFFICIAL STAMP</span>
                      <span className="text-[6px] font-medium text-slate-400 uppercase tracking-tight">[ HERE ]</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-900 text-white px-4 py-1.5 flex justify-between items-center text-[8px] font-medium relative z-10 border-t border-amber-400 shrink-0">
                <span>"Nurturing the Champions of Tomorrow"</span>
                <span className="text-amber-300 font-mono font-bold">{academyWebsite}</span>
              </div>
            </div>
          );
        });

        