/**
 * Ilustrasi empty-state: beruang kutub full-body (proporsional) yang
 * melambai di samping keranjang belanja, dengan animasi mengambang (bob),
 * lambaian tangan, dan kedipan mata. Keyframe ditanam inline agar mandiri.
 */
export default function PolarBearEmpty() {
  return (
    <svg
      width="250"
      height="200"
      viewBox="0 0 250 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Belum ada data"
    >
      <style>{`
        @keyframes pbBob { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-6px); } }
        @keyframes pbWave { 0%,100%{ transform: rotate(-6deg); } 50%{ transform: rotate(24deg); } }
        @keyframes pbBlink { 0%,90%,100%{ transform: scaleY(1); } 95%{ transform: scaleY(0.1); } }
        .pb-bob   { animation: pbBob 3.2s ease-in-out infinite; }
        .pb-wave  { animation: pbWave 1.3s ease-in-out infinite; transform-box: fill-box; transform-origin: top center; }
        .pb-blink { animation: pbBlink 4.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      `}</style>

      {/* Latar lembut */}
      <ellipse cx="125" cy="118" rx="104" ry="78" fill="#EAF5FC" />

      {/* Keranjang belanja */}
      <g stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M44 74 H58 L72 124 H118 L129 90 H64" />
      </g>
      <circle cx="80" cy="138" r="7.5" fill="#3B82F6" />
      <circle cx="110" cy="138" r="7.5" fill="#3B82F6" />

      {/* Beruang kutub (full body) */}
      <g className="pb-bob">
        {/* Kaki */}
        <ellipse cx="158" cy="172" rx="14" ry="10" fill="#fff" stroke="#E2EEF6" strokeWidth="2" />
        <ellipse cx="190" cy="172" rx="14" ry="10" fill="#fff" stroke="#E2EEF6" strokeWidth="2" />
        <ellipse cx="158" cy="170" rx="6" ry="4" fill="#F2F9FE" />
        <ellipse cx="190" cy="170" rx="6" ry="4" fill="#F2F9FE" />

        {/* Badan */}
        <ellipse cx="174" cy="140" rx="32" ry="31" fill="#fff" stroke="#E2EEF6" strokeWidth="2" />
        <ellipse cx="174" cy="146" rx="18" ry="17" fill="#F6FBFE" />

        {/* Tangan kiri (santai) */}
        <ellipse cx="148" cy="140" rx="9" ry="16" fill="#fff" stroke="#E2EEF6" strokeWidth="2" />

        {/* Tangan kanan (melambai) */}
        <g className="pb-wave">
          <ellipse cx="200" cy="126" rx="8.5" ry="16" fill="#fff" stroke="#E2EEF6" strokeWidth="2" />
        </g>

        {/* Kepala */}
        <circle cx="174" cy="96" r="27" fill="#fff" stroke="#E2EEF6" strokeWidth="2" />

        {/* Telinga */}
        <circle cx="156" cy="77" r="9.5" fill="#fff" stroke="#E2EEF6" strokeWidth="2" />
        <circle cx="192" cy="77" r="9.5" fill="#fff" stroke="#E2EEF6" strokeWidth="2" />
        <circle cx="156" cy="77" r="4.5" fill="#FBD5E0" />
        <circle cx="192" cy="77" r="4.5" fill="#FBD5E0" />

        {/* Moncong */}
        <ellipse cx="174" cy="105" rx="13" ry="9.5" fill="#F2F9FE" />

        {/* Mata (kedip) */}
        <g className="pb-blink">
          <circle cx="165" cy="93" r="3.1" fill="#334155" />
          <circle cx="183" cy="93" r="3.1" fill="#334155" />
          <circle cx="166" cy="92" r="1" fill="#fff" />
          <circle cx="184" cy="92" r="1" fill="#fff" />
        </g>

        {/* Hidung & mulut */}
        <ellipse cx="174" cy="101" rx="3.8" ry="2.7" fill="#475569" />
        <path
          d="M174 104 v3.5 M174 107.5 q-4 3 -7.5 0 M174 107.5 q4 3 7.5 0"
          stroke="#94A3B8"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
