import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Search,
  Download,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Eye,
  Printer,
  FolderOpen,
  NotebookPen
} from 'lucide-react';
import { SUBJECT_SEQUENCE } from '../context/PlatformContext';
import { SyllabusChapter } from '../types/database';

export type ResourceCategory =
  | 'PDF Lecture Notes'
  | 'Formula & Reference Sheet'
  | 'Lab & Practical Manual'
  | 'Chapter Study Guide'
  | 'Solved Problem Booklet';

export interface LecturePageContent {
  pageNumber: number;
  heading: string;
  sectionCode: string;
  summary: string;
  keyPoints: string[];
  formulaOrDiagramBox?: {
    title: string;
    lines: string[];
  };
  workedExample?: {
    problem: string;
    solutionSteps: string[];
  };
  examTip?: string;
}

export interface LibraryResourceItem {
  id: string;
  title: string;
  subject: string;
  courseCode: string;
  classLevel: string;
  term: 'Half-Yearly Term' | 'Final Term';
  chapterNumber: string;
  chapterName: string;
  category: ResourceCategory;
  instructor: string;
  updatedDate: string;
  fileName: string;
  fileSize: string;
  totalPages: number;
  readingTime: string;
  topics: string[];
  overview: string;
  pages: LecturePageContent[];
}

const DIGITAL_LIBRARY_RESOURCES: LibraryResourceItem[] = [
  {
    id: 'lib-phy-01',
    title: 'Kinematics, Equations of Motion & Graphical Derivations',
    subject: 'Physics',
    courseCode: 'PHY-101',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 02',
    chapterName: 'Motion (Kinematics)',
    category: 'PDF Lecture Notes',
    instructor: 'Saif Chowdhury',
    updatedDate: '2026-10-04',
    fileName: 'SSC_PHY101_Ch02_Kinematics_Lecture_Notes.pdf',
    fileSize: '1.8 MB',
    totalPages: 3,
    readingTime: '18 min read',
    topics: [
      'Reference Frames & Displacement',
      'Uniform Acceleration Equations',
      'Velocity-Time & Displacement-Time Graphs',
      'Free-Fall Motion under Gravity'
    ],
    overview:
      'Complete lecture notes covering scalar vs. vector kinematics, geometric derivations of the four equations of uniformly accelerated motion from velocity-time trapeziums, and free-fall trajectory analysis.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Section 2.1 – 2.2',
        heading: 'Reference Frames, Displacement & Instantaneous Velocity',
        summary:
          'Motion is always defined relative to an observer frame of reference. While distance measures the total path length traversed (scalar), displacement measures the shortest directed vector from initial position r₁ to final position r₂.',
        keyPoints: [
          'Distance (d) is path-dependent and non-negative; Displacement (s) is a vector quantity with SI unit meter (m).',
          'Average velocity v_avg = Δs / Δt, whereas instantaneous velocity v = lim(Δt→0) Δs / Δt represents the tangent slope on an s–t curve.',
          'Uniform acceleration (a) occurs when velocity changes by equal magnitudes in equal time intervals: a = (v - u) / t.'
        ],
        formulaOrDiagramBox: {
          title: 'Fundamental Kinematic Definitions & SI Units',
          lines: [
            '1. First Equation of Motion:      v = u + a·t               [Unit: m·s⁻¹]',
            '2. Average Velocity (Uniform a):  v_bar = (u + v) / 2       [Unit: m·s⁻¹]',
            '3. Rate of Change of Velocity:    a = (v - u) / t           [Unit: m·s⁻²]'
          ]
        },
        workedExample: {
          problem:
            'Example 2.1: A train starts from rest at Kamalapur Station and attains a velocity of 72 km/h in 40 seconds with uniform acceleration. Find its acceleration in SI units.',
          solutionSteps: [
            'Convert initial and final velocities to SI: u = 0 m/s, v = 72 × (1000 / 3600) = 20 m/s.',
            'Apply a = (v - u) / t = (20 - 0) / 40 = 0.50 m/s².',
            'Result: The uniform linear acceleration of the train is 0.50 m·s⁻².'
          ]
        },
        examTip:
          'Always convert km/h to m/s by multiplying by 5/18 before substituting into any kinematic equation.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Section 2.3',
        heading: 'Graphical Derivation of s = ut + ½at² and v² = u² + 2as',
        summary:
          'For any particle moving with constant acceleration, the area bounded under the velocity-time (v–t) graph between t = 0 and t = T equals the net displacement s.',
        keyPoints: [
          'On a v–t graph, a horizontal line indicates zero acceleration (constant velocity).',
          'A straight inclined line of constant slope tan(θ) = a represents uniformly accelerated motion.',
          'Splitting the trapezium under v = u + at into a rectangle (area = u·t) and a right triangle (area = ½·t·(v - u)) directly yields s = ut + ½at².'
        ],
        formulaOrDiagramBox: {
          title: 'Complete Kinematic Equations Set (Constant Acceleration)',
          lines: [
            'Equation I:    v = u + at                  (Velocity-Time relation)',
            'Equation II:   s = ((u + v) / 2) · t       (Displacement from average velocity)',
            'Equation III:  s = ut + ½at²               (Position-Time relation)',
            'Equation IV:   v² = u² + 2as               (Time-independent relation)',
            'nth Second:    s_n = u + ½a(2n - 1)        (Displacement in nth second only)'
          ]
        },
        workedExample: {
          problem:
            'Example 2.2: A test vehicle moving at 25 m/s applies brakes producing a uniform retardation of 3.0 m/s². Calculate the stopping distance.',
          solutionSteps: [
            'Given: u = 25 m/s, v = 0 m/s (stops), a = -3.0 m/s².',
            'Using v² = u² + 2as  ⇒  0 = (25)² + 2(-3.0)s.',
            '6s = 625  ⇒  s = 104.17 m.'
          ]
        },
        examTip:
          'In creative (CQ) part (d) stopping-distance questions, always compare the calculated stopping distance s with the obstacle distance to justify whether a collision occurs.'
      },
      {
        pageNumber: 3,
        sectionCode: 'Section 2.4',
        heading: 'Free-Fall Motion Under Gravity & Galileo’s Laws',
        summary:
          'When air resistance is negligible, all bodies near the Earth’s surface fall with the same constant downward acceleration g ≈ 9.81 m/s² regardless of their mass.',
        keyPoints: [
          'First Law of Falling Bodies: In a vacuum, all objects starting from rest fall equal distances in equal intervals of time.',
          'Second Law: Velocity acquired by a freely falling body from rest is directly proportional to time elapsed (v ∝ t).',
          'Third Law: Distance fallen from rest is proportional to the square of time elapsed (h ∝ t²).'
        ],
        formulaOrDiagramBox: {
          title: 'Vertical Projection & Free-Fall Equations',
          lines: [
            'Downward Drop (u = 0):    v = gt,          h = ½gt²,         v² = 2gh',
            'Upward Throw:             v = u - gt,      h = ut - ½gt²,    v² = u² - 2gh',
            'Maximum Height (v = 0):   H_max = u² / (2g)',
            'Time of Flight:           T_total = 2u / g'
          ]
        },
        workedExample: {
          problem:
            'Example 2.3: A stone is dropped into a deep well and the splash is heard 3.2 seconds later. Neglecting sound travel time, find the depth of the well.',
          solutionSteps: [
            'Given: u = 0 m/s, t = 3.2 s, g = 9.8 m/s².',
            'h = ½gt² = 0.5 × 9.8 × (3.2)² = 4.9 × 10.24 = 50.18 m.'
          ]
        },
        examTip:
          'Remember that at the highest point of vertical projection, instantaneous velocity v = 0, but acceleration is still g = 9.8 m/s² downward.'
      }
    ]
  },
  {
    id: 'lib-phy-02',
    title: 'Vernier Calipers, Screw Gauge & Dimensional Analysis Manual',
    subject: 'Physics',
    courseCode: 'PHY-101',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 01',
    chapterName: 'Physical Quantities and Measurement',
    category: 'Lab & Practical Manual',
    instructor: 'Saif Chowdhury',
    updatedDate: '2026-09-29',
    fileName: 'SSC_PHY101_Ch01_Measurement_Lab_Manual.pdf',
    fileSize: '1.4 MB',
    totalPages: 2,
    readingTime: '12 min read',
    topics: [
      'SI Base Units & Prefixes',
      'Vernier Constant (VC) & Zero Error',
      'Micrometer Screw Gauge Least Count',
      'Relative & Percentage Error Analysis'
    ],
    overview:
      'Step-by-step Physics Lab 1 reference guide for precision measurement instruments, zero-error correction tables, and dimensional homogeneity checks.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Lab Protocol 1.1',
        heading: 'Slide Calipers & Vernier Constant (VC) Precision Readings',
        summary:
          'A Vernier caliper resolves fractional millimeter lengths by pairing a primary millimeter scale with a sliding Vernier scale where n Vernier divisions match (n - 1) main scale divisions.',
        keyPoints: [
          'Vernier Constant (VC) = Value of 1 smallest Main Scale Division (s) ÷ Total number of Vernier divisions (n).',
          'For a standard 10-division Vernier with 1 mm main scale pitch: VC = 1 mm / 10 = 0.1 mm = 0.01 cm.',
          'Always subtract positive zero error (or add negative zero error magnitude) to obtain the corrected diameter.'
        ],
        formulaOrDiagramBox: {
          title: 'Slide Calipers & Screw Gauge Master Formulas',
          lines: [
            '1. Slide Caliper Reading:   L = M + (V × VC) ± Zero Correction',
            '2. Screw Gauge Least Count: LC = Pitch (p) / Circular Scale Divisions (N)',
            '3. Cylinder Volume:         V = (1/4) · π · d² · h',
            '4. Relative Error:          δR = |Measured - True| / True × 100%'
          ]
        },
        workedExample: {
          problem:
            'Lab Problem 1.1: While measuring a brass sphere, the main scale reads 2.4 cm, the 6th Vernier mark coincides with the main scale, and VC = 0.01 cm. Find the diameter.',
          solutionSteps: [
            'Main scale reading M = 2.4 cm; Vernier coincidence V = 6.',
            'Diameter d = M + V × VC = 2.4 + (6 × 0.01) = 2.46 cm.'
          ]
        },
        examTip:
          'Keep all terms in the same unit (either all in mm or all in cm) before adding M and V × VC.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Lab Protocol 1.2',
        heading: 'Dimensional Analysis & Error Propagation in Volume Calculations',
        summary:
          'Dimensional formulas express any derived physical quantity in powers of the fundamental dimensions [M], [L], and [T], allowing verification of equation consistency.',
        keyPoints: [
          'Principle of Homogeneity: Every additive term on both sides of a valid physical equation must have identical dimensions.',
          'Arguments of trigonometric, logarithmic, and exponential functions are always dimensionless.',
          'When radius r is cubed (V = 4/3 πr³), a 1% error in radius produces approximately a 3% error in calculated volume.'
        ],
        formulaOrDiagramBox: {
          title: 'Essential Dimensional Formulas Table',
          lines: [
            'Velocity (v):        [L T⁻¹]            Force (F = ma):      [M L T⁻²]',
            'Acceleration (a):    [L T⁻²]            Work / Energy (W):   [M L² T⁻²]',
            'Momentum (p = mv):   [M L T⁻¹]          Power (P = W/t):     [M L² T⁻³]',
            'Pressure (P = F/A):  [M L⁻¹ T⁻²]        Density (ρ = m/V):   [M L⁻³]'
          ]
        },
        examTip:
          'Check s = ut + ½at² dimensionally: [L] = [L T⁻¹][T] + [L T⁻²][T²] = [L] + [L]. Constants like ½ have no dimensions.'
      }
    ]
  },
  {
    id: 'lib-bio-01',
    title: 'Bioenergetics: ATP Synthesis, C3/C4 Photosynthesis & Cellular Respiration',
    subject: 'Biology',
    courseCode: 'BIO-102',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 04',
    chapterName: 'Bioenergetics (Photosynthesis & Respiration)',
    category: 'PDF Lecture Notes',
    instructor: 'MD. MAHFUJUL HAQUE',
    updatedDate: '2026-10-03',
    fileName: 'SSC_BIO102_Ch04_Bioenergetics_Lecture_Notes.pdf',
    fileSize: '2.3 MB',
    totalPages: 3,
    readingTime: '20 min read',
    topics: [
      'ATP as Biological Energy Currency',
      'Light-Dependent Photophosphorylation',
      'Calvin Cycle (C3) vs Hatch-Slack (C4) Pathway',
      'Aerobic Glycolysis, Krebs Cycle & ETC'
    ],
    overview:
      'Detailed cellular bioenergetics lecture notes with biochemical reaction stoichiometry, chloroplast thylakoid vs. stroma compartmentation, and net ATP accounting table.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Section 4.1 – 4.2',
        heading: 'ATP Cycle & Light-Dependent Reactions of Photosynthesis',
        summary:
          'Adenosine Triphosphate (ATP) stores free energy in its terminal phosphoanhydride bonds (~7.3 kcal/mol per bond). Chloroplasts capture solar photons (400–700 nm PAR) to phosphorylate ADP into ATP and reduce NADP⁺ to NADPH + H⁺.',
        keyPoints: [
          'Photophosphorylation occurs inside the thylakoid membrane of chloroplast grana.',
          'Photolysis of water (2H₂O → 4H⁺ + 4e⁻ + O₂↑) requires Mn²⁺ and Cl⁻ ions and releases molecular oxygen.',
          'Assimilatory Power refers to the combined production of ATP and NADPH required to drive carbon fixation in the stroma.'
        ],
        formulaOrDiagramBox: {
          title: 'Overall Photosynthesis Reaction & Light Phase Summary',
          lines: [
            'Overall Balanced Equation:',
            '  6CO₂ + 12H₂O  ──(Sunlight / Chlorophyll)──►  C₆H₁₂O₆ + 6H₂O + 6O₂↑',
            '',
            'Light Phase Products (Thylakoid Membrane):',
            '  2H₂O + 2NADP⁺ + 3ADP + 3Pi  ──►  O₂↑ + 2(NADPH + H⁺) + 3ATP'
          ]
        },
        examTip:
          'Remember that all evolved O₂ in photosynthesis originates exclusively from H₂O (verified by Ruben & Kamen using ¹⁸O isotope tracing), never from CO₂.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Section 4.3',
        heading: 'Light-Independent Carbon Fixation: C3 (Calvin) vs. C4 (Hatch-Slack) Pathways',
        summary:
          'In the chloroplast stroma, enzymatic carbon reduction converts atmospheric CO₂ into triose phosphates using ATP and NADPH generated during the light phase.',
        keyPoints: [
          'C3 Pathway (Calvin-Benson Cycle): First stable product is 3-phosphoglyceric acid (3-PGA, 3-carbon), catalyzed by RuBisCO.',
          'C4 Pathway (Hatch & Slack Cycle): First stable product is oxaloacetic acid (OAA, 4-carbon), exhibiting Kranz anatomy (mesophyll + bundle sheath cells).',
          'C4 plants (maize, sugarcane, amaranth) minimize photorespiration and thrive under high temperature and intense tropical sunlight.'
        ],
        formulaOrDiagramBox: {
          title: 'Comparative Summary: C3 vs. C4 Plants',
          lines: [
            'Feature                 C3 Pathway (Rice, Mango)       C4 Pathway (Maize, Sugarcane)',
            '────────────────────────────────────────────────────────────────────────────────────',
            'First Stable Product    3-PGA (3-Carbon)               Oxaloacetic Acid, OAA (4-C)',
            'Primary CO₂ Acceptor    RuBP (5-Carbon)                PEP (3-Carbon in Mesophyll)',
            'Optimum Temperature     10°C – 25°C                    30°C – 45°C',
            'Kranz Anatomy           Absent                         Present (Bundle Sheath Chloroplasts)'
          ]
        },
        examTip:
          'When asked why maize is more productive than rice in hot summer sunlight, cite Kranz anatomy and the high affinity of PEP carboxylase for CO₂.'
      },
      {
        pageNumber: 3,
        sectionCode: 'Section 4.4',
        heading: 'Aerobic vs. Anaerobic Respiration & 38 ATP Balance Sheet',
        summary:
          'Cellular respiration oxidizes glucose (C₆H₁₂O₆) through four sequential stages to generate ATP for cellular work.',
        keyPoints: [
          'Stage 1 — Glycolysis (Cytoplasm): 1 Glucose → 2 Pyruvic Acid + 2 Net ATP + 2 NADH (common to both aerobic & anaerobic respiration).',
          'Stage 2 — Acetyl-CoA Link Reaction (Mitochondrial Matrix): 2 Pyruvic Acid → 2 Acetyl-CoA + 2 CO₂ + 2 NADH.',
          'Stage 3 & 4 — Krebs Cycle & Electron Transport System (Inner Mitochondrial Membrane): Produces 24 ATP + 6 ATP from link NADH = 38 total net ATP per mole of glucose.'
        ],
        formulaOrDiagramBox: {
          title: 'Aerobic Respiration Net ATP Accounting (Per 1 Molecule Glucose)',
          lines: [
            '1. Glycolysis (Cytoplasm):       4 ATP formed - 2 ATP used =  2 ATP  + 2 NADH (→ 6 ATP)',
            '2. Acetyl-CoA Formation:         2 NADH × 3 ATP            =  6 ATP  (2 CO₂ released)',
            '3. Krebs Cycle (2 Turns):        2 ATP + 6 NADH + 2 FADH₂  = 24 ATP  (4 CO₂ released)',
            '───────────────────────────────────────────────────────────────────────────────────────',
            'Total Net Aerobic Yield:                                   = 38 ATP'
          ]
        },
        examTip:
          'In anaerobic respiration (lactic acid or alcoholic fermentation), glycolysis is the only ATP-producing stage, yielding just 2 net ATP per glucose.'
      }
    ]
  },
  {
    id: 'lib-che-01',
    title: 'Periodic Table Architecture, Subshell Configurations & Periodic Trends',
    subject: 'Chemistry',
    courseCode: 'CHE-103',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 04',
    chapterName: 'Periodic Table & Periodicity',
    category: 'PDF Lecture Notes',
    instructor: 'MD. RAISUL ISLAM',
    updatedDate: '2026-10-02',
    fileName: 'SSC_CHE103_Ch04_Periodic_Table_Lecture_Notes.pdf',
    fileSize: '2.0 MB',
    totalPages: 3,
    readingTime: '16 min read',
    topics: [
      'Electronic Basis of 7 Periods & 18 Groups',
      'Determination of Period & Group from Subshells',
      'Atomic Radius & Ionization Energy Trends',
      'Electronegativity & Transition Elements'
    ],
    overview:
      'Comprehensive Chemistry lecture notes detailing IUPAC 18-group periodic classification, s/p/d/f block rules, exceptions in Cr (Z=24) and Cu (Z=29), and periodic property gradients.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Section 4.1 – 4.2',
        heading: 'Determining Period and Group Number from Electronic Configuration',
        summary:
          'Moseley’s Modern Periodic Law states that the physical and chemical properties of elements are periodic functions of their atomic numbers (Z) and valence shell electronic configurations.',
        keyPoints: [
          'Period Rule: The highest principal quantum number (n) in the ground-state electronic configuration equals the Period number.',
          's-Block Rule: If the outermost electron enters an ns orbital, Group number = number of electrons in the outermost ns orbital (Group 1 or 2).',
          'p-Block Rule: If the outermost electron enters an np orbital, Group number = 10 + (total electrons in outermost ns + np orbitals).',
          'd-Block Rule: If an (n-1)d subshell is partially filled before ns, Group number = electrons in (n-1)d + electrons in outermost ns.'
        ],
        formulaOrDiagramBox: {
          title: 'Worked Electronic Configuration Examples (Z = 17, 19, 24, 26)',
          lines: [
            'Cl (Z = 17):  1s² 2s² 2p⁶ 3s² 3p⁵          → Period 3, Group = 10 + (2+5) = 17',
            'K  (Z = 19):  1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹      → Period 4, Group = 1 (Alkali Metal)',
            'Cr (Z = 24):  [Ar] 3d⁵ 4s¹ (Half-filled d)  → Period 4, Group = 5 + 1 = 6',
            'Fe (Z = 26):  [Ar] 3d⁶ 4s²                  → Period 4, Group = 6 + 2 = 8'
          ]
        },
        examTip:
          'Always write Chromium (24) as [Ar] 3d⁵ 4s¹ and Copper (29) as [Ar] 3d¹⁰ 4s¹ due to the extra stability of half-filled (d⁵) and completely filled (d¹⁰) d-orbitals.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Section 4.3',
        heading: 'Periodic Trends: Atomic Radius, Ionization Energy & Electronegativity',
        summary:
          'Moving left-to-right across a period increases nuclear charge Z without adding a new shell, pulling valence electrons closer to the nucleus.',
        keyPoints: [
          'Atomic Radius decreases from left to right across a period (e.g., Na > Mg > Al > Si > P > S > Cl) and increases down a group (Li < Na < K < Rb < Cs).',
          'Ionization Energy (IE): Minimum energy required to remove the most loosely bound electron from an isolated gaseous atom. Increases left-to-right; decreases top-to-bottom.',
          'Electronegativity: Relative tendency of a bonded atom to attract shared electron pairs toward itself (F = 4.0 is the highest on the Pauling scale).'
        ],
        formulaOrDiagramBox: {
          title: 'Period 3 Property Gradient (Na to Ar)',
          lines: [
            'Element:              Na      Mg      Al      Si      P       S       Cl',
            'Atomic Number (Z):    11      12      13      14      15      16      17',
            'Valence Electrons:     1       2       3       4       5       6       7',
            'Atomic Radius:        ────── Decreases Left to Right (Stronger Z_eff) ──────►',
            'Electronegativity:    0.9     1.2     1.5     1.8     2.1     2.5     3.0',
            'Oxide Character:      Strongly Basic  Amphoteric      ────── Acidic ────────►'
          ]
        },
        examTip:
          'Note two important Ionization Energy exceptions in Period 3: Mg > Al (stable 3s² subshell in Mg) and P > S (stable half-filled 3p³ subshell in P).'
      },
      {
        pageNumber: 3,
        sectionCode: 'Section 4.4',
        heading: 'Chemical Families: Alkali Metals, Halogens & Transition Elements',
        summary:
          'Elements in the same vertical group possess identical valence electron counts and exhibit predictable family reactivity.',
        keyPoints: [
          'Group 1 (Alkali Metals): React vigorously with water to form strong alkalis (2Na + 2H₂O → 2NaOH + H₂↑).',
          'Group 2 (Alkaline Earth Metals): Form divalent cations (Mg²⁺, Ca²⁺) and basic oxides found in the Earth’s crust.',
          'Group 17 (Halogens — Salt Makers): Diatomic non-metals (F₂, Cl₂, Br₂, I₂) that gain 1 electron to form halide ions (X⁻).'
        ],
        formulaOrDiagramBox: {
          title: 'Key Family Reactions for Class Tests & Board Exams',
          lines: [
            '1. Alkali + Water:       2K(s) + 2H₂O(l)  ──►  2KOH(aq) + H₂(g)↑',
            '2. Halogen Displacement: Cl₂(g) + 2KBr(aq) ──►  2KCl(aq) + Br₂(l)',
            '3. Limewater Carbonation: Ca(OH)₂(aq) + CO₂(g) ──► CaCO₃(s)↓ + H₂O(l)'
          ]
        },
        examTip:
          'Scandium (Sc, Z=21) and Zinc (Zn, Z=30) are d-block elements but NOT transition elements because their stable ions (Sc³⁺ has 3d⁰; Zn²⁺ has 3d¹⁰) do not have partially filled d-orbitals.'
      }
    ]
  },
  {
    id: 'lib-che-02',
    title: 'Chemical Bonding: Ionic, Covalent & Metallic Bond Reference Sheet',
    subject: 'Chemistry',
    courseCode: 'CHE-103',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 05',
    chapterName: 'Chemical Bonds',
    category: 'Formula & Reference Sheet',
    instructor: 'MD. RAISUL ISLAM',
    updatedDate: '2026-09-28',
    fileName: 'SSC_CHE103_Ch05_Chemical_Bonding_Reference.pdf',
    fileSize: '1.2 MB',
    totalPages: 2,
    readingTime: '10 min read',
    topics: [
      'Octet & Duet Rule Stability',
      'Ionic Lattice & Polar Water Solubility',
      'Lewis Dot Covalent Structures & Lone Pairs',
      'Delocalized Electron Sea in Metals'
    ],
    overview:
      'Quick-revision reference sheet comparing ionic vs. covalent compounds, octet exceptions, polar solvation of NaCl in water, and electrical conductivity mechanisms.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Reference 5.1',
        heading: 'Ionic vs. Covalent Bonding & Octet Rule Applications',
        summary:
          'Atoms combine by transferring or sharing valence electrons to achieve the stable ns²np⁶ configuration of their nearest noble gas.',
        keyPoints: [
          'Ionic Bond: Electrostatic attraction between cations (formed by metals with low IE) and anions (formed by non-metals with high electron affinity), e.g., NaCl, MgO, CaF₂.',
          'Covalent Bond: Mutual sharing of electron pairs between two non-metal atoms of comparable electronegativity, e.g., H₂O, NH₃, CH₄, CO₂.',
          'Lone Pair vs. Bond Pair: NH₃ has 3 bond pairs and 1 lone pair; H₂O has 2 bond pairs and 2 lone pairs.'
        ],
        formulaOrDiagramBox: {
          title: 'Bonding & Lone Pair Count of Common Molecules',
          lines: [
            'Molecule     Central Atom    Bond Pairs (BP)    Lone Pairs (LP)    Geometry',
            '───────────────────────────────────────────────────────────────────────────────',
            'CH₄          Carbon (C)            4                  0            Tetrahedral',
            'NH₃          Nitrogen (N)          3                  1            Trigonal Pyramidal',
            'H₂O          Oxygen (O)            2                  2            Bent / V-Shaped',
            'CO₂          Carbon (C)            4 (2 Double)       0 (on C)     Linear'
          ]
        },
        examTip:
          'Note that PCl₅ (10 valence electrons around P) and BF₃ (6 valence electrons around B) are classic exceptions to the Octet Rule.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Reference 5.2',
        heading: 'Solubility of Ionic Compounds in Polar Water & Metallic Conductivity',
        summary:
          'Although covalent compounds are generally insoluble in water, polar covalent molecules (such as ethanol, glucose, and HCl) and most ionic salts dissolve readily via dipole hydration.',
        keyPoints: [
          'Water (H₂O) is a polar covalent solvent with δ⁻ on Oxygen and δ⁺ on Hydrogen.',
          'When NaCl crystals enter water, δ⁻ oxygen poles surround Na⁺ cations and δ⁺ hydrogen poles surround Cl⁻ anions, overcoming lattice energy.',
          'AgCl and BaSO₄ remain insoluble precipitates because their lattice energy exceeds hydration energy.'
        ],
        formulaOrDiagramBox: {
          title: 'Conductivity & Melting Point Comparison',
          lines: [
            'Property               Ionic (NaCl, MgO)        Covalent (CH₄, C₁₀H₈)    Metallic (Cu, Al)',
            '──────────────────────────────────────────────────────────────────────────────────────────',
            'Melting / Boiling Pt   High (NaCl: 801°C)       Low (Weak van der Waals)  High',
            'Solid Conductivity     Non-conductor            Non-conductor             High (Mobile e⁻)',
            'Molten / Aqueous       Conducts (Mobile Ions)   Non-conductor (mostly)    N/A'
          ]
        },
        examTip:
          'Graphite is a covalent allotrope of carbon that conducts electricity because each sp² carbon leaves 1 unhybridized delocalized electron free to move between hexagonal layers.'
      }
    ]
  },
  {
    id: 'lib-ban-01',
    title: 'Bangla Prose, Poetry Analysis & Sandhi/Samas Grammar Compendium',
    subject: 'Bangla',
    courseCode: 'BAN-104',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 01–03',
    chapterName: 'Classical & Modern Bengali Prose and Grammar',
    category: 'PDF Lecture Notes',
    instructor: 'MD. RONY KHAN',
    updatedDate: '2026-10-01',
    fileName: 'SSC_BAN104_Prose_And_Grammar_Lecture_Notes.pdf',
    fileSize: '1.6 MB',
    totalPages: 2,
    readingTime: '14 min read',
    topics: [
      'Classical & Humanist Prose Commentary',
      'Swarasandhi, Byanjansandhi & Visargasandhi Rules',
      'Samas Classification (Dvandva, Tatpurusha, Karmadharaya, Bahuvrihi)',
      'Structured Creative Answer (Srijonshil) Strategy'
    ],
    overview:
      'Curated Bangla 1st & 2nd Paper study resource covering thematic literary analysis, systematic Sandhi & Samas transformation tables, and formal essay composition blueprints.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Bangla 1st Paper',
        heading: 'Prose & Poetry Thematic Analysis and Four-Part Srijonshil Structure',
        summary:
          'High-scoring creative responses in Bangla 1st Paper require precise textual citations in Knowledge (ক) and Comprehension (খ), followed by structural parallel mapping between the stem and textbook in Application (গ) and Higher-Order Analysis (ঘ).',
        keyPoints: [
          'Knowledge (জ্ঞানমূলক - 1 Mark): Write a single, direct sentence stating the exact author name, word meaning, or character reference.',
          'Comprehension (অনুধাবনমূলক - 2 Marks): Structure into two clear paragraphs — first the literal contextual meaning, second the deeper literary significance.',
          'Application & Higher-Order (প্রয়োগ ও উচ্চতর দক্ষতা - 3 & 4 Marks): Explicitly link the stem’s conflict or theme with the textbook prose/poem before concluding.'
        ],
        formulaOrDiagramBox: {
          title: 'Srijonshil (CQ) Time & Paragraph Allocation Guide',
          lines: [
            '(ক) Knowledge (1 Mark):       1 Paragraph   ·  1–2 Sentences   ·  Max 2 Minutes',
            '(খ) Comprehension (2 Marks):  2 Paragraphs  ·  4–6 Sentences   ·  Max 4 Minutes',
            '(গ) Application (3 Marks):    3 Paragraphs  ·  Stem Comparison ·  Max 7 Minutes',
            '(ঘ) Higher-Order (4 Marks):   4 Paragraphs  ·  Critical Thesis ·  Max 9 Minutes'
          ]
        },
        examTip:
          'Never merge paragraphs in (গ) and (ঘ); distinct visual separation of thesis, stem analysis, textbook synthesis, and conclusion maximizes examiner clarity.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Bangla 2nd Paper',
        heading: 'Systematic Rules of Sandhi (সন্ধি) and Samas (সমাস) Identification',
        summary:
          'Sandhi joins adjacent phonemes (বর্ণের মিলন) based on phonetic euphony, whereas Samas combines semantically related words/padas (পদের মিলন) into a compact compound word.',
        keyPoints: [
          'Swarasandhi (স্বরসন্ধি): Union of two vowel sounds, e.g., বিদ্যা + আলয় = বিদ্যালয়; শুভ + ইচ্ছা = শুভেচ্ছা; পরি + ঈক্ষা = পরীক্ষা।',
          'Byanjansandhi (ব্যঞ্জনসন্ধি): Union involving consonant sounds, e.g., সৎ + চিন্তা = সচ্চিন্তা; দিক্ + অন্ত = দিগন্ত; সম্ + বাদ = সংবাদ।',
          'Samas Core Distinction: Dvandva prioritizes both padas; Tatpurusha drops case endings (বিভক্তি লোপ); Bahuvrihi points to a third independent meaning.'
        ],
        formulaOrDiagramBox: {
          title: 'High-Frequency Samas Diagnostic Matrix',
          lines: [
            '1. Dvandva (দ্বন্দ্ব সমাস):         উভয় পদ প্রধান        → মাতা ও পিতা = মাতাপিতা',
            '2. Karmadharaya (কর্মধারয়):         পরপদ প্রধান (তুলনা)  → নীল যে পদ্ম = নীলপদ্ম',
            '3. Tatpurusha (তৎপুরুষ):            বিভক্তি লোপ (পরপদ)  → বিপদকে আপন্ন = বিপদাপন্ন',
            '4. Bahuvrihi (বহুব্রীহি):           অন্য পদ প্রধান       → দশ আনন যার = দশানন'
          ]
        },
        examTip:
          'In MCQ grammar questions, always check whether the compound word refers to one of the constituent nouns (Karmadharaya) or an external person/concept (Bahuvrihi).'
      }
    ]
  },
  {
    id: 'lib-eng-01',
    title: 'Transformation of Sentences, Clause Synthesis & Academic Writing Guide',
    subject: 'English',
    courseCode: 'ENG-105',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Unit 03',
    chapterName: 'Reading Comprehension, Transformation & Analytical Writing',
    category: 'Chapter Study Guide',
    instructor: 'ANONNO IBNE RAZZAK',
    updatedDate: '2026-10-03',
    fileName: 'SSC_ENG105_Unit03_Grammar_And_Writing_Guide.pdf',
    fileSize: '1.5 MB',
    totalPages: 2,
    readingTime: '15 min read',
    topics: [
      'Simple, Complex & Compound Sentence Conversion',
      'Active to Passive Voice Structural Rules',
      'Degree of Comparison (Positive, Comparative, Superlative)',
      'Analytical Summary & Formal Email Composition'
    ],
    overview:
      'Complete English 1st & 2nd Paper study guide featuring clause transformation rules without altering meaning, modifier mastery, and academic composition templates.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Grammar Module 3.1',
        heading: 'Structural Conversion: Simple, Complex, and Compound Sentences',
        summary:
          'Transforming sentences requires converting phrases into subordinate or coordinate clauses while strictly preserving original tense and semantic polarity.',
        keyPoints: [
          'Simple Sentence: Contains exactly 1 principal subject and 1 finite verb (uses participles, infinitives, or prepositional phrases for secondary ideas).',
          'Complex Sentence: Contains 1 independent (main) clause and 1 or more subordinate clauses linked by subordinating conjunctions (though, since, when, if, so...that, relative pronouns).',
          'Compound Sentence: Contains 2 or more independent clauses joined by coordinating conjunctions (FANBOYS: for, and, nor, but, or, yet, so).'
        ],
        formulaOrDiagramBox: {
          title: 'Tri-Way Sentence Transformation Equivalence Table',
          lines: [
            'Meaning         Simple                    Complex                     Compound',
            '─────────────────────────────────────────────────────────────────────────────────────────',
            'Contrast        In spite of + V-ing       Though / Although + Clause  ... but / yet ...',
            'Cause/Reason    Because of + V-ing        Since / As / Because        ... and so / therefore',
            'Purpose         To + Verb (Infinitive)    ... so that + Sub + can/may ... want to ... and so',
            'Inability       Too + adj + to + verb     So + adj + that + cannot    Very + adj + and cannot'
          ]
        },
        workedExample: {
          problem:
            'Transform into Complex and Compound: "In spite of working hard, the researcher could not complete the trial on time."',
          solutionSteps: [
            'Complex: Though the researcher worked hard, he could not complete the trial on time.',
            'Compound: The researcher worked hard, but he could not complete the trial on time.'
          ]
        },
        examTip:
          'Always verify that the tense of the newly formed subordinate verb matches the tense of the main finite verb.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Writing Module 3.2',
        heading: 'Degrees of Comparison & Precision Summary Writing Protocol',
        summary:
          'Academic summary writing condenses an unseen or seen passage to roughly one-third of its original length using original phrasing rather than verbatim sentence copying.',
        keyPoints: [
          'Superlative to Positive (Universal): "The Padma is the widest river" → "No other river is as wide as the Padma."',
          'Superlative to Positive (Plural Group): "Iron is one of the most useful metals" → "Very few metals are as useful as iron."',
          'Summary Rule: Omit examples, dates, direct quotations, and rhetorical questions; state the central thesis in the very first sentence.'
        ],
        formulaOrDiagramBox: {
          title: 'Degree of Comparison Conversion Blueprint',
          lines: [
            'Type 1 (Unique):',
            '  Positive:     No other + N(sing.) + V + so/as + Pos + as + Sub',
            '  Comparative:  Sub + V + Comp + than any other + N(sing.)',
            '  Superlative:  Sub + V + the + Superlative + N(sing.)',
            '',
            'Type 2 (One of the...):',
            '  Positive:     Very few + N(plural) + V(plural) + as + Pos + as + Sub',
            '  Comparative:  Sub + V + Comp + than most other + N(plural)',
            '  Superlative:  Sub + V + one of the + Superlative + N(plural)'
          ]
        },
        examTip:
          'Remember that after "Very few", both the noun and the verb MUST be plural (e.g., "Very few cities are...").'
      }
    ]
  },
  {
    id: 'lib-ict-01',
    title: 'Number Systems, 2’s Complement Arithmetic & Digital Logic Gates',
    subject: 'ICT',
    courseCode: 'ICT-106',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 03',
    chapterName: 'Number Systems & Digital Logic Circuits',
    category: 'PDF Lecture Notes',
    instructor: 'MUHAMMAD MOKHLESUR RAHMAN',
    updatedDate: '2026-10-05',
    fileName: 'SSC_ICT106_Ch03_Number_Systems_And_Logic_Gates.pdf',
    fileSize: '1.9 MB',
    totalPages: 3,
    readingTime: '17 min read',
    topics: [
      'Positional Number Systems (Binary, Octal, Decimal, Hexadecimal)',
      'Signed 8-Bit 2’s Complement Subtraction',
      'Boolean Algebra & De Morgan’s Theorems',
      'Universal Gates (NAND & NOR Implementation)'
    ],
    overview:
      'Digital Lab 1 lecture notes on base conversions, fractional radix multiplication, 2’s complement signed arithmetic, and truth tables for basic and universal logic gates.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Section 3.1',
        heading: 'Positional Number Systems & Radix Base Conversions',
        summary:
          'Every positional number system is defined by its radix or base (r), utilizing digits from 0 to (r - 1). Digital processors operate natively in base-2 (Binary: 0, 1) while using Octal (base-8) and Hexadecimal (base-16) as compact shorthand.',
        keyPoints: [
          'Decimal to Any Base: Divide the integer part repeatedly by base r (record remainders bottom-up) and multiply the fractional part repeatedly by r (record integer carries top-down).',
          'Binary ↔ Octal Shortcut: Group binary bits in 3-bit triads (4-2-1 weights) outward from the radix point.',
          'Binary ↔ Hexadecimal Shortcut: Group binary bits in 4-bit nibbles (8-4-2-1 weights) where 10=A, 11=B, 12=C, 13=D, 14=E, 15=F.'
        ],
        formulaOrDiagramBox: {
          title: '4-Bit Binary, Octal, Decimal & Hexadecimal Reference Table',
          lines: [
            'Decimal    Binary (8-4-2-1)    Octal    Hex     │  Decimal    Binary (8-4-2-1)    Octal    Hex',
            '────────────────────────────────────────────────┼───────────────────────────────────────────────',
            '   0            0000             0       0      │     8            1000            10       8',
            '   1            0001             1       1      │     9            1001            11       9',
            '   5            0101             5       5      │    10            1010            12       A',
            '   7            0111             7       7      │    15            1111            17       F'
          ]
        },
        workedExample: {
          problem:
            'Example 3.1: Convert Hexadecimal (3F.A)₁₆ directly to Binary and Octal.',
          solutionSteps: [
            'Expand each hex digit to 4-bit binary: 3 = 0011, F = 1111, A = 1010 → (00111111.1010)₂.',
            'Regroup into 3-bit octal triads from the radix point: 000 111 111 . 101 000₂ = (77.5)₈.'
          ]
        },
        examTip:
          'When converting Octal to Hexadecimal, always bridge through Binary (Octal → 3-bit Binary → 4-bit Binary → Hex) to eliminate arithmetic errors.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Section 3.2',
        heading: 'Signed 8-Bit 2’s Complement Representation & Binary Addition',
        summary:
          'Modern Arithmetic Logic Units (ALUs) perform subtraction by adding the 2’s complement of the subtrahend, eliminating the need for dedicated hardware subtractor circuits.',
        keyPoints: [
          '1’s Complement: Invert every bit in the 8-bit register (0 → 1 and 1 → 0).',
          '2’s Complement: Add 1 to the Least Significant Bit (LSB) of the 1’s complement.',
          'Sign Bit (MSB): In an 8-bit signed register, bit 7 is 0 for positive numbers (+0 to +127) and 1 for negative numbers (-1 to -128).'
        ],
        formulaOrDiagramBox: {
          title: '8-Bit 2’s Complement Subtraction Example: (+25) + (-18)',
          lines: [
            '+25 in 8-bit Binary:              0 0 0 1 1 0 0 1',
            '+18 in 8-bit Binary:              0 0 0 1 0 0 1 0',
            '1’s Complement of 18:             1 1 1 0 1 1 0 1',
            '2’s Complement (-18) [+1]:        1 1 1 0 1 1 1 0',
            '───────────────────────────────────────────────────',
            'Sum (+25) + (-18):              1 0 0 0 0 0 1 1 1',
            'Discard 9th Carry Bit (1)   ⇒     0 0 0 0 0 1 1 1₂ = +7₁₀'
          ]
        },
        examTip:
          'Always write all 8 bits (including leading zeros) and explicitly state "Discard the 9th overflow carry bit" in your exam answer script.'
      },
      {
        pageNumber: 3,
        sectionCode: 'Section 3.3',
        heading: 'Boolean Algebra, De Morgan’s Laws & Universal Logic Gates',
        summary:
          'Logic gates implement Boolean expressions in hardware using HIGH (1 = +5V) and LOW (0 = 0V) voltage states.',
        keyPoints: [
          'Basic Gates: AND (Y = A·B), OR (Y = A + B), NOT (Y = Ā).',
          'Universal Gates: NAND and NOR gates are called universal gates because any Boolean circuit (AND, OR, NOT, XOR) can be constructed using ONLY NAND gates or ONLY NOR gates.',
          'De Morgan’s First Theorem: (A + B)̄ = Ā · B̄; Second Theorem: (A · B)̄ = Ā + B̄.'
        ],
        formulaOrDiagramBox: {
          title: '2-Input Logic Gate Truth Table Summary',
          lines: [
            'A   B  │  AND (A·B)   OR (A+B)   NAND (A·B)̄   NOR (A+B)̄   XOR (A⊕B)',
            '───────┼──────────────────────────────────────────────────────────────',
            '0   0  │      0          0           1            1           0',
            '0   1  │      0          1           1            0           1',
            '1   0  │      0          1           1            0           1',
            '1   1  │      1          1           0            0           0'
          ]
        },
        examTip:
          'To realize NOT from a 2-input NAND gate, tie both inputs together: Y = (A · A)̄ = Ā.'
      }
    ]
  },
  {
    id: 'lib-bgs-01',
    title: 'Emergence of Independent Bangladesh, Constitution & Economic Indicators',
    subject: 'BGS',
    courseCode: 'BGS-107',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 01–02',
    chapterName: 'Independent Bangladesh, Constitution & Economic Development',
    category: 'Chapter Study Guide',
    instructor: 'MD. AMIR HOSSAIN',
    updatedDate: '2026-09-30',
    fileName: 'SSC_BGS107_Ch01_02_Historical_Timeline_And_Civics.pdf',
    fileSize: '1.7 MB',
    totalPages: 2,
    readingTime: '14 min read',
    topics: [
      '1952 Language Movement & UNESCO 21 February Recognition',
      'Six-Point Charter (1966), 1969 Mass Uprising & 1970 Election',
      '1971 Liberation War, Mujibnagar Government & 1972 Constitution',
      'GDP, GNP, Per Capita Income & Sustainable Development Goals (SDGs)'
    ],
    overview:
      'Chronological historical milestone compendium from 1947 to 1972 alongside national macroeconomic accounting and constitutional principles.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'History Module 1.1',
        heading: 'Chronology of National Awakening (1948–1971) & Liberation War',
        summary:
          'The emergence of Bangladesh as a sovereign republic culminated from a 24-year constitutional, cultural, and democratic struggle for self-determination.',
        keyPoints: [
          '21 February 1952: Supreme sacrifice of Salam, Barkat, Rafiq, Jabbar, and Shafiur established Bangla as a state language; recognized by UNESCO on 17 November 1999 as International Mother Language Day.',
          '1954 United Front Election (21-Point Program) & 1966 Six-Point Charter of Regional Autonomy.',
          '10 April 1971: Formation of the Provisional Mujibnagar Government (sworn in on 17 April 1971 at Baidyanathtala, Meherpur) leading up to Victory Day on 16 December 1971.'
        ],
        formulaOrDiagramBox: {
          title: 'Key Historical Milestones Quick-Recall Timeline',
          lines: [
            '1952 (21 Feb):   State Language Movement martyrdom in Dhaka',
            '1954 (March):    United Front Provincial Election victory (223 of 237 seats)',
            '1966 (Feb):      Six-Point Demand for Economic & Political Autonomy',
            '1969 (Jan–Feb):  Historic Mass Uprising (Gono Abhyutthan)',
            '1970 (Dec):      General Election landslide victory (167 of 169 seats in East)',
            '1971 (26 Mar):   Independence Day · 16 Dec 1971: Victory Day (Bijoy Dibosh)',
            '1972 (04 Nov):   Adoption of the Constitution of Bangladesh (Effective 16 Dec 1972)'
          ]
        },
        examTip:
          'Distinguish carefully between 10 April 1971 (formation date of the Mujibnagar Government) and 17 April 1971 (formal oath-taking ceremony date).'
      },
      {
        pageNumber: 2,
        sectionCode: 'Economics Module 2.1',
        heading: 'National Income Accounting: GDP, GNI, NNI & SDG Targets',
        summary:
          'Macroeconomic performance is quantified by measuring the total monetary value of final goods and services produced within a fiscal year.',
        keyPoints: [
          'Gross Domestic Product (GDP): Total market value of all final goods and services produced within the geographical boundary of a country in one year.',
          'Gross National Income (GNI): GDP plus net factor income/remittances earned by citizens abroad minus income repatriated by foreigners.',
          'Per Capita Income = Total National Income (GNI) ÷ Total Mid-Year Population.'
        ],
        formulaOrDiagramBox: {
          title: 'National Economic Formulas & Sector Contributions',
          lines: [
            '1. GDP (Expenditure Method):   GDP = C + I + G + (X - M)',
            '2. Gross National Income:      GNI = GDP + (X_remittance - M_foreign)',
            '3. Net National Income:        NNI = GNI - Depreciation (Capital Consumption)',
            '4. Per Capita GNI:             PCI = Total GNI / Total Population'
          ]
        },
        examTip:
          'When analyzing stem scenarios involving expatriate workers sending remittances to Bangladesh, remember that remittances count toward GNI, whereas domestic garment factory output counts toward both GDP and GNI.'
      }
    ]
  },
  {
    id: 'lib-rel-01',
    title: 'Foundations of Faith, Moral Values & Ethical Social Stewardship',
    subject: 'Religion',
    courseCode: 'REL-108',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 01 & 04',
    chapterName: 'Foundations of Faith, Moral Values & Ethical Conduct',
    category: 'Chapter Study Guide',
    instructor: 'FAYSAL AHMED',
    updatedDate: '2026-09-27',
    fileName: 'SSC_REL108_Ch01_04_Ethics_And_Moral_Values.pdf',
    fileSize: '1.3 MB',
    totalPages: 2,
    readingTime: '11 min read',
    topics: [
      'Core Tenets of Faith & Spiritual Integrity',
      'Akhlaq-e-Hamidah (Praiseworthy Character Traits)',
      'Truthfulness, Justice, Compassion & Rights of Neighbors',
      'Dignity of Labor, Environmental Care & Civic Honesty'
    ],
    overview:
      'Comprehensive study notes on ethical character formation, social justice, environmental stewardship, and textual reflections for Half-Yearly and Final examinations.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Chapter 01',
        heading: 'Core Foundations of Faith & Conscience in Daily Conduct',
        summary:
          'Authentic faith integrates inner conviction with outward truthfulness, accountability, and service to humanity.',
        keyPoints: [
          'Moral accountability connects personal integrity with social welfare and honesty in academic and civic duties.',
          'Stewardship (Amanah) requires safeguarding public trust, fulfilling promises, and respecting the rights of fellow citizens.',
          'Gratitude (Shukr) and Patience (Sabr) cultivate resilience and empathy during both prosperity and adversity.'
        ],
        formulaOrDiagramBox: {
          title: 'Pillars of Ethical Character (Akhlaq-e-Hamidah)',
          lines: [
            '1. Sidq (Truthfulness):      Honesty in speech, testimony, and scholarship',
            '2. Amanah (Trustworthiness): Safeguarding responsibilities and commitments',
            '3. Adl (Justice & Equity):   Fairness toward all people regardless of background',
            '4. Khidmat-e-Khalq:          Compassionate service to humanity and creation'
          ]
        },
        examTip:
          'In creative questions on Amanah (trustworthiness), include examples of academic honesty, caring for school property, and fulfilling civic duties.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Chapter 04',
        heading: 'Social Ethics, Rights of Neighbors & Environmental Responsibility',
        summary:
          'Moral teachings emphasize harmony within the family, kindness toward neighbors, fair trade, and conservation of natural resources.',
        keyPoints: [
          'Respecting parents, teachers, and elders forms the bedrock of a harmonious scholarly community.',
          'Environmental ethics prohibits wastefulness (Israf) of water, food, and natural habitats, encouraging tree plantation and cleanliness.',
          'Dignity of labor honors honest effort and fair compensation for every worker.'
        ],
        formulaOrDiagramBox: {
          title: 'Summary of Social & Civic Responsibilities',
          lines: [
            '• Duty to Teachers & Scholars:  Respectful attention, humility, and diligence',
            '• Duty to Classmates & Peers:   Mutual cooperation, kindness, and anti-bullying',
            '• Duty to Environment:          Conserving water, preventing pollution, planting trees'
          ]
        },
        examTip:
          'Connect ethical principles directly to real-world student life when answering higher-order (ঘ) evaluation questions.'
      }
    ]
  },
  {
    id: 'lib-phy-03',
    title: 'Newtonian Dynamics, Momentum Conservation & Friction Solved Booklet',
    subject: 'Physics',
    courseCode: 'PHY-101',
    classLevel: 'Class 9–10',
    term: 'Half-Yearly Term',
    chapterNumber: 'Chapter 03',
    chapterName: 'Force (Newtonian Dynamics)',
    category: 'Solved Problem Booklet',
    instructor: 'Saif Chowdhury',
    updatedDate: '2026-10-06',
    fileName: 'SSC_PHY101_Ch03_Force_And_Momentum_Solved_Booklet.pdf',
    fileSize: '2.1 MB',
    totalPages: 2,
    readingTime: '15 min read',
    topics: [
      'Inertia & Newton’s Three Laws of Motion',
      'Linear Momentum & Impulse of a Force',
      'Conservation of Momentum & Elastic Collisions',
      'Static, Kinetic & Rolling Friction Analysis'
    ],
    overview:
      'Focused preparation booklet for Physics CT 03 (15 October) containing worked board-standard numericals on free-body diagrams, collision recoil velocity, and effective braking force.',
    pages: [
      {
        pageNumber: 1,
        sectionCode: 'Section 3.1 – 3.2',
        heading: 'Newton’s Second Law (F = ma), Impulse & Conservation of Momentum',
        summary:
          'The rate of change of linear momentum of a body is directly proportional to the net external force applied, and takes place in the direction in which the force acts.',
        keyPoints: [
          'Linear Momentum: p = m·v (vector quantity, SI unit: kg·m·s⁻¹ or N·s).',
          'Impulse of a Force: J = F · Δt = m·v - m·u = Δp (change in momentum).',
          'Law of Conservation of Linear Momentum: If net external force ΣF_ext = 0, total momentum before collision equals total momentum after collision (m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂).'
        ],
        formulaOrDiagramBox: {
          title: 'Dynamics & Collision Formula Sheet',
          lines: [
            '1. Net Force:                 F_net = m · a = m(v - u) / t',
            '2. Momentum Conservation:     m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂',
            '3. Combined Inelastic Vel:    v_common = (m₁u₁ + m₂u₂) / (m₁ + m₂)',
            '4. Recoil Velocity:           V_recoil = -(m · v) / M'
          ]
        },
        workedExample: {
          problem:
            'CT 03 Practice Problem 1: A 1,500 kg car moving at 20 m/s collides head-on with a 1,000 kg car moving in the opposite direction at 15 m/s. If they lock together after collision, find their common velocity.',
          solutionSteps: [
            'Take initial direction of first car as positive: u₁ = +20 m/s, u₂ = -15 m/s.',
            'Total initial momentum P_i = (1500 × 20) + (1000 × -15) = 30,000 - 15,000 = +15,000 kg·m/s.',
            'Common velocity v = P_i / (m₁ + m₂) = 15,000 / 2,500 = +6.0 m/s (in direction of the 1,500 kg car).'
          ]
        },
        examTip:
          'For head-on (opposite direction) collisions, always assign a negative sign (-) to one of the initial velocities before applying m₁u₁ + m₂u₂.'
      },
      {
        pageNumber: 2,
        sectionCode: 'Section 3.3',
        heading: 'Frictional Forces, Effective Acceleration & Free-Body Diagrams',
        summary:
          'When a driving force F_applied acts on a horizontal surface with kinetic friction f_k = μ_k·N, the net accelerating force is F_net = F_applied - f_k.',
        keyPoints: [
          'Normal Reaction on a flat horizontal surface: N = W = m·g.',
          'Kinetic Friction: f_k = μ_k · N = μ_k · m · g (always opposes relative sliding motion).',
          'Effective Acceleration: a = (F_applied - f_k) / m.'
        ],
        formulaOrDiagramBox: {
          title: 'Free-Body Force Balance Equations',
          lines: [
            'Vertical Equilibrium:     N - mg = 0   ⇒   N = mg',
            'Horizontal Equation:      F_applied - f_k = m · a',
            'Braking Retardation:      a_brake = -f_brake / m = -μ_k · g'
          ]
        },
        workedExample: {
          problem:
            'CT 03 Practice Problem 2: A horizontal pull of 80 N is applied to a 10 kg wooden block resting on a laboratory bench. If the frictional resistance is 25 N, find the acceleration of the block.',
          solutionSteps: [
            'Net Force F_net = F_applied - f_k = 80 N - 25 N = 55 N.',
            'Acceleration a = F_net / m = 55 / 10 = 5.5 m/s².'
          ]
        },
        examTip:
          'If a body moves with constant (uniform) velocity under an applied pull of 80 N, net acceleration a = 0, which immediately tells you the frictional force is exactly 80 N.'
      }
    ]
  }
];

function sanitizePdfText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/─/g, '-')
    .replace(/│/g, '|')
    .replace(/┼/g, '+')
    .replace(/►/g, '>')
    .replace(/↑/g, '^')
    .replace(/↓/g, 'v')
    .replace(/⇒/g, '=>')
    .replace(/→/g, '->')
    .replace(/↔/g, '<->')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/±/g, '+/-')
    .replace(/≈/g, '~=')
    .replace(/∝/g, 'prop. to')
    .replace(/•/g, '*')
    .replace(/·/g, '-')
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₈/g, '8')
    .replace(/⁰/g, '0')
    .replace(/¹/g, '1')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/⁵/g, '5')
    .replace(/⁶/g, '6')
    .replace(/⁺/g, '+')
    .replace(/⁻/g, '-')
    .replace(/[^\x20-\x7E]/g, '');
}

function wrapTextLines(text: string, maxChars: number): string[] {
  const cleaned = sanitizePdfText(text);
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    if ((current + ' ' + words[i]).length <= maxChars) {
      current += ' ' + words[i];
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

/**
 * Generates a valid multi-page PDF-1.4 file binary so students can download
 * and open the course lecture notes in any desktop or mobile PDF viewer.
 */
function generateValidPdfBlob(resource: LibraryResourceItem, studentNotes: string): Blob {
  const pageStreams: string[] = resource.pages.map((page) => {
    const ops: string[] = [];
    let y = 790;

    const addLine = (
      text: string,
      font: 'F1' | 'F2' | 'F3' = 'F1',
      size = 10,
      indent = 48,
      lineGap = 14
    ) => {
      if (y < 52) return;
      const safe = sanitizePdfText(text);
      ops.push(`BT /${font} ${size} Tf ${indent} ${y} Td (${safe}) Tj ET`);
      y -= lineGap;
    };

    // Header Banner
    addLine(
      `SCHOLAR'S SCHOOL & COLLEGE - DIGITAL LIBRARY | ${resource.courseCode} (${resource.subject.toUpperCase()})`,
      'F2',
      9,
      48,
      13
    );
    addLine(
      `${resource.title}  [Page ${page.pageNumber} of ${resource.totalPages}]`,
      'F2',
      12,
      48,
      16
    );
    addLine(
      `${resource.chapterNumber}: ${resource.chapterName} | Instructor: ${resource.instructor} | Term: ${resource.term}`,
      'F1',
      9,
      48,
      14
    );
    addLine(
      '----------------------------------------------------------------------------------------------------',
      'F3',
      8,
      48,
      16
    );

    // Page Section Heading
    addLine(`${page.sectionCode}: ${page.heading}`, 'F2', 11, 48, 16);

    // Summary Paragraph
    wrapTextLines(page.summary, 88).forEach((ln) => addLine(ln, 'F1', 9.5, 48, 13));
    y -= 6;

    // Key Points
    addLine('KEY CONCEPTS & LECTURE NOTES:', 'F2', 10, 48, 14);
    page.keyPoints.forEach((kp, idx) => {
      const wrapped = wrapTextLines(`${idx + 1}. ${kp}`, 84);
      wrapped.forEach((ln, lineIdx) => addLine(ln, 'F1', 9.5, lineIdx === 0 ? 54 : 66, 13));
    });
    y -= 6;

    // Formula / Diagram Box
    if (page.formulaOrDiagramBox) {
      addLine(`[ ${page.formulaOrDiagramBox.title} ]`, 'F2', 9.5, 48, 14);
      page.formulaOrDiagramBox.lines.forEach((fl) => {
        addLine(fl, 'F3', 8.5, 56, 12);
      });
      y -= 6;
    }

    // Worked Example
    if (page.workedExample) {
      addLine('WORKED EXAMPLE:', 'F2', 9.5, 48, 13);
      wrapTextLines(page.workedExample.problem, 85).forEach((ln) =>
        addLine(ln, 'F2', 9, 54, 12)
      );
      page.workedExample.solutionSteps.forEach((st) => {
        wrapTextLines(`* ${st}`, 84).forEach((ln) => addLine(ln, 'F1', 9, 60, 12));
      });
      y -= 6;
    }

    // Exam Tip
    if (page.examTip) {
      wrapTextLines(`Exam Strategy Note: ${page.examTip}`, 86).forEach((ln) =>
        addLine(ln, 'F2', 9, 48, 13)
      );
    }

    // Student Personal Study Notes on final page
    if (page.pageNumber === resource.totalPages && studentNotes.trim()) {
      y -= 6;
      addLine('MY PERSONAL STUDY NOTES:', 'F2', 9.5, 48, 13);
      wrapTextLines(studentNotes.trim(), 85).forEach((ln) => addLine(ln, 'F1', 9, 54, 12));
    }

    // Footer
    ops.push(
      `BT /F1 8 Tf 48 28 Td (Scholar's School & College Digital Library - ${sanitizePdfText(
        resource.fileName
      )} - Page ${page.pageNumber} of ${resource.totalPages}) Tj ET`
    );

    return ops.join('\n');
  });

  // Construct valid PDF 1.4 object table
  // Object 1: Catalog
  // Object 2: Pages
  // Object 3: Font F1 (Helvetica)
  // Object 4: Font F2 (Helvetica-Bold)
  // Object 5: Font F3 (Courier)
  // Objects 6..(5 + 2*N): Page and Content Stream pairs
  const objects: string[] = [];
  const pageCount = pageStreams.length;
  const pageObjectIds: number[] = [];

  for (let i = 0; i < pageCount; i++) {
    pageObjectIds.push(6 + i * 2);
  }

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj`
  );
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj');

  for (let i = 0; i < pageCount; i++) {
    const pageObjId = 6 + i * 2;
    const contentObjId = pageObjId + 1;
    const streamData = pageStreams[i];
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream\nendobj`
    );
  }

  let pdfBody = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdfBody.length);
    pdfBody += obj + '\n';
  }

  const xrefOffset = pdfBody.length;
  pdfBody += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdfBody += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdfBody += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdfBody], { type: 'application/pdf' });
}

interface StudentDigitalLibraryProps {
  studentName: string;
  studentClass: string;
  studentSection: string;
  syllabus: SyllabusChapter[];
  initialSubject?: string;
}

const BOOKMARKS_STORAGE_KEY = 'ssc_student_library_bookmarks_v1';
const COMPLETED_STORAGE_KEY = 'ssc_student_library_completed_v1';
const NOTES_STORAGE_KEY = 'ssc_student_library_personal_notes_v1';

export const StudentDigitalLibrary: React.FC<StudentDigitalLibraryProps> = ({
  studentName,
  studentClass,
  studentSection,
  syllabus,
  initialSubject = 'All'
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTerm, setSelectedTerm] = useState<'All' | 'Half-Yearly Term' | 'Final Term'>('All');
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active resource in the built-in PDF Lecture Notes Viewer
  const [activeResourceId, setActiveResourceId] = useState<string>(DIGITAL_LIBRARY_RESOURCES[0].id);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [fullscreenReaderOpen, setFullscreenReaderOpen] = useState<boolean>(false);

  // Persisted bookmarks, completed state, and personal study notes
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { 'lib-phy-01': true, 'lib-bio-01': true };
    } catch {
      return { 'lib-phy-01': true };
    }
  });

  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { 'lib-phy-02': true };
    } catch {
      return {};
    }
  });

  const [personalNotesByResource, setPersonalNotesByResource] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedIds));
    } catch {
      // ignore storage errors
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completedIds));
    } catch {
      // ignore storage errors
    }
  }, [completedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(personalNotesByResource));
    } catch {
      // ignore storage errors
    }
  }, [personalNotesByResource]);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCompleted = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Merge any custom teacher-uploaded syllabus notes so all courses stay represented
  const allLibraryResources = useMemo(() => {
    const existingKeys = new Set(
      DIGITAL_LIBRARY_RESOURCES.map((r) => `${r.subject}:${r.chapterNumber}`)
    );
    const dynamicFromSyllabus: LibraryResourceItem[] = syllabus
      .filter((s) => !existingKeys.has(`${s.subject}:${s.chapterNumber}`))
      .map((s, idx) => ({
        id: `lib-syl-${s.id}`,
        title: `${s.chapterName} — Course Lecture Notes & Topic Summary`,
        subject: s.subject,
        courseCode: `${s.subject.slice(0, 3).toUpperCase()}-10${idx + 1}`,
        classLevel: s.class,
        term: s.term,
        chapterNumber: s.chapterNumber,
        chapterName: s.chapterName,
        category: 'PDF Lecture Notes' as ResourceCategory,
        instructor: s.teacherNotes.replace('Instructor:', '').split('·')[0].trim() || 'Subject Faculty',
        updatedDate: '2026-10-05',
        fileName: `SSC_${s.subject}_${s.chapterNumber.replace(/\s+/g, '')}_Notes.pdf`,
        fileSize: '1.2 MB',
        totalPages: 1,
        readingTime: '10 min read',
        topics: s.topics,
        overview: s.teacherNotes,
        pages: [
          {
            pageNumber: 1,
            sectionCode: s.chapterNumber,
            heading: `${s.subject}: ${s.chapterName}`,
            summary: s.teacherNotes,
            keyPoints: s.topics.map(
              (t) => `${t} — Core conceptual principles, textbook definitions, and worked problem sets.`
            )
          }
        ]
      }));

    return [...DIGITAL_LIBRARY_RESOURCES, ...dynamicFromSyllabus];
  }, [syllabus]);

  // Subject count map
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allLibraryResources.length };
    SUBJECT_SEQUENCE.forEach((subj) => {
      counts[subj] = allLibraryResources.filter((r) => r.subject === subj).length;
    });
    return counts;
  }, [allLibraryResources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return allLibraryResources.filter((res) => {
      if (selectedSubject !== 'All' && res.subject !== selectedSubject) return false;
      if (selectedCategory !== 'All' && res.category !== selectedCategory) return false;
      if (selectedTerm !== 'All' && res.term !== selectedTerm) return false;
      if (showSavedOnly && !bookmarkedIds[res.id]) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesSubject = res.subject.toLowerCase().includes(q);
        const matchesChapter =
          res.chapterName.toLowerCase().includes(q) || res.chapterNumber.toLowerCase().includes(q);
        const matchesInstructor = res.instructor.toLowerCase().includes(q);
        const matchesTopics = res.topics.some((t) => t.toLowerCase().includes(q));
        const matchesPageContent = res.pages.some(
          (p) =>
            p.heading.toLowerCase().includes(q) ||
            p.summary.toLowerCase().includes(q) ||
            p.keyPoints.some((kp) => kp.toLowerCase().includes(q))
        );
        return (
          matchesTitle ||
          matchesSubject ||
          matchesChapter ||
          matchesInstructor ||
          matchesTopics ||
          matchesPageContent
        );
      }
      return true;
    });
  }, [
    allLibraryResources,
    selectedSubject,
    selectedCategory,
    selectedTerm,
    showSavedOnly,
    bookmarkedIds,
    searchQuery
  ]);

  const activeResource = useMemo(() => {
    return (
      allLibraryResources.find((r) => r.id === activeResourceId) ||
      filteredResources[0] ||
      allLibraryResources[0]
    );
  }, [allLibraryResources, activeResourceId, filteredResources]);

  const currentPage: LecturePageContent =
    activeResource.pages[activePageIndex] || activeResource.pages[0];

  const handleSelectResource = (res: LibraryResourceItem, openFullscreen = false) => {
    setActiveResourceId(res.id);
    setActivePageIndex(0);
    if (openFullscreen) {
      setFullscreenReaderOpen(true);
    }
  };

  const handleDownloadPdf = (res: LibraryResourceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const notes = personalNotesByResource[res.id] || '';
    const blob = generateValidPdfBlob(res, notes);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintNotes = () => {
    window.print();
  };

  const totalBookmarked = Object.values(bookmarkedIds).filter(Boolean).length;
  const totalCompleted = Object.values(completedIds).filter(Boolean).length;

  const categories: Array<'All' | ResourceCategory> = [
    'All',
    'PDF Lecture Notes',
    'Formula & Reference Sheet',
    'Lab & Practical Manual',
    'Chapter Study Guide',
    'Solved Problem Booklet'
  ];

  const renderPdfPageDocument = (isModal = false) => (
    <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl overflow-hidden flex flex-col">
      {/* PDF Reader Top Control Bar */}
      <div className="p-4 bg-black border-b border-white/15 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <span className="text-white font-semibold">{activeResource.courseCode}</span>
            <span aria-hidden="true">·</span>
            <span>{activeResource.subject}</span>
            <span aria-hidden="true">·</span>
            <span>{activeResource.category}</span>
            <span aria-hidden="true">·</span>
            <span>{activeResource.fileName}</span>
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-white truncate mt-0.5">
            {activeResource.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Page Stepper */}
          <div className="inline-flex items-center gap-1 bg-[#11131C] border border-white/15 rounded-lg p-1">
            <button
              type="button"
              disabled={activePageIndex <= 0}
              onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded text-neutral-300 hover:text-white disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-mono text-white tabular-nums">
              Page {activePageIndex + 1} / {activeResource.pages.length}
            </span>
            <button
              type="button"
              disabled={activePageIndex >= activeResource.pages.length - 1}
              onClick={() =>
                setActivePageIndex((p) => Math.min(activeResource.pages.length - 1, p + 1))
              }
              className="p-1.5 rounded text-neutral-300 hover:text-white disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="inline-flex items-center gap-1 bg-[#11131C] border border-white/15 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.max(85, z - 10))}
              className="p-1.5 rounded text-neutral-300 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono text-neutral-200 tabular-nums">
              {zoomPercent}%
            </span>
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.min(130, z + 10))}
              className="p-1.5 rounded text-neutral-300 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bookmark & Complete Actions */}
          <button
            type="button"
            onClick={() => toggleBookmark(activeResource.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              bookmarkedIds[activeResource.id]
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                : 'bg-white/5 border-white/15 text-neutral-300 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{bookmarkedIds[activeResource.id] ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleCompleted(activeResource.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              completedIds[activeResource.id]
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                : 'bg-white/5 border-white/15 text-neutral-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedIds[activeResource.id] ? 'Completed' : 'Mark Read'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadPdf(activeResource)}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {!isModal ? (
            <button
              type="button"
              onClick={() => setFullscreenReaderOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Expand Reader</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFullscreenReaderOpen(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title="Close Fullscreen Reader"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Page Tabs Bar */}
      <div className="px-4 py-2.5 bg-[#0D0F17] border-b border-white/10 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {activeResource.pages.map((p, idx) => (
            <button
              key={p.pageNumber}
              type="button"
              onClick={() => setActivePageIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                activePageIndex === idx
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white bg-black/50 border border-white/10'
              }`}
            >
              Page {p.pageNumber}: {p.sectionCode}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handlePrintNotes}
          className="px-2.5 py-1 rounded-lg text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Sheet</span>
        </button>
      </div>

      {/* Rendered PDF Lecture Sheet Surface */}
      <div className="p-4 sm:p-8 bg-[#07080C] overflow-x-auto">
        <div
          className="mx-auto max-w-3xl bg-[#0E111B] border border-white/15 rounded-xl p-6 sm:p-8 space-y-6 transition-all"
          style={{ fontSize: `${zoomPercent}%` }}
        >
          {/* Sheet Masthead */}
          <div className="pb-4 border-b border-white/15 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono text-neutral-400">
                SCHOLAR&apos;S SCHOOL &amp; COLLEGE · ACADEMIC LECTURE ARCHIVE
              </div>
              <h4 className="font-display text-lg sm:text-xl font-bold text-white mt-1">
                {currentPage.sectionCode}: {currentPage.heading}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1">
                <span>Faculty: {activeResource.instructor}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {activeResource.chapterNumber} ({activeResource.chapterName})
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeResource.term}</span>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-neutral-400 shrink-0">
              <div className="text-white font-bold">
                Page {currentPage.pageNumber} of {activeResource.totalPages}
              </div>
              <div>Updated {activeResource.updatedDate}</div>
            </div>
          </div>

          {/* Executive Concept Overview */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-semibold text-neutral-300">
              01. Conceptual Overview
            </div>
            <p className="text-sm text-neutral-200 leading-relaxed">{currentPage.summary}</p>
          </div>

          {/* Core Lecture Notes & Key Points */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono font-semibold text-neutral-300">
              02. Key Lecture Points &amp; Definitions
            </div>
            <ol className="space-y-2.5 text-sm text-neutral-200 list-decimal list-inside leading-relaxed">
              {currentPage.keyPoints.map((pt, i) => (
                <li
                  key={i}
                  className="p-3 rounded-lg bg-black/60 border border-white/10 text-neutral-100"
                >
                  {pt}
                </li>
              ))}
            </ol>
          </div>

          {/* Equations / Structured Reference Table */}
          {currentPage.formulaOrDiagramBox && (
            <div className="space-y-2">
              <div className="text-xs font-mono font-semibold text-neutral-300">
                03. {currentPage.formulaOrDiagramBox.title}
              </div>
              <div className="p-4 rounded-xl bg-black border border-white/15 font-mono text-xs text-emerald-300 space-y-1.5 overflow-x-auto leading-relaxed">
                {currentPage.formulaOrDiagramBox.lines.map((line, idx) => (
                  <div key={idx} className="whitespace-pre">
                    {line || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Worked Example */}
          {currentPage.workedExample && (
            <div className="p-4 sm:p-5 rounded-xl bg-[#131726] border border-white/15 space-y-3">
              <div className="text-xs font-mono font-bold text-white">
                04. Worked Problem &amp; Step-by-Step Derivation
              </div>
              <p className="text-xs sm:text-sm font-semibold text-neutral-100 leading-relaxed">
                {currentPage.workedExample.problem}
              </p>
              <div className="space-y-1.5 pt-2 border-t border-white/10 font-mono text-xs text-neutral-300">
                {currentPage.workedExample.solutionSteps.map((step, idx) => (
                  <div key={idx}>
                    Step {idx + 1}: {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examiner & Board Tip */}
          {currentPage.examTip && (
            <div className="p-3.5 rounded-xl bg-black border border-white/15 text-xs text-neutral-300 leading-relaxed">
              <strong className="text-white font-mono">Instructor Exam Note: </strong>
              {currentPage.examTip}
            </div>
          )}

          {/* Bottom Page Navigation Footer inside the PDF sheet */}
          <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
            <span className="font-mono">
              {activeResource.fileName} · {activeResource.fileSize}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activePageIndex <= 0}
                onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                ← Previous Page
              </button>
              <button
                type="button"
                disabled={activePageIndex >= activeResource.pages.length - 1}
                onClick={() =>
                  setActivePageIndex((p) => Math.min(activeResource.pages.length - 1, p + 1))
                }
                className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 font-semibold disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                Next Page →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Student Personal Margin Notes for this PDF Resource */}
      <div className="p-4 sm:p-5 bg-black border-t border-white/15 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <NotebookPen className="w-4 h-4 text-neutral-300" />
            <span>My Study Annotations for {activeResource.courseCode}</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Auto-saved &amp; included when you click Download PDF
          </span>
        </div>
        <textarea
          rows={2}
          value={personalNotesByResource[activeResource.id] || ''}
          onChange={(e) =>
            setPersonalNotesByResource((prev) => ({
              ...prev,
              [activeResource.id]: e.target.value
            }))
          }
          placeholder={`Write your personal revision notes or questions for ${activeResource.title}...`}
          className="w-full bg-[#0A0A0A] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/40"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Library Summary Metrics */}
      <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-neutral-400">
              {studentClass} ({studentSection}) · {studentName}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Digital Library &amp; Course Lecture Notes
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              Browse course-specific PDF lecture notes, formula compendiums, and laboratory manuals prepared by Scholar&apos;s School &amp; College faculty. Read multi-page notes directly or download the full PDF.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-black border border-white/15">
              <div className="text-[11px] text-neutral-400">Course Resources</div>
              <div className="font-mono text-lg font-bold text-white tabular-nums mt-0.5">
                {allLibraryResources.length}
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-black border border-white/15">
              <div className="text-[11px] text-neutral-400">Saved Notes</div>
              <div className="font-mono text-lg font-bold text-amber-300 tabular-nums mt-0.5">
                {totalBookmarked}
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-black border border-white/15">
              <div className="text-[11px] text-neutral-400">Completed</div>
              <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
                {totalCompleted}
              </div>
            </div>
          </div>
        </div>

        {/* Course / Subject Selector Tabs */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-neutral-300">Filter by Course</span>
            <button
              type="button"
              onClick={() => setShowSavedOnly((prev) => !prev)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                showSavedOnly
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                  : 'bg-black border-white/15 text-neutral-300 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Bookmarks Only ({totalBookmarked})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['All', ...SUBJECT_SEQUENCE].map((subj) => {
              const active = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 ${
                    active
                      ? 'bg-white text-black font-bold'
                      : 'bg-black border border-white/15 text-neutral-300 hover:text-white hover:border-white/30'
                  }`}
                >
                  <span>{subj === 'All' ? 'All Courses' : subj}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active ? 'text-black/70' : 'text-neutral-500'
                    }`}
                  >
                    {subjectCounts[subj] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Resource Type Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lecture notes, chapter, equation, or instructor..."
              className="w-full bg-black border border-white/15 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/40"
            />
          </div>

          <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white/15 text-white font-semibold border border-white/30'
                    : 'bg-black border border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {cat === 'All' ? 'All Formats' : cat}
              </button>
            ))}
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedTerm}
              onChange={(e) =>
                setSelectedTerm(e.target.value as 'All' | 'Half-Yearly Term' | 'Final Term')
              }
              className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="All">All Terms</option>
              <option value="Half-Yearly Term">Half-Yearly Term</option>
              <option value="Final Term">Final Term</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Workspace: Course Resource Catalog (Left) + Built-in PDF Lecture Notes Viewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Course Study Resources List */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display text-sm font-bold text-white">
              Course Study Resources ({filteredResources.length})
            </h3>
            {selectedSubject !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedSubject('All')}
                className="text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>

          {filteredResources.length === 0 ? (
            <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-8 text-center space-y-3">
              <FolderOpen className="w-8 h-8 text-neutral-500 mx-auto" />
              <div className="font-display text-base font-bold text-white">
                No Matching Study Resources
              </div>
              <p className="text-xs text-neutral-400">
                Try clearing your search query or switching to All Courses.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject('All');
                  setSelectedCategory('All');
                  setSelectedTerm('All');
                  setShowSavedOnly(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold cursor-pointer"
              >
                Show All Resources
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((res) => {
                const isSelected = res.id === activeResource.id;
                const isSaved = Boolean(bookmarkedIds[res.id]);
                const isDone = Boolean(completedIds[res.id]);

                return (
                  <div
                    key={res.id}
                    onClick={() => handleSelectResource(res)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-[#121624] border-white/40'
                        : 'bg-[#0A0A0A] border-white/15 hover:border-white/30'
                    }`}
                  >
                    <div>
                      {/* Clean unboxed metadata with typographic separators */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-white">{res.subject}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{res.courseCode}</span>
                          <span aria-hidden="true">·</span>
                          <span>{res.chapterNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>{res.category}</span>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                          {res.totalPages} {res.totalPages === 1 ? 'Page' : 'Pages'} · {res.fileSize}
                        </span>
                      </div>

                      <h4 className="font-display text-base font-bold text-white mt-1.5 leading-snug">
                        {res.title}
                      </h4>

                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {res.overview}
                      </p>
                    </div>

                    {/* Topics line */}
                    <div className="text-[11px] text-neutral-400">
                      <span className="text-neutral-300 font-medium">Topics: </span>
                      {res.topics.join(' · ')}
                    </div>

                    {/* Footer info & actions */}
                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-neutral-400">
                        <span>{res.instructor}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono">{res.readingTime}</span>
                        {isDone && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="text-emerald-400 font-semibold">Read</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(res.id, e)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSaved
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-black border-white/15 text-neutral-400 hover:text-white'
                          }`}
                          title={isSaved ? 'Remove Bookmark' : 'Bookmark Resource'}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectResource(res, true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(res, e)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Multi-Page PDF Lecture Notes Viewer */}
        <div className="lg:col-span-7 lg:sticky lg:top-6">
          {renderPdfPageDocument(false)}
        </div>
      </div>

      {/* Fullscreen Modal PDF Reader */}
      {fullscreenReaderOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto rounded-2xl">
            {renderPdfPageDocument(true)}
          </div>
        </div>
      )}
    </div>
  );
};
