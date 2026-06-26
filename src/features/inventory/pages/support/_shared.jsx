
export const PolarBearSvgWithWallet = () => (
  <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Light blue circular background */}
    <circle cx="90" cy="92" r="68" fill="#e0f2fe" />

    {/* Cloud/snow shapes (decorative) */}
    <ellipse cx="38" cy="120" rx="14" ry="6" fill="#ffffff" opacity="0.9" />
    <ellipse cx="148" cy="58" rx="10" ry="5" fill="#ffffff" opacity="0.9" />

    {/* Polar bear body peeking behind the wallet (right side) */}
    <ellipse cx="128" cy="110" rx="26" ry="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Polar bear head */}
    <circle cx="132" cy="82" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Ears */}
    <circle cx="120" cy="70" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="144" cy="70" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="120" cy="70" r="2" fill="#fbcfe8" />
    <circle cx="144" cy="70" r="2" fill="#fbcfe8" />
    {/* Eyes (closed/happy) */}
    <path d="M126 81 Q128 84 130 81" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M134 81 Q136 84 138 81" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* Snout */}
    <ellipse cx="132" cy="90" rx="6" ry="4.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
    <ellipse cx="132" cy="88" rx="1.6" ry="1.2" fill="#1e293b" />

    {/* Wallet / Deposit folder (front) */}
    <rect x="34" y="78" width="78" height="58" rx="10" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
    {/* Wallet inner pocket */}
    <path d="M34 102 Q73 92 112 102 L112 136 Q73 126 34 136 Z" fill="#0369a1" opacity="0.55" />
    {/* Small card sticking out */}
    <rect x="84" y="86" width="22" height="14" rx="3" fill="#e0f2fe" stroke="#0369a1" strokeWidth="1" />
    <circle cx="88" cy="93" r="2" fill="#0284c7" />
    <rect x="93" y="91" width="10" height="2" rx="1" fill="#0284c7" />
    <rect x="93" y="95" width="7" height="1.5" rx="0.5" fill="#0284c7" />
  </svg>
);
