import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import api from '../../api';
import { FrontCardComponent, BackCardComponent } from './PlayerIdCardModal';

export default function PlayerIdCardPrint({ player, academy }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [fetchedAcademy, setFetchedAcademy] = useState(null);

  useEffect(() => {
    if (!academy) {
      api.get('/settings')
        .then(res => {
          if (res.data.success && res.data.data) {
            setFetchedAcademy(res.data.data);
          }
        })
        .catch(err => console.error('Failed to load academy settings in print card:', err));
    }
  }, [academy]);

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
          size: A4 portrait;
          margin: 10mm;
        }
        body.printing-id-card {
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* When body has our special class, hide all direct children of body EXCEPT #id-card-print-root */
        body.printing-id-card > *:not(#id-card-print-root) {
          display: none !important;
          visibility: hidden !important;
        }
        body.printing-id-card #id-card-print-root {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 12mm !important;
          visibility: visible !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 10mm 0 !important;
          background: #ffffff !important;
          z-index: 9999999 !important;
        }
        body.printing-id-card #id-card-print-root * {
          visibility: visible !important;
        }
        body.printing-id-card .cr80-print-card {
          width: 85.6mm !important;
          height: 53.98mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-shadow: none !important;
          position: relative !important;
          border: 1px solid #cbd5e1 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body.printing-id-card .cr80-print-card > div {
          transform: scale(0.667, 0.667) !important;
          transform-origin: top left !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 480px !important;
          height: 300px !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
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

  const activeAcademy = academy || fetchedAcademy;

  return createPortal(
    <div id="id-card-print-root" style={{ display: 'none' }} aria-hidden="true">

      {/* FRONT SIDE */}
      <div className="cr80-print-card">
        <FrontCardComponent
          player={player}
          academy={activeAcademy}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      </div>

      {/* BACK SIDE */}
      <div className="cr80-print-card">
        <BackCardComponent
          player={player}
          academy={activeAcademy}
        />
      </div>

    </div>,
    document.body
  );
}
