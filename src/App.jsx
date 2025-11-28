import "./App.css"; // <-- add this
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import * as XLSX from "xlsx";

// CONSTANTS
const TEAMS = [
  "Zen Volleys",
  "Karasuno",
  "Net Dominators",
  "Invincible",
  "Spike Veer",
  "NexVolley",
  "Spiked Punch",
  "T-Spike",
  "Maverick Storm",
];
const TEAM_CAPTAINS = {
  "Zen Volleys": "Ashish Maharana",
  "Karasuno": "Akash Singh",
  "Net Dominators": "Shani Shah",
  "Invincible": "Akash Nayak",
  "Spike Veer": "Divyesh Sapariya",
  "NexVolley": "Shafik Shaikh",
  "Spiked Punch": "MG",
  "T-Spike": "Tejash Patel",
  "Maverick Storm": "Mayank Chauhan",
};
const GROUPS = ["Group A", "Group B", "Group C"];
const WINNING_SCORE = 21;

// Utility Functions
const getFromStorage = (key, defaultValue) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const downloadCSV = (filename, rows) => {
  const csvContent = rows.map((row) =>
    row
      .map((cell) => {
        if (cell === null || cell === undefined) return "";
        const value = String(cell).replace(/"/g, '""');
        return /[",\n]/.test(value) ? `"${value}"` : value;
      })
      .join(",")
  );

  const blob = new Blob([csvContent.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const normalizeMatchResults = (raw) => {
  if (!raw || typeof raw !== "object") return {};

  return Object.entries(raw).reduce((acc, [matchId, value]) => {
    if (typeof value === "string") {
      acc[matchId] = { winner: value };
    } else if (value && typeof value === "object") {
      const normalized = {};
      if (typeof value.winner === "string") normalized.winner = value.winner;
      if (typeof value.opponentScore === "number")
        normalized.opponentScore = value.opponentScore;
      if (Object.keys(normalized).length > 0) acc[matchId] = normalized;
    }
    return acc;
  }, {});
};

const calculateScorePoints = (opponentScore) => {
  if (typeof opponentScore !== "number") return null;
  return Math.max(0, WINNING_SCORE - opponentScore);
};

// Wheel Component
// const SpinWheel = ({ items, onSpin, spinning, selectedItem }) => {
//   const [rotation, setRotation] = useState(0);

//   const handleSpin = () => {
//     if (spinning || items.length === 0) return;

//     const spins = 5;
//     const randomDegree = Math.floor(Math.random() * 360);
//     const totalRotation = spins * 360 + randomDegree;

//     setRotation(rotation + totalRotation);

//     setTimeout(() => {
//       const segmentAngle = 360 / items.length;
//       const normalizedRotation = totalRotation % 360;
//       const selectedIndex = Math.floor((360 - normalizedRotation) / segmentAngle) % items.length;
//       onSpin(items[selectedIndex]);
//     }, 3000);
//   };

//   const segmentAngle = 360 / items.length;

//   return (
//     <div className="flex flex-col items-center gap-6">
//       <div className="relative">
//         <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full blur-xl opacity-75 animate-pulse"></div>
//         <div
//           className="relative w-80 h-80 rounded-full border-8 border-yellow-400 shadow-2xl overflow-hidden"
//           style={{
//             transform: `rotate(${rotation}deg)`,
//             transition: spinning ? 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
//           }}
//         >
//           {items.map((item, index) => {
//             const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500'];
//             return (
//               <div
//                 key={index}
//                 className={`absolute w-full h-full ${colors[index % colors.length]} flex items-center justify-center text-white font-bold text-lg`}
//                 style={{
//                   transform: `rotate(${index * segmentAngle}deg)`,
//                   clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((segmentAngle * Math.PI) / 180)}%)`
//                 }}
//               >
//                 <span style={{ transform: `rotate(${segmentAngle / 2}deg)` }}>{item}</span>
//               </div>
//             );
//           })}
//         </div>
//         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-yellow-400 drop-shadow-lg z-10"></div>
//       </div>

//       <button
//         onClick={handleSpin}
//         disabled={spinning || items.length === 0}
//         className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-2xl rounded-full shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//       >
//         {spinning ? '🎰 SPINNING...' : '🎯 SPIN WHEEL'}
//       </button>

//       {selectedItem && (
//         <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse">
//           Selected: {selectedItem}
//         </div>
//       )}
//     </div>
//   );
// };

// const SpinWheel = ({ items, onSpin }) => {
//   const [rotation, setRotation] = useState(0);
//   const [isSpinning, setIsSpinning] = useState(false);
//   const [selectedItem, setSelectedItem] = useState(null);

//   const spinWheel = () => {
//     if (isSpinning || items.length === 0) return;

//     setIsSpinning(true);

//     const spins = 6; // number of full spins
//     const randomAngle = Math.floor(Math.random() * 360);

//     const finalRotation = rotation + spins * 360 + randomAngle;

//     setRotation(finalRotation);

//     const segmentAngle = 360 / items.length;

//     setTimeout(() => {
//       const normalized = finalRotation % 360;
//       const winningIndex =
//         Math.floor((360 - normalized) / segmentAngle) % items.length;

//       const selected = items[winningIndex];
//       setSelectedItem(selected);
//       onSpin && onSpin(selected);
//       setIsSpinning(false);
//     }, 3500);
//   };

//   // Build gradient for wheel colors
//   const buildWheelGradient = () => {
//     const segmentAngle = 360 / items.length;
//     return items
//       .map((item, i) => {
//         const start = i * segmentAngle;
//         const end = start + segmentAngle;
//         const color = [
//           "#f44336", "#3f51b5", "#4caf50", "#ff9800", "#9c27b0", "#e91e63",
//           "#03a9f4", "#009688", "#ff5722"
//         ][i % 9];
//         return `${color} ${start}deg ${end}deg`;
//       })
//       .join(", ");
//   };

//   return (
//     <div className="flex flex-col items-center gap-6 py-10">

//       {/* WHEEL WRAPPER */}
//       <div className="relative flex items-center justify-center">

//         {/* Glow behind wheel */}
//         <div className="absolute -inset-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full blur-2xl opacity-60 animate-pulse"></div>

//         {/* WHEEL */}
//         <div
//           className="relative w-80 h-80 rounded-full border-8 border-yellow-400 shadow-2xl flex items-center justify-center"
//           style={{
//             background: `conic-gradient(${buildWheelGradient()})`,
//             transform: `rotate(${rotation}deg)`,
//             transition: isSpinning
//               ? "transform 3.5s cubic-bezier(.17,.67,.24,1.02)"
//               : "none",
//           }}
//         >
//           {/* Wheel Labels */}
//           {items.map((item, i) => {
//             const angle = (360 / items.length) * i + (360 / items.length) / 2;
//             return (
//               <div
//                 key={i}
//                 className="absolute left-1/2 top-1/2 origin-left text-white font-bold"
//                 style={{
//                   transform: `rotate(${angle}deg) translateX(110px) rotate(-${angle}deg)`,
//                 }}
//               >
//                 {item}
//               </div>
//             );
//           })}
//         </div>

//         {/* POINTER */}
//         <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0
//                        border-l-[18px] border-l-transparent
//                        border-r-[18px] border-r-transparent
//                        border-b-[40px] border-b-yellow-400
//                        drop-shadow-xl z-20"></div>
//       </div>

//       {/* BUTTON */}
//       <button
//         onClick={spinWheel}
//         disabled={isSpinning}
//         className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white
//                    font-bold text-2xl rounded-full shadow-lg hover:shadow-2xl
//                    transform hover:scale-110 transition-all
//                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//       >
//         {isSpinning ? "🎰 Spinning..." : "🎯 Spin Wheel"}
//       </button>

//       {/* SELECTED RESULT */}
//       {selectedItem && (
//         <div className="text-3xl font-bold bg-clip-text text-transparent
//                         bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse">
//           Selected: {selectedItem}
//         </div>
//       )}
//     </div>
//   );
// };

/**
 * 3D Spin Wheel (labels rotate with wheel and remain readable)
 *
 * Props:
 * - items: string[]
 * - onSpin: (winner) => void
 *
 * Usage: <SpinWheel items={['A','B','C','D']} onSpin={winner => console.log(winner)} />
 */
const SpinWheel = ({ items = [], onSpin, onWinnerClick }) => {
  const [rotation, setRotation] = useState(0); // absolute rotation in degrees
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const wheelRef = useRef(null);

  const segmentAngle = 360 / Math.max(items.length, 1);
  const wheelSize = 420; // px (use same for CSS sizing below)
  const radius = wheelSize / 2;

  // Helper: build conic-gradient colors for segments
  const buildGradient = () => {
    const palette = [
      "#ff4d6d",
      "#4c7cff",
      "#20c997",
      "#ffb020",
      "#9b5cff",
      "#ff5ec7",
      "#00bcd4",
      "#7bed9f",
      "#ff7a45",
    ];
    return items
      .map((_, i) => {
        const start = i * segmentAngle;
        const end = start + segmentAngle;
        const color = palette[i % palette.length];
        return `${color} ${start}deg ${end}deg`;
      })
      .join(", ");
  };

  const handleSpin = () => {
    if (isSpinning || items.length === 0) return;
    setIsSpinning(true);
    setWinner(null);

    // control number of full spins and randomness
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6..8 full turns
    const randomOffset = Math.floor(Math.random() * 360); // 0..359
    const target = rotation + fullSpins * 360 + randomOffset;

    // start rotation
    setRotation(target);

    // duration should match CSS transition (ms)
    const durationMs = 3800;

    setTimeout(() => {
      // Determine winner by final normalized rotation
      const normalized = target % 360; // 0..359
      // pointer is at top (0deg). We compute which segment sits under pointer.
      // segment start angles increase clockwise; we need the index whose range contains (360 - normalized)
      const pointerDeg = (360 - normalized + 360) % 360;
      const index = Math.floor(pointerDeg / segmentAngle) % items.length;

      setWinner(items[index]);
      onSpin && onSpin(items[index]);
      setIsSpinning(false);
    }, durationMs + 40); // small buffer to ensure transition ended
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Outer glow */}
      <div
        style={{
          position: "relative",
          width: `${wheelSize}px`,
          height: `${wheelSize}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-22px",
            borderRadius: "9999px",
            background:
              "linear-gradient(90deg, rgba(124,58,237,0.18), rgba(236,72,153,0.14), rgba(59,130,246,0.18))",
            filter: "blur(30px)",
            zIndex: 0,
          }}
        />

        {/* Pointer (top) */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "-10px",
            transform: "translateX(-50%) rotate(180deg)",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "20px solid transparent",
              borderRight: "20px solid transparent",
              borderBottom: "40px solid rgb(124, 246, 76)",
              borderRadius: "4px",
            }}
          />
        </div>

        {/* Wheel frame */}
        <div
          ref={wheelRef}
          style={{
            width: `${wheelSize}px`,
            height: `${wheelSize}px`,
            borderRadius: "9999px",
            border: "12px solid rgba(246,200,76,0.95)",
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 10,
            boxShadow:
              "0 30px 60px rgba(0,0,0,0.55), inset 0 10px 30px rgba(0,0,0,0.35)",
            // rotating the whole wheel (including labels)
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 3.8s cubic-bezier(.17,.67,.24,1.02)"
              : "transform 300ms ease",
            // glossy overlays:
            background: `conic-gradient(${buildGradient()})`,
            overflow: "visible",
          }}
        >
          {/* radial glossy highlight (overlay) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "9999px",
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 28% 25%, rgba(255,255,255,0.28), rgba(255,255,255,0.06) 20%, rgba(0,0,0,0) 40%)",
              mixBlendMode: "screen",
              zIndex: 25,
            }}
          />

          {/* inner shadow to give depth */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "9999px",
              boxShadow: "inset 0 12px 30px rgba(0,0,0,0.45)",
              zIndex: 24,
            }}
          />

          {/* center hub */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              width: "88px",
              height: "88px",
              borderRadius: "9999px",
              background:
                "linear-gradient(135deg, rgba(255,241,118,1), rgba(255,200,60,1))",
              border: "4px solid rgba(255,245,200,0.95)",
              boxShadow:
                "inset 0 6px 14px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.45)",
              zIndex: 30,
            }}
          />

          {/* Labels - these are inside the rotating element so they rotate with it */}
          {items.map((label, i) => {
            // midpoint angle (deg) of the slice (0deg at top; increases clockwise)
            const mid = i * segmentAngle + segmentAngle / 2;

            // Convert degrees to CSS transform: first rotate to slice angle,
            // then translate along negative Y to push the label outward from center.
            // We render the label text rotated so that it reads outward:
            // If the label would be upside-down (angle between 90..270), flip by 180deg.
            const shouldFlip = mid > 90 && mid < 270;

            // distance from center to text. Tune multiplier to place text inside slice.
            const distance = radius * 0.56;

            return (
              <div
                key={i}
                role="listitem"
                aria-label={`slice-${i}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "160px",
                  height: "34px",
                  marginLeft: "-80px", // center horizontally (half width)
                  marginTop: "-17px", // center vertically (half height)
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                  zIndex: 28,
                  pointerEvents: "none",
                  // transform order: rotate slice -> translate outward -> optionally rotate text to face outward
                  transform: `rotate(${mid}deg) translate(0, -${distance}px) rotate(${shouldFlip ? 180 : 0
                    }deg)`,
                  transformOrigin: "center center",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    letterSpacing: "0.2px",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    // subtle bevel text effect
                    textShadow:
                      "0 1px 0 rgba(255,255,255,0.08), 0 3px 10px rgba(0,0,0,0.45)",
                    padding: "0 6px",
                    maxWidth: "100%",
                    textAlign: "left",
                    transform: `rotate(90deg)`,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || items.length === 0}
        style={{
          padding: "14px 36px",
          borderRadius: "9999px",
          fontSize: "18px",
          fontWeight: 800,
          color: "white",
          background: "linear-gradient(90deg,#6b21a8,#ec4899)",
          boxShadow: "0 12px 40px rgba(99,102,241,0.25)",
          transform: isSpinning ? "scale(1)" : "translateZ(0)",
          cursor: isSpinning ? "not-allowed" : "pointer",
          opacity: isSpinning ? 0.6 : 1,

        }}
      >
        {isSpinning ? "🎰 Spinning..." : "🎯 SPIN"}
      </button>

      {/* Winner */}
      {winner && (
        <div
          onClick={() => onWinnerClick && onWinnerClick(winner)}
          style={{
            marginTop: 20,
            padding: "16px 32px",
            borderRadius: "16px",
            fontSize: 28,
            fontWeight: 900,
            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))",
            border: "3px solid #fbbf24",
            // borderImage: "linear-gradient(90deg, #fbbf24, #f59e0b, #eab308) 1",
            boxShadow: "0 8px 32px rgba(251, 191, 36, 0.4), 0 0 20px rgba(245, 158, 11, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1)",
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: "#fff",
            textShadow: "0 0 20px rgba(251, 191, 36, 0.8), 0 0 30px rgba(245, 158, 11, 0.6), 0 4px 8px rgba(0, 0, 0, 0.5)",
            animation: "pulse 2s ease-in-out infinite",
            position: "relative",
            overflow: "hidden",
            cursor: onWinnerClick ? "pointer" : "default",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            if (onWinnerClick) {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(251, 191, 36, 0.6), 0 0 30px rgba(245, 158, 11, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (onWinnerClick) {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(251, 191, 36, 0.4), 0 0 20px rgba(245, 158, 11, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1)";
            }
          }}
        >
          <style>{`
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 8px 32px rgba(251, 191, 36, 0.4), 0 0 20px rgba(245, 158, 11, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1);
              }
              50% {
                transform: scale(1.05);
                box-shadow: 0 12px 40px rgba(251, 191, 36, 0.6), 0 0 30px rgba(245, 158, 11, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.2);
              }
            }
          `}</style>
          <span
            style={{
              color: "#fbbf24",
              textShadow: "0 0 10px rgba(251, 191, 36, 0.8), 0 0 20px rgba(245, 158, 11, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8)",
            }}
          >
            <span
              style={{
                color: "#fbbf24",
                width: "100%",
                display: "inline-block"
              }}
            >
              {winner}
            </span>
          </span>
          {winner && TEAM_CAPTAINS[winner] && (
            <div style={{
              marginTop: 12,
              fontSize: 18,
              color: "#fcd34d",
              textShadow: "0 0 8px rgba(251, 191, 36, 0.6), 0 2px 4px rgba(0, 0, 0, 0.5)",
              fontWeight: 600,
              textAlign: "center"
            }}>
              👤 Captain: {TEAM_CAPTAINS[winner]}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Team Assignment Page
const TeamPage = () => {
  const [users] = useState(getFromStorage("users", []));
  const [assignments, setAssignments] = useState(
    getFromStorage("assignments", {})
  );
  const [availableTeams, setAvailableTeams] = useState(
    getFromStorage("availableTeams", TEAMS)
  );
  const [spinning, setSpinning] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState(null);

  useEffect(() => {
    saveToStorage("users", users);
    saveToStorage("assignments", assignments);
    saveToStorage("availableTeams", availableTeams);
  }, [users, assignments, availableTeams]);

  const unassignedUsers = users.filter((user) => !assignments[user]);

  const handleSpin = (team) => {
    setSpinning(true);
    setSelectedTeam(team);

    setSpinning(false);
  };

  const handleUserSelect = (user) => {
    const teamToAssign = selectedTeam || winnerTeam;
    const newAssignments = { ...assignments, [user]: teamToAssign };
    setAssignments(newAssignments);

    const newAvailableTeams = availableTeams.filter((t) => t !== teamToAssign);

    if (newAvailableTeams.length === 0) {
      setAvailableTeams(TEAMS);
    } else {
      setAvailableTeams(newAvailableTeams);
    }

    setSelectedTeam(null);
    setShowWinnerModal(false);
    setWinnerTeam(null);

    updateExcel(user, teamToAssign);
  };

  const handleWinnerClick = (team) => {
    setWinnerTeam(team);
    setShowWinnerModal(true);
  };

  const updateExcel = (user, team) => {
    // This would update the Excel file
    console.log(`Assigning ${user} to ${team}`);
  };

  const handleResetTeams = () => {
    if (
      window.confirm(
        "Reset team assignments? This will clear all assignments and available teams so you can reassign from scratch."
      )
    ) {
      setAssignments({});
      setAvailableTeams(TEAMS);
      setSelectedTeam(null);
    }
  };

  const handleDownloadTeams = () => {
    const rows = [
      ["Generated At", new Date().toLocaleString()],
      ["Progress", `${progress}/${total}`],
      [],
      ["User", "Team"],
    ];

    users.forEach((user) => {
      rows.push([user, assignments[user] || "Unassigned"]);
    });

    rows.push([]);
    rows.push(["Team", "Members"]);
    TEAMS.forEach((team) => {
      rows.push([team, (teamAssignments[team] || []).join(" | ")]);
    });

    downloadCSV("team-assignments.csv", rows);
  };

  const teamAssignments = TEAMS.reduce((acc, team) => {
    acc[team] = Object.entries(assignments)
      .filter(([, t]) => t === team)
      .map(([user]) => user);
    return acc;
  }, {});

  const progress = Object.keys(assignments).length;
  const total = users.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8 overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-600">
          🎮 Crest Volleyball Tournament
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-2xl font-bold">
            Progress: {progress}/{total}
          </div>
          <button
            onClick={handleDownloadTeams}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-bold hover:from-blue-700 hover:to-cyan-600 transition-all transform hover:scale-105"
          >
            ⬇️ Download Teams
          </button>
          <button
            onClick={handleResetTeams}
            className="px-5 py-3 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg font-bold hover:from-red-700 hover:to-orange-600 transition-all transform hover:scale-105"
          >
            🔄 Reset Teams
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 w-full">
        <div className="grid grid-cols-2 gap-2 space-y-4">
          {TEAMS.slice(0, Math.ceil(TEAMS.length / 2)).map((team) => (
            <div
              key={team}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-4 border border-purple-500"
            >
              <h3 className="text-2xl font-bold mb-2 text-yellow-400 underline decoration-2 decoration-yellow-400">
                {team}
              </h3>
              <div className="text-sm text-blue-400 mb-2 font-semibold">
                Captain: {TEAM_CAPTAINS[team] || "N/A"}
              </div>
              <div className="text-base text-gray-300 text-left space-y-1">
                {teamAssignments[team].length > 0 ? (
                  teamAssignments[team].map((user) => (
                    <div key={user} className="text-sm">• {user}</div>
                  ))
                ) : (
                  <div className="text-gray-500 italic text-center">No members yet</div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Members: {teamAssignments[team].length}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center items-center">
          <SpinWheel
            items={availableTeams}
            onSpin={handleSpin}
            spinning={spinning}
            selectedItem={selectedTeam}
            onWinnerClick={handleWinnerClick}
          />

          {/* {showUserSelect && unassignedUsers.length > 0 && (
            <div className="mt-6 max-h-48 overflow-y-auto bg-gray-800 bg-opacity-90 backdrop-blur-lg rounded-lg p-4 w-80">
              <h3 className="text-lg font-bold mb-2 text-center text-yellow-400">
                Select User
              </h3>
              <div className="space-y-2">
                {unassignedUsers.map((user) => (
                  <button
                    key={user}
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                  >
                    {user}
                  </button>
                ))}
              </div>
            </div>
          )} */}
        </div>

        <div className="grid grid-cols-2 gap-2 space-y-4">
          {TEAMS.slice(Math.ceil(TEAMS.length / 2)).map((team) => (
            <div
              key={team}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-4 border border-purple-500"
            >
              <h3 className="text-2xl font-bold mb-2 text-yellow-400 underline decoration-2 decoration-yellow-400">
                {team}
              </h3>
              <div className="text-sm text-blue-400 mb-2 font-semibold">
                Captain: {TEAM_CAPTAINS[team] || "N/A"}
              </div>
              <div className="text-base text-gray-300 text-left space-y-1">
                {teamAssignments[team].length > 0 ? (
                  teamAssignments[team].map((user) => (
                    <div key={user} className="text-sm">• {user}</div>
                  ))
                ) : (
                  <div className="text-gray-500 italic text-center">No members yet</div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Members: {teamAssignments[team].length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winner Team Modal */}
      {showWinnerModal && winnerTeam && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowWinnerModal(false);
            setWinnerTeam(null);
          }}
        >
          <div
            className="bg-gray-800 bg-opacity-95 backdrop-blur-lg rounded-xl p-8 border-2 border-yellow-400 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-yellow-400">
                👤 Select player for {winnerTeam} by{" "}
                {winnerTeam && TEAM_CAPTAINS[winnerTeam] && (
                  <span className="text-blue-400">
                    {TEAM_CAPTAINS[winnerTeam]}
                  </span>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowWinnerModal(false);
                  setWinnerTeam(null);
                }}
                className="text-gray-400 hover:text-white text-3xl font-bold transition-all"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-300 mb-4">
              {unassignedUsers.length} user{unassignedUsers.length !== 1 ? 's' : ''} available
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {unassignedUsers.map((user) => (
                  <button
                    key={user}
                    onClick={() => handleUserSelect(user)}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 text-base font-semibold text-white shadow-lg hover:shadow-xl border border-transparent hover:border-yellow-300"
                  >
                    {user}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Static Group Assignments
const STATIC_GROUP_ASSIGNMENTS = {
  "Group A": ["T-Spike", "Spiked Punch", "Karasuno"],
  "Group B": ["Net Dominators", "NexVolley", "Invincible"],
  "Group C": ["Zen Volleys", "Maverick Storm", "Spike Veer"],
};

// Group Assignment Page
const GroupPage = () => {
  // Initialize with static assignments if no stored data exists
  const getInitialGroupAssignments = () => {
    const stored = getFromStorage("groupAssignments", {});
    // If storage is empty or doesn't have all groups, use static assignments
    if (Object.keys(stored).length === 0 || 
        !stored["Group A"] || !stored["Group B"] || !stored["Group C"]) {
      return STATIC_GROUP_ASSIGNMENTS;
    }
    return stored;
  };

  const initialAssignments = getInitialGroupAssignments();
  const [groupAssignments, setGroupAssignments] = useState(initialAssignments);
  
  // Calculate available teams based on current assignments
  const getAllAssignedTeams = (assignments) => {
    return Object.values(assignments).flat();
  };
  
  const [availableTeams, setAvailableTeams] = useState(() => {
    const stored = getFromStorage("groupAvailableTeams", null);
    if (stored !== null) {
      return stored;
    }
    // If no stored data, all teams are assigned, so available teams is empty
    const assignedTeams = getAllAssignedTeams(initialAssignments);
    return TEAMS.filter(team => !assignedTeams.includes(team));
  });
  
  const [currentGroupIndex, setCurrentGroupIndex] = useState(
    getFromStorage("currentGroupIndex", 0)
  );
  const [spinning, setSpinning] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Initialize static assignments on first load if needed
  useEffect(() => {
    const stored = getFromStorage("groupAssignments", {});
    if (Object.keys(stored).length === 0 || 
        !stored["Group A"] || !stored["Group B"] || !stored["Group C"]) {
      setGroupAssignments(STATIC_GROUP_ASSIGNMENTS);
      setAvailableTeams([]);
    }
  }, []);

  useEffect(() => {
    saveToStorage("groupAvailableTeams", availableTeams);
    saveToStorage("groupAssignments", groupAssignments);
    saveToStorage("currentGroupIndex", currentGroupIndex);
  }, [availableTeams, groupAssignments, currentGroupIndex]);

  const handleSpin = (team) => {
    setSpinning(true);
    setSelectedTeam(team);

    setSpinning(false);

    const currentGroup = GROUPS[currentGroupIndex];
    const newGroupAssignments = {
      ...groupAssignments,
      [currentGroup]: [...(groupAssignments[currentGroup] || []), team],
    };
    setGroupAssignments(newGroupAssignments);

    const newAvailableTeams = availableTeams.filter((t) => t !== team);
    setAvailableTeams(newAvailableTeams);

    const nextGroupIndex = (currentGroupIndex + 1) % GROUPS.length;
    setCurrentGroupIndex(nextGroupIndex);

    setSelectedTeam(null);
  };

  const handleResetGroups = () => {
    if (window.confirm("Are you sure you want to reset all group assignments? This will clear all teams from groups and allow you to reallocate them.")) {
      setGroupAssignments({});
      setAvailableTeams(TEAMS);
      setCurrentGroupIndex(0);
      // Also clear group winners since they depend on group assignments
      saveToStorage("groupWinners", {});
    }
  };

  const handleDownloadGroups = () => {
    const rows = [
      ["Generated At", new Date().toLocaleString()],
      ["Current Group", GROUPS[currentGroupIndex]],
      [],
      ["Group", "Teams"],
    ];

    GROUPS.forEach((group) => {
      const teams = groupAssignments[group] || [];
      rows.push([group, teams.join(" | ") || ""]);
    });

    rows.push([]);
    rows.push(["Available Teams", availableTeams.join(" | ") || ""]);

    downloadCSV("group-assignments.csv", rows);
  };

  const currentGroup = GROUPS[currentGroupIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8 overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-400">
          🎯 Group Assignment
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadGroups}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-bold hover:from-blue-700 hover:to-cyan-600 transition-all transform hover:scale-105"
          >
            ⬇️ Download Groups
          </button>
          <button
            onClick={handleResetGroups}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-bold hover:from-red-700 hover:to-orange-700 transition-all transform hover:scale-105"
          >
            🔄 Reset Groups
          </button>
        </div>
      </div>
      <div className="grid w-full grid-cols-3 gap-8 h-[calc(100vh-200px)]">
        <div className="flex flex-col justify-center space-y-4">
          {GROUPS.slice(0, Math.ceil(GROUPS.length / 2)).map((group) => (
            <div
              key={group}
              className={`bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-6 border-2 ${currentGroup === group
                  ? "border-yellow-400 animate-pulse"
                  : "border-blue-500"
                }`}
            >
              <h3 className="text-2xl font-bold mb-3 text-green-400">
                {group}
              </h3>
              <div className="space-y-1">
                {(groupAssignments[group] || []).map((team) => (
                  <div
                    key={team}
                    className="text-lg bg-blue-600 bg-opacity-30 rounded px-3 py-2"
                  >
                    🏆 {team}
                    <div className="text-xs text-blue-200 mt-1">
                      👤 {TEAM_CAPTAINS[team] || "N/A"}
                    </div>
                  </div>
                ))}
                {!groupAssignments[group]?.length && (
                  <div className="text-gray-500 italic">No teams yet</div>
                )}
              </div>
              <div className="text-2xl text-gray-400 mt-3">
                Teams: {(groupAssignments[group] || []).length}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center items-center">
          {availableTeams.length > 0 && (
            <div className="mb-4 text-2xl font-bold text-yellow-400 animate-bounce">
              Next: {currentGroup}
            </div>
          )}

          <SpinWheel
            items={availableTeams}
            onSpin={handleSpin}
            spinning={spinning}
            selectedItem={selectedTeam}
          />

          {availableTeams.length === 0 && (
            <div className="mt-6 text-3xl font-bold text-green-400 animate-pulse">
              ✅ All Teams Assigned!
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center space-y-4">
          {GROUPS.slice(Math.ceil(GROUPS.length / 2)).map((group) => (
            <div
              key={group}
              className={`bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-6 border-2 ${currentGroup === group
                  ? "border-yellow-400 animate-pulse"
                  : "border-blue-500"
                }`}
            >
              <h3 className="text-2xl font-bold mb-3 text-green-400">
                {group}
              </h3>
              <div className="space-y-1">
                {(groupAssignments[group] || []).map((team) => (
                  <div
                    key={team}
                    className="text-lg bg-blue-600 bg-opacity-30 rounded px-3 py-2"
                  >
                    🏆 {team}
                    <div className="text-xs text-blue-200 mt-1">
                      👤 {TEAM_CAPTAINS[team] || "N/A"}
                    </div>
                  </div>
                ))}
                {!groupAssignments[group]?.length && (
                  <div className="text-gray-500 italic">No teams yet</div>
                )}
              </div>
              <div className="text-2xl text-gray-400 mt-3">
                Teams: {(groupAssignments[group] || []).length}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Game Time Slots Page
const GameTimeSlotsPage = () => {
  const [groupAssignments] = useState(
    getFromStorage("groupAssignments", {})
  );
  const [groupWinners, setGroupWinners] = useState(
    getFromStorage("groupWinners", {})
  );
  const [matchResults, setMatchResults] = useState(() =>
    normalizeMatchResults(getFromStorage("matchResults", {}))
  );
  const [startTime, setStartTime] = useState(() => {
    const stored = getFromStorage("gameStartTime", "14:00");
    // If stored time is 09:00 (old default), reset to 14:00
    if (stored === "09:00") {
      saveToStorage("gameStartTime", "14:00");
      return "14:00";
    }
    return stored;
  });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    saveToStorage("groupWinners", groupWinners);
    saveToStorage("matchResults", matchResults);
    saveToStorage("gameStartTime", startTime);
  }, [groupWinners, matchResults, startTime]);

  // Trigger confetti when Grand Final winner is selected
  useEffect(() => {
    const grandFinalResult = matchResults["final-match-3"];
    if (grandFinalResult?.winner) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 180000); // 3 minutes = 180000 milliseconds
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [matchResults]);

  // Helper function to organize teams into trios (3 teams per group)
  const organizeIntoTrios = (teams) => {
    const trios = [];
    for (let i = 0; i < teams.length; i += 3) {
      const trio = teams.slice(i, i + 3);
      if (trio.length === 3) {
        trios.push(trio);
      } else if (trio.length > 0) {
        // If less than 3 teams remain, add them to the last trio or create a match with available teams
        if (trios.length > 0) {
          trios[trios.length - 1] = [...trios[trios.length - 1], ...trio];
        } else {
          trios.push(trio);
        }
      }
    }
    return trios;
  };

  // Generate dynamic matches for a trio based on results
  // First match: A vs B, then loser plays C, and so on
  const generateTrioMatchesDynamic = (trio, group, trioIndex, matchResults) => {
    const matches = [];
    const [teamA, teamB, teamC] = trio;
    if (!teamA || !teamB || !teamC) return matches;

    const buildMatchEntry = (id, team1, team2) => {
      const result = matchResults[id] || {};
      return {
        id,
        team1,
        team2,
        display: `${team1} vs ${team2}`,
        matchNumber: null,
        time: null,
        status: result.winner ? "completed" : "pending",
        winner: result.winner || null,
        opponentScore:
          typeof result.opponentScore === "number"
            ? result.opponentScore
            : undefined,
      };
    };

    const match1Id = `group-${group}-trio-${trioIndex}-match-1`;
    const match1 = buildMatchEntry(match1Id, teamA, teamB);
    matches.push(match1);

    if (match1.winner) {
      const match1Loser = match1.winner === teamA ? teamB : teamA;
      const match2Id = `group-${group}-trio-${trioIndex}-match-2`;
      const match2 = buildMatchEntry(match2Id, match1Loser, teamC);
      matches.push(match2);

      const match3Id = `group-${group}-trio-${trioIndex}-match-3`;
      const match3 = buildMatchEntry(match3Id, match1.winner, teamC);
      matches.push(match3);
    }

    return matches;
  };

  // Helper function to format time (24-hour format for calculations)
  const formatTime = (timeString, minutesToAdd) => {
    const [hours, mins] = timeString.split(":").map(Number);
    const totalMinutes = hours * 60 + mins + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(
      2,
      "0"
    )}`;
  };

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (timeString) => {
    const [hours, mins] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${String(mins).padStart(2, "0")} ${period}`;
  };

  // Generate group stage matches (interleaved by group: A, B, C, A, B, C...)
  // Matches are generated dynamically based on results
  const generateGroupStageMatches = useCallback(() => {
    // First, collect all matches from all groups (dynamically based on results)
    const matchesByGroup = {};

    GROUPS.forEach((group) => {
      const teams = groupAssignments[group] || [];
      if (teams.length === 0) return;

      const trios = organizeIntoTrios(teams);
      const groupMatches = [];

      trios.forEach((trio, trioIndex) => {
        // Generate dynamic matches based on results
        const trioMatches = generateTrioMatchesDynamic(trio, group, trioIndex, matchResults);

        trioMatches.forEach((match) => {
          groupMatches.push({
            ...match,
            group: group,
            stage: "Group Stage",
            duration: 30,
          });
        });
      });

      matchesByGroup[group] = groupMatches;
    });

    // Now interleave matches by rotating through groups: A, B, C, A, B, C...
    // Only schedule matches that are pending or completed
    const allMatches = [];
    let currentTime = startTime;
    let matchNumber = 1;
    let maxMatches = 0;

    // Find the maximum number of matches in any group
    Object.values(matchesByGroup).forEach((matches) => {
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
      }
    });

    // Interleave matches by rotating through groups
    for (let round = 0; round < maxMatches; round++) {
      GROUPS.forEach((group) => {
        const groupMatches = matchesByGroup[group] || [];
        if (groupMatches[round] && groupMatches[round].status !== 'locked') {
          // Only schedule if match is pending or completed
          const match = {
            ...groupMatches[round],
            matchNumber: matchNumber++,
            time: currentTime,
          };
          allMatches.push(match);
          // Only advance time if match is scheduled (not locked)
          if (match.status === 'pending' || match.status === 'completed') {
            currentTime = formatTime(currentTime, 30);
          }
        }
      });
    }

    return allMatches;
  }, [groupAssignments, matchResults, startTime]);

  const groupMatches = useMemo(
    () => generateGroupStageMatches(),
    [generateGroupStageMatches]
  );

  // Calculate group winner stats from groupMatches only (not allMatches to avoid circular dependency)
  const groupWinnerStats = useMemo(() => {
    const stats = {};
    GROUPS.forEach((group) => {
      const groupMatchList = groupMatches.filter((m) => m.group === group);
      if (!groupMatchList.length) return;

      const wins = {};
      groupMatchList.forEach((match) => {
        const result = matchResults[match.id];
        if (result?.winner) {
          if (!wins[result.winner]) {
            wins[result.winner] = { wins: 0, points: 0 };
          }
          wins[result.winner].wins += 1;
          if (typeof result.opponentScore === "number") {
            wins[result.winner].points += calculateScorePoints(
              result.opponentScore
            );
          }
        }
      });

      const groupTeams = groupAssignments[group] || [];
      const uniqueWinTeams = Object.keys(wins);
      const tieScenario =
        groupTeams.length > 0 &&
        uniqueWinTeams.length === groupTeams.length &&
        groupTeams.every((team) => wins[team]?.wins === 1);

      let winnerCandidate = null;

      if (tieScenario) {
        const sortedByPoints = [...uniqueWinTeams].sort((a, b) => {
          const aPoints = wins[a]?.points ?? 0;
          const bPoints = wins[b]?.points ?? 0;
          return bPoints - aPoints;
        });

        if (sortedByPoints.length) {
          const top = sortedByPoints[0];
          const second = sortedByPoints[1];
          if (
            second &&
            (wins[top]?.points ?? 0) === (wins[second]?.points ?? 0)
          ) {
            winnerCandidate =
              groupMatchList[groupMatchList.length - 1]?.winner || top;
          } else {
            winnerCandidate = top;
          }
        }
      } else {
        winnerCandidate = groupMatchList[groupMatchList.length - 1]?.winner || null;
      }

      stats[group] = {
        winner: winnerCandidate,
        points: winnerCandidate ? wins[winnerCandidate]?.points ?? 0 : 0,
      };
    });
    return stats;
  }, [groupMatches, matchResults, groupAssignments]);

  const finalMatches = useMemo(() => {
    const seeds = GROUPS.map((group) => {
      const info = groupWinnerStats[group];
      if (!info?.winner) return null;
      return {
        group,
        winner: info.winner,
        points: info.points ?? 0,
      };
    }).filter(Boolean);

    if (seeds.length < 2) return [];

    const sorted = [...seeds].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.winner.localeCompare(b.winner);
    });

    const matches = [];
    let currentTime = startTime;
    if (groupMatches.length > 0) {
      const lastMatch = groupMatches[groupMatches.length - 1];
      currentTime = formatTime(lastMatch.time, lastMatch.duration);
    }

    let matchCounter = groupMatches.length + 1;

    const scheduleMatch = ({ id, team1, team2, label, ready }) => {
      const result = matchResults[id];
      const status = ready
        ? result?.winner
          ? "completed"
          : "pending"
        : "locked";

      matches.push({
        id,
        group: "Final Stage",
        stage: label,
        matchNumber: matchCounter++,
        time: currentTime,
        duration: 30,
        team1,
        team2,
        display: `${team1} vs ${team2}`,
        status,
        winner: result?.winner || null,
        opponentScore:
          typeof result?.opponentScore === "number"
            ? result.opponentScore
            : undefined,
      });

      currentTime = formatTime(currentTime, 30);
    };

    const topSeed = sorted[0];
    const secondSeed = sorted[1];
    const thirdSeed = sorted[2];

    const semiId = "final-match-1";
    scheduleMatch({
      id: semiId,
      team1: topSeed.winner,
      team2: secondSeed.winner,
      label: sorted.length === 2 ? "Grand Final" : "Semi Final",
      ready: true,
    });

    if (!thirdSeed) {
      return matches;
    }

    const semiWinner = matchResults[semiId]?.winner;
    const semiLoser = semiWinner
      ? semiWinner === topSeed.winner
        ? secondSeed.winner
        : topSeed.winner
      : null;

    const qualifierId = "final-match-2";
    scheduleMatch({
      id: qualifierId,
      team1: semiLoser || "Loser of Match 1",
      team2: thirdSeed.winner,
      label: "Qualifier",
      ready: Boolean(semiLoser),
    });

    const qualifierWinner = matchResults[qualifierId]?.winner;
    const finalId = "final-match-3";
    scheduleMatch({
      id: finalId,
      team1: semiWinner || "Winner of Match 1",
      team2: qualifierWinner || "Winner of Match 2",
      label: "Grand Final",
      ready: Boolean(semiWinner && qualifierWinner),
    });

    return matches;
  }, [groupMatches, groupWinnerStats, matchResults, startTime]);
  const allMatches = useMemo(
    () => [...groupMatches, ...finalMatches],
    [groupMatches, finalMatches]
  );

  const teamPoints = useMemo(() => {
    const totals = {};
    Object.values(matchResults).forEach((result) => {
      if (result?.winner && typeof result.opponentScore === "number") {
        const points = calculateScorePoints(result.opponentScore);
        totals[result.winner] = (totals[result.winner] || 0) + points;
      }
    });
    return totals;
  }, [matchResults]);

  // Group matches by group for display
  const matchesByGroup = useMemo(() => {
    const map = {};
    allMatches.forEach((match) => {
      if (!map[match.group]) {
        map[match.group] = [];
      }
      map[match.group].push(match);
    });
    return map;
  }, [allMatches]);

  const handleSetMatchWinner = (matchId, winner) => {
    setMatchResults((prev) => {
      const next = { ...prev };
      if (!winner) {
        if (next[matchId]) {
          delete next[matchId].winner;
          if (
            next[matchId].winner === undefined &&
            next[matchId].opponentScore === undefined
          ) {
            delete next[matchId];
          }
        }
      } else {
        next[matchId] = {
          ...(next[matchId] || {}),
          winner,
        };
      }
      return next;
    });
  };

  const handleSetOpponentScore = (matchId, score) => {
    setMatchResults((prev) => {
      const next = { ...prev };
      const parsed = Number(score);
      const numericScore =
        score === "" || score === null || Number.isNaN(parsed)
          ? undefined
          : Math.max(0, Math.min(WINNING_SCORE - 1, parsed));

      if (numericScore === undefined) {
        if (next[matchId]) {
          delete next[matchId].opponentScore;
          if (
            next[matchId].winner === undefined &&
            next[matchId].opponentScore === undefined
          ) {
            delete next[matchId];
          }
        }
      } else {
        next[matchId] = {
          ...(next[matchId] || {}),
          opponentScore: numericScore,
        };
      }

      return next;
    });
  };

  useEffect(() => {
    setGroupWinners((prev) => {
      let changed = false;
      const next = { ...prev };

      GROUPS.forEach((group) => {
        const winnerEntry = groupWinnerStats[group];
        if (winnerEntry?.winner && next[group] !== winnerEntry.winner) {
          next[group] = winnerEntry.winner;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [groupWinnerStats]);

  const handleResetTimeSlots = () => {
    if (
      window.confirm(
        "Reset all time slots? This clears match winners and group winners so you can reschedule from scratch."
      )
    ) {
      setMatchResults({});
      setGroupWinners({});
    }
  };

  const handleDownloadSchedule = () => {
    const rows = [
      ["Generated At", new Date().toLocaleString()],
      ["Start Time", startTime],
      [],
      [
        "Match #",
        "Group",
        "Stage",
        "Time",
        "Pairing",
        "Winner",
        "Opponent Score",
        "Score Points",
      ],
    ];

    allMatches.forEach((match) => {
      const result = matchResults[match.id] || {};
      const opponentScore =
        typeof result.opponentScore === "number" ? result.opponentScore : "";
      const scorePoints =
        typeof result.opponentScore === "number"
          ? calculateScorePoints(result.opponentScore)
          : "";

      rows.push([
        match.matchNumber,
        match.group,
        match.stage,
        match.time ? formatTime12Hour(match.time) : "",
        match.display,
        result.winner || "",
        opponentScore,
        scorePoints,
      ]);
    });

    rows.push([]);
    rows.push(["Group Winners"]);
    rows.push(["Group", "Winner"]);
    GROUPS.forEach((group) => {
      rows.push([group, groupWinners[group] || ""]);
    });

    downloadCSV("time-slots.csv", rows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 text-white p-8">
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400">
            ⏰ Game Time Slots
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadSchedule}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-bold hover:from-blue-700 hover:to-cyan-600 transition-all transform hover:scale-105"
            >
              ⬇️ Download Time Slots
            </button>
            <button
              onClick={handleResetTimeSlots}
              className="px-5 py-3 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg font-bold hover:from-red-700 hover:to-orange-600 transition-all transform hover:scale-105"
            >
              🔄 Reset Time Slots
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-lg font-bold text-yellow-400">
            Start Time:
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {GROUPS.map((group) => {
          const groupTeams = groupAssignments[group] || [];
          const matches = matchesByGroup[group] || [];
          const winner = groupWinners[group];

          return (
            <div
              key={group}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-6 border-2 border-green-500"
            >
              <h2 className="text-2xl font-bold mb-4 text-green-400">
                {group}
              </h2>

              {groupTeams.length === 0 ? (
                <div className="text-gray-500 italic">
                  No teams assigned to this group
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-2 text-yellow-400">
                      Teams ({groupTeams.length}):
                    </h3>
                    <div className="space-y-1">
                      {groupTeams.map((team) => (
                        <div
                          key={team}
                          className="text-sm bg-green-600 bg-opacity-30 rounded px-3 py-1"
                        >
                          {team}
                          <div className="text-xs text-green-200 mt-1">
                            👤 {TEAM_CAPTAINS[team] || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-2 text-yellow-400">
                      Matches:
                    </h3>
                    <div className="space-y-3">
                      {matches.map((match) => (
                        <div
                          key={match.id}
                          className={`bg-gray-700 bg-opacity-50 rounded-lg p-3 border ${match.status === 'completed'
                              ? 'border-green-500'
                              : match.status === 'pending'
                                ? 'border-yellow-400'
                                : 'border-gray-600'
                            }`}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Match #{match.matchNumber}
                            {match.status === 'completed' && ' ✓'}
                          </div>
                          {match.time && (
                            <div className="text-sm font-bold text-yellow-300 mb-2">
                              {formatTime12Hour(match.time)} - {formatTime12Hour(formatTime(match.time, 30))} (30 min)
                            </div>
                          )}
                          <div className="text-base font-bold text-white text-center py-2 bg-green-600 bg-opacity-30 rounded mb-2">
                            {match.display}
                          </div>
                          {match.status === 'pending' || match.status === 'completed' ? (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-bold mb-1 mt-4 text-yellow-400">
                                  Select Winner:
                                </label>
                                <select
                                  value={match.winner || ""}
                                  onChange={(e) =>
                                    handleSetMatchWinner(match.id, e.target.value)
                                  }
                                  className="w-full px-2 py-1 text-sm bg-gray-600 rounded border border-gray-500 text-white"
                                >
                                  <option value="">Select winner...</option>
                                  <option value={match.team1}>{match.team1}</option>
                                  <option value={match.team2}>{match.team2}</option>
                                </select>
                              </div>

                              {match.winner && (
                                <div className="space-y-1">
                                  <div className="mt-4">
                                    <label className="block text-xs font-bold text-yellow-400">
                                      Opponent Score (0-{WINNING_SCORE - 1}):
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={WINNING_SCORE - 1}
                                      value={
                                        typeof match.opponentScore === "number"
                                          ? match.opponentScore
                                          : ""
                                      }
                                      onChange={(e) =>
                                        handleSetOpponentScore(match.id, e.target.value)
                                      }
                                      className="w-full px-2 py-1 text-sm bg-gray-600 rounded border border-gray-500 text-white"
                                      placeholder="Enter losing team score"
                                    />
                                  </div>
                                  {typeof match.opponentScore === "number" && (
                                    <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/40 text-xs font-semibold text-green-200 shadow-inner">
                                      <span className="uppercase tracking-wide">
                                        {match.winner}
                                      </span>
                                      <span className="text-lg font-black text-green-300">
                                        {calculateScorePoints(match.opponentScore)} pts
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic">
                              Waiting for previous match results...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    {winner ? (
                      <div className="flex flex-col items-center justify-center text-center gap-3 py-4 px-3 bg-green-900 bg-opacity-30 rounded-lg border border-green-500">
                        <div className="text-sm uppercase tracking-wide text-green-300 font-semibold">
                          🏆 Group Winner 🏆
                        </div>
                        <div className="text-3xl font-extrabold text-white flex items-center gap-3">
                          <span>{winner}</span>
                          <span className="px-4 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-green-400 text-gray-900 text-2xl font-black shadow-inner">
                            {groupWinnerStats[group]?.points ?? 0}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic text-center">
                        Winner will appear after the final match is completed.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>


      {/* Final Stage */}
      {finalMatches.filter((m) => m.stage !== "Grand Final").length > 0 && (
        <div className="mt-8 flex flex-col items-center justify-center 
        bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-6 border-2 border-yellow-500 w-full">
          <h2 className="text-3xl font-bold mb-4 text-yellow-400 text-center">
            🏆 Final Stage 🏆
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl">
            {finalMatches
              .filter((m) => m.stage !== "Grand Final")
              .map((match) => (
                <div key={match.id}>
                  <div
                    className={`rounded-lg p-4 border-2 ${match.status === 'completed'
                        ? 'bg-gray-700 bg-opacity-50 border-green-500'
                        : match.status === 'pending'
                          ? 'bg-gray-700 bg-opacity-50 border-yellow-400'
                          : 'bg-gray-700 bg-opacity-50 border-gray-600'
                      }`}
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      Match #{match.matchNumber}
                      {match.status === 'completed' && ' ✓'}
                    </div>
                    {match.time && (
                      <div className="text-lg font-bold text-yellow-300 mb-3">
                        {formatTime12Hour(match.time)} - {formatTime12Hour(formatTime(match.time, 30))} (30 min)
                      </div>
                    )}
                    <div className="text-lg font-bold text-white text-center py-3 rounded mb-3 bg-yellow-600 bg-opacity-30">
                      {match.display}
                    </div>
                    {match.status === 'pending' || match.status === 'completed' ? (
                      <div className="space-y-1">
                        <div>
                          <label className="block text-xs font-bold mb-1 mt-4 text-yellow-400">
                            Select Winner:
                          </label>
                          <select
                            value={match.winner || ""}
                            onChange={(e) =>
                              handleSetMatchWinner(match.id, e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm bg-gray-600 rounded border border-gray-500 text-white"
                          >
                            <option value="">Select winner...</option>
                            <option value={match.team1}>{match.team1}</option>
                            <option value={match.team2}>{match.team2}</option>
                          </select>
                        </div>

                        {match.winner && (
                          <div className="space-y-1">
                            <div className="text-xs font-bold mt-2 text-green-400">
                              🏆 Winner: {match.winner}
                            </div>
                            <div className="mt-4">
                              <label className="block text-xs font-bold text-yellow-400">
                                Opponent Score (0-{WINNING_SCORE - 1}):
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={WINNING_SCORE - 1}
                                value={
                                  typeof match.opponentScore === "number"
                                    ? match.opponentScore
                                    : ""
                                }
                                onChange={(e) =>
                                  handleSetOpponentScore(match.id, e.target.value)
                                }
                                className="w-full px-2 py-1 text-sm bg-gray-600 rounded border border-gray-500 text-white"
                                placeholder="Enter losing team score"
                              />
                            </div>
                            {typeof match.opponentScore === "number" && (
                              <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/40 text-xs font-semibold text-green-200 shadow-inner">
                                <span className="uppercase tracking-wide">
                                  {match.winner}
                                </span>
                                <span className="text-lg font-black text-green-300">
                                  {calculateScorePoints(match.opponentScore)} pts
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-gray-400 italic">
                        Waiting for previous match results...
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Grand Final - Separate Section */}
      {finalMatches.find((m) => m.stage === "Grand Final") && (() => {
        const grandFinalMatch = finalMatches.find((m) => m.stage === "Grand Final");
        return (
          <div className="mt-8">
            <div className="text-center mb-4">
              <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg border-2 border-yellow-400 shadow-lg shadow-yellow-500/50">
                <span className="text-xl font-bold text-gray-900">
                  🏆 GRAND FINAL 🏆
                </span>
              </div>
            </div>
            <div className="max-w-5xl mx-auto">
              <div
                className={`rounded-lg p-4 border-2 ${grandFinalMatch.status === 'completed'
                    ? 'bg-gradient-to-br from-yellow-900/60 to-orange-900/60 border-yellow-400 shadow-lg shadow-yellow-500/50'
                    : 'bg-gradient-to-br from-yellow-800/50 to-orange-800/50 border-yellow-500 shadow-lg shadow-yellow-400/30'
                  }`}
              >
                <div className="text-xs text-gray-400 mb-1">
                  Match #{grandFinalMatch.matchNumber}
                  {grandFinalMatch.status === 'completed' && ' ✓'}
                </div>
                {grandFinalMatch.time && (
                  <div className="text-lg font-bold text-yellow-300 mb-3">
                    {formatTime12Hour(grandFinalMatch.time)} - {formatTime12Hour(formatTime(grandFinalMatch.time, 30))} (30 min)
                  </div>
                )}
                <div className="text-lg font-bold text-white text-center py-3 rounded mb-3 bg-gradient-to-r from-yellow-500/40 to-orange-500/40 border-2 border-yellow-400">
                  {grandFinalMatch.display}
                </div>
                {grandFinalMatch.status === 'pending' || grandFinalMatch.status === 'completed' ? (
                  <div className="space-y-1">
                    <div>
                      <label className="block text-xs font-bold mb-1 mt-4 text-yellow-400">
                        Select Winner:
                      </label>
                      <select
                        value={grandFinalMatch.winner || ""}
                        onChange={(e) =>
                          handleSetMatchWinner(grandFinalMatch.id, e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm bg-gray-600 rounded border border-gray-500 text-white"
                      >
                        <option value="">Select winner...</option>
                        <option value={grandFinalMatch.team1}>{grandFinalMatch.team1}</option>
                        <option value={grandFinalMatch.team2}>{grandFinalMatch.team2}</option>
                      </select>
                    </div>

                    {grandFinalMatch.winner && (
                      <div className="mt-6 relative" style={{ minHeight: '60vh', overflow: 'visible', zIndex: 1 }}>
                        {/* Confetti Effect */}
                        {showConfetti && (
                          <div
                            className="fixed inset-0 pointer-events-none"
                            style={{
                              zIndex: 9999,
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                            }}
                          >
                            {Array.from({ length: 200 }).map((_, i) => {
                              const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#FF6347', '#32CD32', '#FF1493', '#00CED1'];
                              const left = `${Math.random() * 100}%`;
                              const delay = Math.random() * 2; // Stagger delays up to 2 seconds
                              const duration = 1.5 + Math.random() * 1.5; // 1.5-3 seconds per fall (faster)
                              const color = colors[Math.floor(Math.random() * colors.length)];
                              const size = 12 + Math.random() * 18;
                              const drift = (Math.random() - 0.5) * 200;
                              return (
                                <div
                                  key={i}
                                  className="absolute"
                                  style={{
                                    left: `calc(${left} + ${drift}px)`,
                                    top: '-50px',
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    backgroundColor: color,
                                    borderRadius: '0%',
                                    boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`,
                                    animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                        <div className="relative overflow-visible rounded-2xl p-8 bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 border-4 border-yellow-300 shadow-2xl shadow-yellow-500/50 z-10">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse"></div>
                          <div className="relative text-center z-10">
                            <div className="text-5xl mb-4 animate-bounce">
                              🏆
                            </div>
                            <div className="text-xs uppercase tracking-[0.3em] text-gray-800 font-black mb-3 opacity-90">
                              CREST MEN'S DAY VOLLEYBALL TOURNAMENT CHAMPION
                            </div>
                            <div className="text-6xl font-black text-gray-900 drop-shadow-2xl mb-2">
                              {grandFinalMatch.winner}
                            </div>
                            <div className="mt-4 text-xl font-bold text-gray-800">
                              🎉 CONGRATULATIONS! 🎉
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-gray-400 italic">
                    Waiting for previous match results...
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}


      {/* Summary */}
      <div className="mt-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-6 border-2 border-purple-500">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">
          📊 Schedule Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-yellow-400">
              {allMatches.length}
            </div>
            <div className="text-sm text-gray-400">Total Matches</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">
              {groupMatches.length}
            </div>
            <div className="text-sm text-gray-400">Group Matches</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-400">
              {finalMatches.length}
            </div>
            <div className="text-sm text-gray-400">Final Matches</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">
              {allMatches.length * 30}
            </div>
            <div className="text-sm text-gray-400">Total Minutes</div>
          </div>
        </div>
        {allMatches.length > 0 && (
          <div className="mt-4 text-center">
            <div className="text-lg font-bold text-green-400">
              Tournament Duration: {formatTime12Hour(startTime)} -{" "}
              {formatTime12Hour(
                formatTime(
                  allMatches[allMatches.length - 1].time,
                  allMatches[allMatches.length - 1].duration
                )
              )}
            </div>
          </div>
        )}
        {Object.keys(teamPoints).length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-blue-300 mb-3">
              🏅 Points Leaderboard
            </h3>
            <div className="space-y-2">
              {Object.entries(teamPoints)
                .sort((a, b) => b[1] - a[1])
                .map(([team, points], index) => (
                  <div
                    key={team}
                    className="flex items-center justify-between bg-gray-900 bg-opacity-40 rounded-lg px-4 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span>{team}</span>
                    </div>
                    <div className="text-yellow-300 font-bold">
                      {points} pts
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Home/Setup Page
const HomePage = () => {
  const navigate = useNavigate();
  const [showResetModal, setShowResetModal] = useState(false);
  const [users, setUsers] = useState(getFromStorage("users", []));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const userList = jsonData
        .slice(1)
        .map((row) => row[0])
        .filter(Boolean);
      setUsers(userList);
      saveToStorage("users", userList);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleReset = () => {
    localStorage.clear();
    setUsers([]);
    setShowResetModal(false);
    window.location.reload();
  };

  const generateTestData = () => {
    const testUsers = Array.from({ length: 60 }, (_, i) => `User${i + 1}`);
    setUsers(testUsers);
    saveToStorage("users", testUsers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-600 to-purple-600 animate-pulse">
          🎰 Crest Volleyball Tournament
        </h1>
      </div>

      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full border-2 border-purple-500 shadow-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-bold mb-3 text-yellow-400">
              📊 Upload Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
            <p className="text-2xl text-gray-400 mt-2">
              Upload Excel with user names in column A
            </p>
          </div>

          <button
            onClick={generateTestData}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg font-bold hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105"
          >
            🧪 Generate Test Data (60 Users)
          </button>

          {users.length > 0 && (
            <div className="text-center text-green-400 font-bold text-lg">
              ✅ {users.length} Users Loaded
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-6">
            <button
              onClick={() => navigate("/team")}
              disabled={users.length === 0}
              className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              👥 Crest Volleyball Tournament
            </button>
            <button
              onClick={() => navigate("/group")}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105"
            >
              🎯 Group Assignment
            </button>
          </div>

          <button
            onClick={() => navigate("/time-slots")}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
          >
            ⏰ Game Time Slots
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-bold hover:from-red-700 hover:to-orange-700 transition-all transform hover:scale-105"
          >
            🔄 Reset All Data
          </button>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md border-2 border-red-500 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-red-400">
              ⚠️ Confirm Reset
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to reset all data? This will clear all
              assignments and cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700 transition-all"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-6 py-3 bg-gray-600 rounded-lg font-bold hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App
export default function App() {
  return (
    <HashRouter>
      <nav className="bg-gray-900 border-b border-purple-500 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-600"
          >
            🎰
          </Link>
          <div className="flex gap-4">
            <Link
              to="/"
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
            >
              Home
            </Link>
            <Link
              to="/team"
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
            >
              Teams
            </Link>
            <Link
              to="/group"
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
            >
              Groups
            </Link>
            <Link
              to="/time-slots"
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
            >
              Time Slots
            </Link>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/group" element={<GroupPage />} />
        <Route path="/time-slots" element={<GameTimeSlotsPage />} />
      </Routes>

      <footer className="bg-gray-900 border-t border-purple-500 p-4 mt-8">
        <div className="container mx-auto text-right">
          <p className="text-gray-400 text-sm">
            Created by{" "}
            <span className="text-yellow-400 font-semibold">Parth Prajapati</span>
            {" & "}
            <span className="text-yellow-400 font-semibold">Jaimin Bharucha</span>
          </p>
        </div>
      </footer>
    </HashRouter>
  );
}
