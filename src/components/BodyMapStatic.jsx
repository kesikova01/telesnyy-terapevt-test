import { BODY_ZONES } from '../data/bodyMap';

// Те же координаты зон, что и в BodyMap.jsx / ShareCard.jsx — статичный рисунок
// без интерактивности, для админки и печати.
const SPOTS = [
    ['jaw', 100, 46, 20], ['throat', 100, 64, 18], ['chest', 100, 107, 30], ['stomach', 100, 152, 26],
    ['shoulders', 68, 83, 18], ['shoulders', 132, 83, 18], ['hands', 35, 197, 16], ['hands', 165, 197, 16],
    ['lowerback', 100, 180, 26],
];

export default function BodyMapStatic({ bodyKey, extraZone, width = 150, strokeColor = '#94A3B8', heatColor = '#F97316', gradientId = 'bodyHeat' }) {
    const zones = BODY_ZONES[bodyKey] || BODY_ZONES.default;
    const activeZones = extraZone && !zones.includes(extraZone) ? [...zones, extraZone] : zones;
    const opacityFor = (zone) => (zone === activeZones[0] ? 0.85 : zone === activeZones[1] ? 0.4 : activeZones.includes(zone) ? 0.25 : 0);

    return (
        <svg viewBox="0 0 200 420" width={width} style={{ display: 'block', margin: '0 auto' }}>
            <defs>
                <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={heatColor} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={heatColor} stopOpacity="0" />
                </radialGradient>
            </defs>
            <g stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <circle cx="100" cy="35" r="26" />
                <path d="M92,58 L92,70 Q100,76 108,70 L108,58" />
                <path d="M70,80 Q100,66 130,80 L136,178 Q100,196 64,178 Z" />
                <path d="M70,82 Q40,110 35,190" />
                <path d="M130,82 Q160,110 165,190" />
                <circle cx="35" cy="197" r="7" />
                <circle cx="165" cy="197" r="7" />
                <path d="M78,193 L72,395" />
                <path d="M122,193 L128,395" />
                <path d="M72,395 L60,412" />
                <path d="M128,395 L140,412" />
            </g>
            {SPOTS.map(([zone, cx, cy, r]) => (
                <circle key={`${zone}-${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={`url(#${gradientId})`} opacity={opacityFor(zone)} />
            ))}
        </svg>
    );
}
