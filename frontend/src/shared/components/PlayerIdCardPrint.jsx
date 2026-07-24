import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
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

export default function PlayerIdCardPrint({ player, academy }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    if (player) {
      const qrPayload = JSON.stringify({
        id: player.playerId || player._id,
        name: player.fullName,
        sport: player.sportChosen,
        contact: player.contactNumber
      });
      QRCode.toDataURL(qrPayload, { margin: 1, width: 120 })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [player]);

  // Inject print-isolation stylesheet
  useEffect(() => {
    const styleId = 'id-card-print-styles';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `
      @media print {
        @page {
          size: 85.6mm 53.98mm;
          margin: 0;
        }
        /* When body has our special class, hide everything except the card wrapper */
        body.printing-id-card > *:not(#id-card-print-root) {
          display: none !important;
          visibility: hidden !important;
        }
        body.printing-id-card #id-card-print-root {
          display: block !important;
          visibility: visible !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 85.6mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          z-index: 999999 !important;
        }
        body.printing-id-card .cr80-print-card {
          width: 85.6mm !important;
          height: 53.98mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          page-break-after: always !important;
          break-after: page !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body.printing-id-card .cr80-print-card:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
      }
    `;
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      document.body.classList.remove('printing-id-card');
    };
  }, []);

  if (!player) return null;

  let sportName = player.sportChosen || '';
  if (sportName.includes('(')) {
    const match = sportName.match(/(.+?)\s*\((.+?)\)/);
    if (match) sportName = match[1].trim();
  }

  const academyName = academy?.academyName || 'SPORT ACADEMY';
  const academyLogo = academy?.logo || '';
  const academyAddress = academy?.address || 'Solapur, Maharashtra, India';
  const academyPhone = academy?.phone || '+91 98765 43210';
  const academyEmail = academy?.email || 'contact@sportacademy.com';
  const academyWebsite = academy?.website || 'www.sportacademy.com';

  const batch = player.batch || 'Regular Batch';
  const regNumber = player.registrationNumber || player.playerId || 'REG-001';
  const issueDate = player.joiningDate || new Date().toISOString().split('T')[0];
  const serialNumber = `SN-${player.playerId || '001'}`;

  return (
    <div id="id-card-print-root" style={{ display: 'none' }} aria-hidden="true">

      {/* FRONT SIDE */}
      <div className="cr80-print-card" style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}>
        {/* Header */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '3px 5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
            {academyLogo ? (
              <img src={getImageUrl(academyLogo)} alt="Logo" style={{ width: '16px', height: '16px', objectFit: 'contain', background: '#fff', borderRadius: '3px', padding: '1px' }} />
            ) : (
              <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#0f172a', fontWeight: 'bold' }}>🏆</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', color: '#fcd34d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>{academyName}</div>
              <div style={{ fontSize: '5.5px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{academyAddress}</div>
            </div>
          </div>
          <div style={{ background: 'rgba(37,99,235,0.3)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)', fontSize: '5px', fontWeight: 'bold', textTransform: 'uppercase', padding: '1px 4px', borderRadius: '2px', whiteSpace: 'nowrap' }}>OFFICIAL PLAYER ID</div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start', flex: 1, padding: '3px 4px', background: '#fff' }}>
          {/* Photo */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: '17.5mm', height: '21.5mm', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {player.playerImage
                ? <img src={getImageUrl(player.playerImage)} alt={player.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '18px', color: '#94a3b8' }}>👤</span>
              }
            </div>
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0, fontSize: '5.5px' }}>
            <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.fullName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 4px', lineHeight: '1.5' }}>
              <div><span style={{ color: '#64748b' }}>ID: </span><span style={{ fontWeight: 'bold', color: '#1e40af', fontFamily: 'monospace' }}>{player.playerId}</span></div>
              <div><span style={{ color: '#64748b' }}>REG: </span><span style={{ fontWeight: '600' }}>{regNumber}</span></div>
              <div><span style={{ color: '#64748b' }}>SPORT: </span><span style={{ fontWeight: '600' }}>{sportName || '-'}</span></div>
              <div><span style={{ color: '#64748b' }}>BATCH: </span><span style={{ fontWeight: '600' }}>{batch || '-'}</span></div>
              <div style={{ overflow: 'hidden' }}><span style={{ color: '#64748b' }}>COACH: </span><span style={{ fontWeight: '600' }}>{player.coachAssigned || 'N/A'}</span></div>
              <div><span style={{ color: '#64748b' }}>GENDER: </span><span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{player.gender || 'N/A'}</span></div>
              <div><span style={{ color: '#64748b' }}>JOINED: </span><span style={{ fontWeight: '600' }}>{player.joiningDate || '—'}</span></div>
              <div><span style={{ color: '#64748b' }}>ISSUE: </span><span style={{ fontWeight: '600' }}>{issueDate}</span></div>
              <div><span style={{ color: '#64748b' }}>CONTACT: </span><span style={{ fontWeight: '600' }}>{player.contactNumber || '—'}</span></div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: '#64748b' }}>EMAIL: </span><span style={{ fontWeight: '600' }}>{player.email || '—'}</span></div>
              <div style={{ gridColumn: 'span 2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: '#64748b' }}>ADDRESS: </span><span style={{ fontWeight: '600' }}>{player.address || '—'}</span></div>
            </div>
          </div>

          {/* QR Code */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" style={{ width: '11mm', height: '11mm', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '1px', background: '#fff' }} />}
            <span style={{ fontSize: '4px', color: '#64748b', marginTop: '1px' }}>Scan to Verify</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#1e293b', color: '#fff', fontSize: '5px', padding: '2px 5px', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #f59e0b' }}>
          <span>SERIAL NO: <strong style={{ color: '#fcd34d', fontFamily: 'monospace' }}>{serialNumber}</strong></span>
          <span style={{ color: '#fcd34d', fontWeight: '600' }}>{academyName}</span>
        </div>
      </div>

      {/* BACK SIDE */}
      <div className="cr80-print-card" style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a' }}>
        {/* Header */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '2px 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f59e0b' }}>
          <span style={{ fontSize: '6.5px', fontWeight: 'bold', color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CARD DETAILS &amp; TERMS</span>
          <span style={{ fontSize: '5px', color: '#94a3b8' }}>{academyEmail}</span>
        </div>

        {/* Info Grid */}
        <div style={{ padding: '2px 3px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 4px', fontSize: '5.5px', background: '#f8fafc', padding: '3px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
            <div><span style={{ color: '#64748b', display: 'block', fontSize: '5px' }}>EMERGENCY CONTACT:</span><span style={{ fontWeight: '600', color: '#dc2626' }}>{player.emergencyContact || player.contactNumber || '—'}</span></div>
            <div><span style={{ color: '#64748b', display: 'block', fontSize: '5px' }}>ACADEMY PHONE:</span><span style={{ fontWeight: '600' }}>{academyPhone}</span></div>
            <div><span style={{ color: '#64748b', display: 'block', fontSize: '5px' }}>ISSUE DATE:</span><span style={{ fontWeight: '600' }}>{issueDate}</span></div>
            <div style={{ gridColumn: 'span 3' }}><span style={{ color: '#64748b', display: 'block', fontSize: '5px' }}>ACADEMY ADDRESS:</span><span style={{ fontWeight: '600' }}>{academyAddress}</span></div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', padding: '3px', borderRadius: '3px', background: '#fff', fontSize: '5px', lineHeight: '1.4', color: '#334155' }}>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '5.5px', marginBottom: '2px' }}>TERMS &amp; CONDITIONS:</div>
            <div>• This card is the property of the academy. Carry during activities.</div>
            <div>• Report lost cards immediately to the administration.</div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 3px', borderRadius: '2px', marginTop: '2px', fontWeight: '600', color: '#78350f' }}>
              <strong>IF FOUND:</strong> Please return this card at the nearest post box or to the academy address.
            </div>
          </div>

          <div style={{ fontSize: '4.5px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
            "Nurturing the Champions of Tomorrow" | @{academyName.replace(/\s+/g, '')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px', height: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
              <span style={{ fontSize: '4.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>AUTHORIZED SIGNATURE</span>
              <div style={{ width: '24px', borderBottom: '1px solid #1e293b' }} />
            </div>
            <div style={{ border: '1px dashed #cbd5e1', borderRadius: '3px', padding: '2px', height: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
              <span style={{ fontSize: '4.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>ACADEMY STAMP AREA</span>
              <span style={{ fontSize: '4px', color: '#94a3b8' }}>[ STAMP ]</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#0f172a', color: '#fff', fontSize: '5px', padding: '2px 5px', textAlign: 'center', borderTop: '2px solid #f59e0b' }}>
          {academyAddress} | Ph: {academyPhone}
        </div>
      </div>
    </div>
  );
}
