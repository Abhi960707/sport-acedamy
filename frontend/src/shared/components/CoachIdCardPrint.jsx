import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import api, { API_BASE } from '../../api';
import { FrontCardComponent, BackCardComponent } from './CoachIdCardModal';

export default function CoachIdCardPrint({ coach, academy }) {
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
        .catch(err => console.error('Failed to load academy settings in print coach card:', err));
    }
  }, [academy]);

  useEffect(() => {
    if (coach) {
      const qrPayload = JSON.stringify({
        id: coach.coachId || coach._id,
        name: coach.name,
        sport: coach.sportSpecialization,
        contact: coach.contact
      });
      QRCode.toDataURL(qrPayload, { margin: 1, width: 120 })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR code generation error in print:', err));
    }
  }, [coach]);

  // Inject print isolation styles
  useEffect(() => {
    const styleId = 'coach-id-card-print-styles';
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
        body.printing-coach-id-card {
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Hide all direct children of body EXCEPT #coach-id-card-print-root */
        body.printing-coach-id-card > *:not(#coach-id-card-print-root) {
          display: none !important;
          visibility: hidden !important;
        }
        body.printing-coach-id-card #coach-id-card-print-root {
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
        body.printing-coach-id-card #coach-id-card-print-root * {
          visibility: visible !important;
        }
        body.printing-coach-id-card .cr80-print-card {
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
        body.printing-coach-id-card .cr80-print-card > div {
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
      document.body.classList.remove('printing-coach-id-card');
    };
  }, []);

  if (!coach) return null;

  const activeAcademy = academy || fetchedAcademy;

  return createPortal(
    <div id="coach-id-card-print-root" style={{ display: 'none' }} aria-hidden="true">
      {/* FRONT SIDE */}
      <div className="cr80-print-card">
        <FrontCardComponent
          coach={coach}
          academy={activeAcademy}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      </div>

      {/* BACK SIDE */}
      <div className="cr80-print-card">
        <BackCardComponent
          coach={coach}
          academy={activeAcademy}
        />
      </div>
    </div>,
    document.body
  );
}
