import React from 'react';
import { API_BASE } from '../../api';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  if (url.startsWith('/uploads')) {
    return `${API_BASE}${url}`;
  }
  
  if (url.includes('/uploads/')) {
    const filename = url.split('/uploads/')[1];
    return `${API_BASE}/uploads/${filename}`;
  }
  
  return url;
};

export default function PlayerRegistrationPrint({ player, academy }) {
  if (!player) return null;

  // Split sportChosen if it contains category/type
  let sportName = player.sportChosen || '';
  let categoryName = '';
  let gameType = '';
  
  if (sportName.includes('(')) {
    const match = sportName.match(/(.+?)\s*\((.+?)\)/);
    if (match) {
      sportName = match[1].trim();
      const parts = match[2].split('-');
      categoryName = parts[0] ? parts[0].trim() : '';
      gameType = parts[1] ? parts[1].trim() : '';
    }
  }

  // Calculate age
  let age = '';
  if (player.dateOfBirth) {
    const dob = new Date(player.dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const today = new Date();
      let calculatedAge = today.getFullYear() - dob.getFullYear();
      const monthDelta = today.getMonth() - dob.getMonth();
      if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
        calculatedAge -= 1;
      }
      age = calculatedAge >= 0 ? `${calculatedAge} Years` : '';
    }
  }

  const academyName = academy?.academyName || 'Sport Academy';
  const academyLogo = academy?.logo || '';
  const academyAddress = academy?.address || 'Solapur, Maharashtra, India';
  const academyPhone = academy?.phone || 'Contact Number Not Configured';
  const academyEmail = academy?.email || 'Email Not Configured';
  const academyWebsite = academy?.website || '';

  // Get logged-in user name for Verified By field
  let loggedInUserName = '';
  try {
    const authUserStr = localStorage.getItem('authUser');
    if (authUserStr) {
      const authUser = JSON.parse(authUserStr);
      loggedInUserName = authUser.name || '';
    }
  } catch (e) {
    console.error('Error parsing authUser in print:', e);
  }

  // "verified by this admin or particular coach name"
  const verifierName = loggedInUserName || player.coachAssigned || 'Academy Administrator';

  return (
    <div 
      id="player-registration-print-form" 
      className="hidden print:block bg-white text-black text-xs leading-normal mx-auto"
      style={{ 
        width: '180mm',
        boxSizing: 'border-box',
        fontFamily: '"Times New Roman", Times, serif',
        pageBreakInside: 'avoid',
        padding: '0',
        margin: '0 auto'
      }}
    >
      {/* Outer border container */}
      <div style={{ border: '1.5px solid black', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Academy Header */}
        <div className="flex justify-between items-center border-b border-black pb-3" style={{ borderBottom: '1px solid black' }}>
          <div className="flex gap-4 items-center">
            {academyLogo ? (
              <img 
                src={getImageUrl(academyLogo)} 
                alt="Academy Logo" 
                style={{ width: '60px', height: '60px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ width: '60px', height: '60px', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', backgroundColor: '#f9f9f9', fontSize: '20px' }}>
                🏆
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="text-base font-bold uppercase tracking-wide" style={{ margin: '0 0 2px 0', fontSize: '15px' }}>{academyName}</h1>
              <p className="text-[10px] text-gray-700 font-medium" style={{ margin: '0 0 2px 0' }}>{academyAddress}</p>
              <p className="text-[10px] text-gray-700 font-medium" style={{ margin: '0 0 2px 0' }}>Phone: {academyPhone} | Email: {academyEmail}</p>
              {academyWebsite && <p className="text-[10px] text-gray-700 font-medium" style={{ margin: '0' }}>Website: {academyWebsite}</p>}
            </div>
          </div>
          
          {/* Passport Photo Box */}
          <div 
            style={{ 
              width: '30mm', 
              height: '40mm', 
              border: '1px solid black', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textAlign: 'center', 
              padding: '2px', 
              backgroundColor: 'white',
              flexShrink: 0
            }}
          >
            {player.playerImage ? (
              <img 
                src={getImageUrl(player.playerImage)} 
                alt="Player Photo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ fontSize: '9px', color: '#888', fontWeight: 'bold', padding: '0 4px', textTransform: 'uppercase' }}>
                Affix Photo Here
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-sm font-bold uppercase tracking-wider border-t border-b border-black py-1 px-4 inline-block">
            PLAYER REGISTRATION FORM
          </h2>
          <div className="flex justify-between mt-2 px-1 text-[10px] font-bold uppercase">
            <div>Registration No: {player.playerId}</div>
            <div>Date: {player.joiningDate || new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Section 1: Player Info */}
        <div className="space-y-1">
          <div className="bg-gray-100 font-bold px-2 py-0.5 uppercase border border-black text-[9px] tracking-wider">
            1. Player Personal Details
          </div>
          <table className="w-full border-collapse border border-black text-left">
            <tbody>
              <tr>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Full Name</th>
                <td className="border border-black px-2 py-1.5 w-3/4 font-semibold text-xs animate-fade-in" colSpan={3}>
                  {player.fullName}
                </td>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Date of Birth</th>
                <td className="border border-black px-2 py-1.5 w-1/4 font-medium">{player.dateOfBirth}</td>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Age / Gender</th>
                <td className="border border-black px-2 py-1.5 w-1/4 capitalize font-medium">
                  {age || '—'} / {player.gender || '—'}
                </td>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Mobile Number</th>
                <td className="border border-black px-2 py-1.5 w-1/4 font-medium">{player.contactNumber}</td>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Email Address</th>
                <td className="border border-black px-2 py-1.5 w-1/4 break-all font-medium">{player.email}</td>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Residential Address</th>
                <td className="border border-black px-2 py-1.5 w-3/4 font-medium" colSpan={3}>{player.address}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Sport Details */}
        <div className="space-y-1">
          <div className="bg-gray-100 font-bold px-2 py-0.5 uppercase border border-black text-[9px] tracking-wider">
            2. Academy Enrollment & Game Details
          </div>
          <table className="w-full border-collapse border border-black text-left">
            <tbody>
              <tr>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Sport/Game</th>
                <td className="border border-black px-2 py-1.5 w-1/4 font-semibold">{sportName}</td>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Category</th>
                <td className="border border-black px-2 py-1.5 w-1/4 font-semibold">{categoryName && categoryName.trim() ? categoryName : '—'}</td>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Game Type</th>
                <td className="border border-black px-2 py-1.5 w-1/4 font-semibold">{gameType && gameType.trim() ? gameType : '—'}</td>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Coach Assigned</th>
                <td className="border border-black px-2 py-1.5 w-1/4 font-semibold">{player.coachAssigned}</td>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1.5 w-1/4 bg-gray-50 font-bold text-[9px] uppercase">Joining Date</th>
                <td className="border border-black px-2 py-1.5 w-3/4 font-medium" colSpan={3}>{player.joiningDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Fee Details */}
        <div className="space-y-1">
          <div className="bg-gray-100 font-bold px-2 py-0.5 uppercase border border-black text-[9px] tracking-wider">
            3. Fee & Payment Ledger
          </div>
          <table className="w-full border-collapse border border-black text-left">
            <tbody>
              <tr className="bg-gray-50 text-[9px] font-bold uppercase">
                <th className="border border-black px-2 py-1 w-1/3">Total Academy Fee</th>
                <th className="border border-black px-2 py-1 w-1/3">Amount Paid</th>
                <th className="border border-black px-2 py-1 w-1/3">Pending Balance</th>
              </tr>
              <tr className="text-center font-semibold text-xs">
                <td className="border border-black px-2 py-1.5">₹{player.totalFee}</td>
                <td className="border border-black px-2 py-1.5 text-emerald-700">₹{player.payingFee}</td>
                <td className="border border-black px-2 py-1.5 text-red-700">₹{player.pendingFee}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Declaration Section */}
        <div className="border border-black p-2.5 bg-gray-50 space-y-1">
          <p className="font-bold text-[9px] uppercase tracking-wider">4. Rules & Declaration</p>
          <p className="text-[8.5px] text-gray-800 leading-normal">
            I hereby declare that the information provided above is true and correct to the best of my knowledge. I agree to abide by the rules, regulations, code of conduct, and policies set forth by {academyName}.
          </p>
          
          <div className="flex justify-between items-end pt-5 px-4">
            <div className="text-center w-1/3 space-y-1">
              <div className="border-t border-black pt-0.5 text-[8.5px] font-bold uppercase">Parent / Guardian Signature</div>
            </div>
            <div className="text-center w-1/3 space-y-1">
              <div className="border-t border-black pt-0.5 text-[8.5px] font-bold uppercase">Player Signature</div>
            </div>
          </div>
        </div>

        {/* Section: Academy Use Only */}
        <div className="border border-black p-2.5 space-y-1.5">
          <p className="font-bold text-[9px] uppercase border-b border-black pb-0.5 bg-gray-100 px-1 tracking-wider">
            5. For Academy Administration Use Only
          </p>
          <div className="grid grid-cols-3 gap-4 text-[9px] items-center">
            <div className="space-y-1">
              <div className="text-[8px] font-bold uppercase text-gray-500">Verified By:</div>
              <div className="font-bold text-xs text-gray-800 uppercase">{verifierName}</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] font-bold uppercase text-gray-500">Registration Status:</div>
              <div className="font-bold text-xs uppercase text-emerald-700 mt-0.5">✓ APPROVED</div>
            </div>
            <div className="border border-dashed border-black h-12 flex items-center justify-center bg-gray-50 font-bold text-gray-400 text-[8.5px] uppercase tracking-wider">
              ACADEMY STAMP / SEAL
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
