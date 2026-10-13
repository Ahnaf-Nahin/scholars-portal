export interface QuizQuestion {
  id: string;
  quizType: 'gk' | 'science' | 'math' | 'iq' | 'english';
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  inputType?: 'mcq' | 'numerical';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  steps?: string[];
}

export const BRAINIFY_QUESTIONS: QuizQuestion[] = [
  // GENERAL KNOWLEDGE QUIZ (World & Bangladesh Knowledge Test)
  {
    id: 'gk-1',
    quizType: 'gk',
    category: 'Bangladesh Affairs',
    difficulty: 'Easy',
    question: 'Which river system forms the world’s largest delta in Bangladesh before emptying into the Bay of Bengal?',
    options: [
      'Ganges-Brahmaputra-Meghna (GBM) Delta',
      'Nile-Mediterranean Delta',
      'Amazon-Orinoco Delta',
      'Mekong-Irrawaddy Delta'
    ],
    correctAnswer: 'Ganges-Brahmaputra-Meghna (GBM) Delta',
    explanation: 'The Ganges (Padma), Brahmaputra (Jamuna), and Meghna rivers converge in Bangladesh to form the Bengal Delta, the largest river delta in the world.'
  },
  {
    id: 'gk-2',
    quizType: 'gk',
    category: 'Bangladesh Affairs',
    difficulty: 'Easy',
    question: 'On which date did UNESCO proclaim 21 February as International Mother Language Day in recognition of the 1952 Bengali Language Movement?',
    options: ['17 November 1999', '16 December 1997', '26 March 2000', '21 February 1995'],
    correctAnswer: '17 November 1999',
    explanation: 'UNESCO declared 21 February as International Mother Language Day on 17 November 1999 to honor the martyrs of the 1952 Language Movement in Dhaka.'
  },
  {
    id: 'gk-3',
    quizType: 'gk',
    category: 'Bangladesh Science & History',
    difficulty: 'Medium',
    question: 'Which pioneering Bangladeshi-born physicist and botanist demonstrated wireless millimeter-wave radio transmission in 1895 and invented the crescograph?',
    options: [
      'Sir Jagadish Chandra Bose',
      'Satyendra Nath Bose',
      'Meghnad Saha',
      'Fazlur Rahman Khan'
    ],
    correctAnswer: 'Sir Jagadish Chandra Bose',
    explanation: 'Acharya Sir Jagadish Chandra Bose (whose ancestral home is in Bikrampur/Munshiganj) pioneered 60 GHz millimeter-wave radio physics and plant electrophysiology.'
  },
  {
    id: 'gk-4',
    quizType: 'gk',
    category: 'Bangladesh Engineering',
    difficulty: 'Medium',
    question: 'Which Bangladeshi-American structural engineer invented the "tubular design" system for skyscrapers such as the Willis (Sears) Tower and John Hancock Center?',
    options: [
      'Dr. Fazlur Rahman Khan',
      'Dr. Muhammad Qudrat-i-Khuda',
      'Dr. Jamal Nazrul Islam',
      'Dr. Abdus Suttar Khan'
    ],
    correctAnswer: 'Dr. Fazlur Rahman Khan',
    explanation: 'Dr. Fazlur Rahman Khan revolutionized high-rise architecture with his framed-tube and bundled-tube structural systems.'
  },
  {
    id: 'gk-5',
    quizType: 'gk',
    category: 'World Geography',
    difficulty: 'Easy',
    question: 'Which is the deepest oceanic trench on Earth, reaching a depth of nearly 11,000 meters in the western Pacific Ocean?',
    options: ['Mariana Trench', 'Tonga Trench', 'Puerto Rico Trench', 'Java (Sunda) Trench'],
    correctAnswer: 'Mariana Trench',
    explanation: 'Challenger Deep in the Mariana Trench is the deepest known point in Earth’s seabed at approximately 10,935 meters.'
  },
  {
    id: 'gk-6',
    quizType: 'gk',
    category: 'World Science & Technology',
    difficulty: 'Medium',
    question: 'What was the name of the first geostationary communications satellite launched for Bangladesh in May 2018?',
    options: ['Bangabandhu-1', 'Anweshan-1', 'Padma-Sat 1', 'Bengal-Orbit 1'],
    correctAnswer: 'Bangabandhu-1',
    explanation: 'Bangabandhu Satellite-1 was launched on 11 May 2018 aboard a SpaceX Falcon 9 Block 5 rocket to the 119.1° East geostationary slot.'
  },
  {
    id: 'gk-7',
    quizType: 'gk',
    category: 'World Affairs',
    difficulty: 'Hard',
    question: 'Where is the headquarters of the European Organization for Nuclear Research (CERN), home to the 27-kilometer Large Hadron Collider?',
    options: ['Geneva, Switzerland', 'Vienna, Austria', 'Brussels, Belgium', 'Munich, Germany'],
    correctAnswer: 'Geneva, Switzerland',
    explanation: 'CERN is located at Meyrin near Geneva on the Franco-Swiss border and operates the Large Hadron Collider.'
  },
  {
    id: 'gk-8',
    quizType: 'gk',
    category: 'Bangladesh Affairs',
    difficulty: 'Medium',
    question: 'What is the total length of the main span of the Padma Multipurpose Bridge connecting Mawa and Jajira in Bangladesh?',
    options: ['6.15 km', '4.80 km', '5.50 km', '7.25 km'],
    correctAnswer: '6.15 km',
    explanation: 'The two-level steel truss Padma Bridge has a main bridge length of 6.15 kilometers across the Padma River.'
  },

  // SCIENCE QUIZ
  {
    id: 'sci-1',
    quizType: 'science',
    category: 'Physics',
    difficulty: 'Easy',
    question: 'What is the SI unit of electric current?',
    options: ['Volt (V)', 'Ampere (A)', 'Ohm (Ω)', 'Coulomb (C)'],
    correctAnswer: 'Ampere (A)',
    explanation: 'Electric current is the rate of flow of electric charge (I = Q/t) and is measured in Amperes (A), equal to 1 Coulomb per second.'
  },
  {
    id: 'sci-2',
    quizType: 'science',
    category: 'Physics',
    difficulty: 'Medium',
    question: 'If the velocity of a moving object is doubled while its mass remains constant, how does its kinetic energy change?',
    options: ['It doubles (2×)', 'It quadruples (4×)', 'It halves (0.5×)', 'It increases eightfold (8×)'],
    correctAnswer: 'It quadruples (4×)',
    explanation: 'Kinetic energy is KE = ½mv². Since velocity v is squared, doubling v multiplies KE by 2² = 4.'
  },
  {
    id: 'sci-3',
    quizType: 'science',
    category: 'Physics',
    difficulty: 'Hard',
    question: 'Two resistors of 6 Ω and 3 Ω are connected in parallel across a 12 V ideal battery. What is the total current drawn from the battery?',
    options: ['1.33 A', '4.0 A', '6.0 A', '2.0 A'],
    correctAnswer: '6.0 A',
    explanation: 'Equivalent parallel resistance R_eq = (6 × 3) / (6 + 3) = 2 Ω. By Ohm’s Law, I = V / R_eq = 12 V / 2 Ω = 6.0 A.'
  },
  {
    id: 'sci-4',
    quizType: 'science',
    category: 'Chemistry',
    difficulty: 'Easy',
    question: 'What is the pH of a pure neutral water sample at 25 °C?',
    options: ['0.0', '5.5', '7.0', '14.0'],
    correctAnswer: '7.0',
    explanation: 'At 25 °C, Kw = 1.0 × 10⁻¹⁴, yielding [H⁺] = [OH⁻] = 1.0 × 10⁻⁷ M, so pH = -log(10⁻⁷) = 7.0.'
  },
  {
    id: 'sci-5',
    quizType: 'science',
    category: 'Chemistry',
    difficulty: 'Medium',
    question: 'Which type of chemical bond is formed by the complete transfer of valence electrons from a metal to a non-metal?',
    options: ['Covalent bond', 'Ionic bond', 'Metallic bond', 'Hydrogen bond'],
    correctAnswer: 'Ionic bond',
    explanation: 'Metals lose valence electrons to form cations and non-metals gain them to form anions; electrostatic attraction forms an ionic bond.'
  },
  {
    id: 'sci-6',
    quizType: 'science',
    category: 'Chemistry',
    difficulty: 'Hard',
    question: 'How many moles of CO₂ are produced when 32 g of pure methane (CH₄, molar mass = 16 g/mol) undergoes complete combustion?',
    options: ['1.0 mol', '2.0 mol', '4.0 mol', '0.5 mol'],
    correctAnswer: '2.0 mol',
    explanation: 'CH₄ + 2O₂ → CO₂ + 2H₂O. 32 g of CH₄ = 2.0 mol CH₄. Stoichiometry is 1:1 between CH₄ and CO₂, yielding 2.0 mol CO₂.'
  },
  {
    id: 'sci-7',
    quizType: 'science',
    category: 'Biology',
    difficulty: 'Easy',
    question: 'Which cellular organelle generates most of the cell’s supply of adenosine triphosphate (ATP)?',
    options: ['Golgi apparatus', 'Ribosome', 'Mitochondrion', 'Lysosome'],
    correctAnswer: 'Mitochondrion',
    explanation: 'Mitochondria perform cellular respiration and oxidative phosphorylation, generating ATP for the cell.'
  },
  {
    id: 'sci-8',
    quizType: 'science',
    category: 'Biology',
    difficulty: 'Medium',
    question: 'In vascular plants, which specialized tissue transports water and dissolved minerals upward from the roots to the leaves?',
    options: ['Phloem', 'Xylem', 'Cambium', 'Epidermis'],
    correctAnswer: 'Xylem',
    explanation: 'Xylem vessels transport water and inorganic ions unidirectionally from roots to shoots via transpiration pull.'
  },
  {
    id: 'sci-9',
    quizType: 'science',
    category: 'Biology',
    difficulty: 'Hard',
    question: 'According to the Bohr effect, how does elevated CO₂ and lower pH in active tissues affect hemoglobin?',
    options: [
      'Increases hemoglobin’s affinity for oxygen',
      'Decreases hemoglobin’s affinity for oxygen, promoting oxygen release to active tissues',
      'Denatures the heme iron group permanently',
      'Converts hemoglobin into myoglobin'
    ],
    correctAnswer: 'Decreases hemoglobin’s affinity for oxygen, promoting oxygen release to active tissues',
    explanation: 'Higher CO₂ and H⁺ shift the oxygen dissociation curve to the right, facilitating oxygen unloading to respiring tissues.'
  },
  {
    id: 'sci-10',
    quizType: 'science',
    category: 'Earth Science',
    difficulty: 'Easy',
    question: 'Which layer of Earth’s atmosphere contains the ozone layer that absorbs most ultraviolet (UV) solar radiation?',
    options: ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'],
    correctAnswer: 'Stratosphere',
    explanation: 'Roughly 90% of atmospheric ozone resides in the lower stratosphere between 15 and 35 km altitude.'
  },
  {
    id: 'sci-11',
    quizType: 'science',
    category: 'Space Science',
    difficulty: 'Medium',
    question: 'Which planet in our Solar System has the highest surface temperature due to a runaway greenhouse effect?',
    options: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
    correctAnswer: 'Venus',
    explanation: 'Venus has a dense 96.5% CO₂ atmosphere that traps infrared radiation, raising its surface temperature to ~465 °C.'
  },
  {
    id: 'sci-12',
    quizType: 'science',
    category: 'General Science',
    difficulty: 'Easy',
    question: 'Why does light bend (refract) when passing obliquely from air into glass?',
    options: [
      'Its frequency changes at the boundary',
      'Its phase velocity decreases in the optically denser medium',
      'Glass emits secondary photons of higher mass',
      'Gravity inside the glass pulls the light beam downward'
    ],
    correctAnswer: 'Its phase velocity decreases in the optically denser medium',
    explanation: 'Refraction occurs because light slows down in a medium with higher refractive index (v = c/n), bending according to Snell’s Law.'
  },

  // MATHEMATICS QUIZ
  {
    id: 'math-1',
    quizType: 'math',
    category: 'Algebra',
    difficulty: 'Easy',
    inputType: 'mcq',
    question: 'If a + b = 7 and ab = 12, what is the value of a² + b²?',
    options: ['25', '37', '49', '61'],
    correctAnswer: '25',
    explanation: 'Using the identity a² + b² = (a + b)² - 2ab, we compute 7² - 2(12) = 49 - 24 = 25.',
    steps: [
      'Identity: a² + b² = (a + b)² - 2ab',
      'Substitute a + b = 7 and ab = 12',
      'a² + b² = 49 - 24 = 25'
    ]
  },
  {
    id: 'math-2',
    quizType: 'math',
    category: 'Equations',
    difficulty: 'Medium',
    inputType: 'numerical',
    question: 'Solve for x (enter the positive numerical value): 2x² - 8 = 24',
    correctAnswer: '4',
    explanation: 'Add 8 to both sides to get 2x² = 32, divide by 2 to get x² = 16, and take the positive root x = 4.',
    steps: [
      '2x² - 8 = 24 → 2x² = 32',
      'Divide by 2: x² = 16',
      'Positive square root: x = 4'
    ]
  },
  {
    id: 'math-3',
    quizType: 'math',
    category: 'Geometry',
    difficulty: 'Easy',
    inputType: 'mcq',
    question: 'In a right-angled triangle, the two perpendicular sides measure 5 cm and 12 cm. What is the length of the hypotenuse?',
    options: ['13 cm', '15 cm', '17 cm', '14 cm'],
    correctAnswer: '13 cm',
    explanation: 'By the Pythagorean theorem, c = √(5² + 12²) = √(25 + 144) = √169 = 13 cm.',
    steps: ['c² = a² + b² = 25 + 144 = 169', 'c = √169 = 13 cm']
  },
  {
    id: 'math-4',
    quizType: 'math',
    category: 'Mensuration',
    difficulty: 'Medium',
    inputType: 'mcq',
    question: 'What is the total surface area of a solid cylinder of radius r = 7 cm and height h = 10 cm? (Use π = 22/7)',
    options: ['748 cm²', '440 cm²', '1540 cm²', '616 cm²'],
    correctAnswer: '748 cm²',
    explanation: 'Total surface area A = 2πr(r + h) = 2 × (22/7) × 7 × (7 + 10) = 44 × 17 = 748 cm².',
    steps: ['A = 2πr(r + h)', 'A = 2 × (22/7) × 7 × 17 = 44 × 17 = 748 cm²']
  },
  {
    id: 'math-5',
    quizType: 'math',
    category: 'Trigonometry',
    difficulty: 'Medium',
    inputType: 'mcq',
    question: 'If sin(θ) = 3/5 and θ is acute, what is the value of cos(θ) + tan(θ)?',
    options: ['31/20', '7/5', '27/20', '12/15'],
    correctAnswer: '31/20',
    explanation: 'Adjacent = √(5² - 3²) = 4, so cos(θ) = 4/5 and tan(θ) = 3/4. Sum = 4/5 + 3/4 = 31/20.',
    steps: ['adj = √(25 - 9) = 4', 'cos(θ) = 4/5, tan(θ) = 3/4', '4/5 + 3/4 = 31/20']
  },
  {
    id: 'math-6',
    quizType: 'math',
    category: 'Probability',
    difficulty: 'Medium',
    inputType: 'mcq',
    question: 'Two fair six-sided dice are rolled simultaneously. What is the probability that the sum is 9?',
    options: ['1/9', '1/6', '1/12', '5/36'],
    correctAnswer: '1/9',
    explanation: 'Out of 36 outcomes, pairs summing to 9 are (3,6), (4,5), (5,4), (6,3) — 4 outcomes. 4/36 = 1/9.',
    steps: ['Total outcomes = 36', 'Favorable = {(3,6), (4,5), (5,4), (6,3)} = 4', 'P = 4/36 = 1/9']
  },
  {
    id: 'math-7',
    quizType: 'math',
    category: 'Statistics',
    difficulty: 'Easy',
    inputType: 'numerical',
    question: 'Find the median of the data set: 14, 7, 22, 11, 19, 9, 16',
    correctAnswer: '14',
    explanation: 'Sorted in ascending order: 7, 9, 11, 14, 16, 19, 22. The 4th (middle) value is 14.',
    steps: ['Sort: 7, 9, 11, 14, 16, 19, 22', 'Middle term (4th of 7) = 14']
  },
  {
    id: 'math-8',
    quizType: 'math',
    category: 'Number Systems',
    difficulty: 'Hard',
    inputType: 'mcq',
    question: 'Which of the following numbers is an irrational number?',
    options: ['√49', '0.3333...', '√18', '22/7'],
    correctAnswer: '√18',
    explanation: '√18 = 3√2 cannot be written as a ratio of integers p/q.',
    steps: ['√49 = 7 (rational)', '0.333... = 1/3 (rational)', '√18 = 3√2 (irrational)']
  },

  // IQ / REASONING QUIZ
  {
    id: 'iq-1',
    quizType: 'iq',
    category: 'Number Patterns',
    difficulty: 'Easy',
    question: 'Find the next number in the sequence: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '38'],
    correctAnswer: '42',
    explanation: 'Differences increase by 2 each step: +4, +6, +8, +10, +12 → 30 + 12 = 42.'
  },
  {
    id: 'iq-2',
    quizType: 'iq',
    category: 'Logical Reasoning',
    difficulty: 'Medium',
    question: 'All Ortians Honor Scholars study Physics. Some students who study Physics also compete in Robotics. Which statement MUST be true?',
    options: [
      'All Robotics competitors are Ortians Honor Scholars',
      'If a student does not study Physics, they are not an Ortians Honor Scholar',
      'All Ortians Honor Scholars compete in Robotics',
      'No Robotics competitor is an Ortians Honor Scholar'
    ],
    correctAnswer: 'If a student does not study Physics, they are not an Ortians Honor Scholar',
    explanation: 'By contrapositive logic (P → Q is equivalent to ¬Q → ¬P): anyone not studying Physics cannot be an Honor Scholar.'
  },
  {
    id: 'iq-3',
    quizType: 'iq',
    category: 'Analogies',
    difficulty: 'Easy',
    question: 'PHOTON is to LIGHT as PHONON is to:',
    options: ['Electricity', 'Lattice Vibration / Sound', 'Magnetism', 'Gravity'],
    correctAnswer: 'Lattice Vibration / Sound',
    explanation: 'A photon is a quantum of electromagnetic light, whereas a phonon is a quantum of vibrational mechanical energy in a crystal lattice.'
  },
  {
    id: 'iq-4',
    quizType: 'iq',
    category: 'Odd One Out',
    difficulty: 'Medium',
    question: 'Which item does NOT belong in the following group?',
    options: ['Neon', 'Argon', 'Krypton', 'Nitrogen'],
    correctAnswer: 'Nitrogen',
    explanation: 'Neon, Argon, and Krypton are Group 18 Noble Gases, whereas Nitrogen is a Group 15 reactive diatomic gas.'
  },
  {
    id: 'iq-5',
    quizType: 'iq',
    category: 'Sequence',
    difficulty: 'Hard',
    question: 'Complete the alphanumeric pattern: B2, E5, I9, N14, ?',
    options: ['S19', 'T20', 'U21', 'R18'],
    correctAnswer: 'T20',
    explanation: 'Alphabetical positions step by +3, +4, +5, +6: 14 + 6 = 20, and the 20th letter is T (T20).'
  },
  {
    id: 'iq-6',
    quizType: 'iq',
    category: 'Spatial Reasoning',
    difficulty: 'Hard',
    question: 'A solid 3 × 3 × 3 cube is painted crimson on all six outer faces and cut into 27 unit cubes. How many unit cubes have paint on EXACTLY two faces?',
    options: ['8', '12', '6', '1'],
    correctAnswer: '12',
    explanation: 'A cube has 12 edges, and the middle unit cube along each of the 12 edges has paint on exactly 2 faces.'
  },

  // ENGLISH GRAMMAR QUIZ
  {
    id: 'eng-1',
    quizType: 'english',
    category: 'Subject-Verb Agreement',
    difficulty: 'Easy',
    question: 'Neither the class teacher nor the students ______ present at the old auditorium yesterday.',
    options: ['was', 'were', 'is', 'has been'],
    correctAnswer: 'were',
    explanation: 'With "Neither... nor", the verb agrees with the closer subject ("students", plural), taking "were".'
  },
  {
    id: 'eng-2',
    quizType: 'english',
    category: 'Tenses',
    difficulty: 'Medium',
    question: 'By the time the science fair judges arrived, the Class 9 team ______ their circuit prototype.',
    options: ['calibrated', 'have calibrated', 'had calibrated', 'will calibrate'],
    correctAnswer: 'had calibrated',
    explanation: 'The Past Perfect ("had calibrated") denotes an action completed before another past action ("arrived").'
  },
  {
    id: 'eng-3',
    quizType: 'english',
    category: 'Articles & Prepositions',
    difficulty: 'Easy',
    question: 'Dr. Rahman is ______ honorable professor who specializes ______ quantum optics.',
    options: ['a / on', 'an / in', 'the / at', 'an / for'],
    correctAnswer: 'an / in',
    explanation: '"Honorable" starts with a silent "h" (vowel sound), taking "an", and "specialize" takes "in".'
  },
  {
    id: 'eng-4',
    quizType: 'english',
    category: 'Voice',
    difficulty: 'Medium',
    question: 'Choose the correct passive form of: "Who taught you vector calculus?"',
    options: [
      'By whom were you taught vector calculus?',
      'Who was taught vector calculus by you?',
      'By whom you were taught vector calculus?',
      'Whom were you taught vector calculus?'
    ],
    correctAnswer: 'By whom were you taught vector calculus?',
    explanation: 'Interrogative "Who" in active voice becomes "By whom + auxiliary (were) + subject (you) + past participle (taught)...?"'
  },
  {
    id: 'eng-5',
    quizType: 'english',
    category: 'Narration',
    difficulty: 'Hard',
    question: 'Convert to indirect speech: The teacher said to the students, "Light travels in a straight line."',
    options: [
      'The teacher told the students that light traveled in a straight line.',
      'The teacher told the students that light travels in a straight line.',
      'The teacher asked the students if light travels in a straight line.',
      'The teacher said that light had traveled in a straight line.'
    ],
    correctAnswer: 'The teacher told the students that light travels in a straight line.',
    explanation: 'Universal scientific truths remain in the Present Simple tense ("travels") in indirect speech.'
  },
  {
    id: 'eng-6',
    quizType: 'english',
    category: 'Vocabulary & Antonyms',
    difficulty: 'Medium',
    question: 'Select the most accurate ANTONYM for the word "EPHEMERAL":',
    options: ['Transient', 'Enduring', 'Fragile', 'Luminous'],
    correctAnswer: 'Enduring',
    explanation: '"Ephemeral" means short-lived or fleeting; its antonym is "enduring" or "permanent".'
  }
];

export interface ReactantIonItem {
  id: string;
  symbol: string;
  name: string;
  charge: string;
  chargeNum: number;
  type: 'cation' | 'anion';
  description: string;
}

export const REACTIMIX_IONS: ReactantIonItem[] = [
  { id: 'H+', symbol: 'H⁺', name: 'Hydrogen Ion (Proton)', charge: '+1', chargeNum: 1, type: 'cation', description: 'Monovalent acid cation responsible for acidity (pH).' },
  { id: 'Na+', symbol: 'Na⁺', name: 'Sodium Ion', charge: '+1', chargeNum: 1, type: 'cation', description: 'Group 1 alkali metal cation with stable [Ne] octet configuration.' },
  { id: 'K+', symbol: 'K⁺', name: 'Potassium Ion', charge: '+1', chargeNum: 1, type: 'cation', description: 'Group 1 alkali metal cation essential for cellular membrane potential.' },
  { id: 'Ca2+', symbol: 'Ca²⁺', name: 'Calcium Ion', charge: '+2', chargeNum: 2, type: 'cation', description: 'Group 2 alkaline earth divalent cation found in limestone and bone.' },
  { id: 'Mg2+', symbol: 'Mg²⁺', name: 'Magnesium Ion', charge: '+2', chargeNum: 2, type: 'cation', description: 'Group 2 divalent cation at the core of chlorophyll molecules.' },
  { id: 'NH4+', symbol: 'NH₄⁺', name: 'Ammonium Ion', charge: '+1', chargeNum: 1, type: 'cation', description: 'Polyatomic tetrahedral cation formed by protonation of ammonia.' },
  { id: 'Fe3+', symbol: 'Fe³⁺', name: 'Iron(III) / Ferric Ion', charge: '+3', chargeNum: 3, type: 'cation', description: 'Trivalent transition metal cation found in hematite (Fe₂O₃).' },
  { id: 'Cu2+', symbol: 'Cu²⁺', name: 'Copper(II) / Cupric Ion', charge: '+2', chargeNum: 2, type: 'cation', description: 'Divalent transition metal cation forming vivid blue aqueous salts.' },
  { id: 'Cl-', symbol: 'Cl⁻', name: 'Chloride Ion', charge: '-1', chargeNum: -1, type: 'anion', description: 'Group 17 halide anion with a complete valence octet.' },
  { id: 'OH-', symbol: 'OH⁻', name: 'Hydroxide Ion', charge: '-1', chargeNum: -1, type: 'anion', description: 'Diatomic monovalent base anion characteristic of alkaline solutions.' },
  { id: 'NO3-', symbol: 'NO₃⁻', name: 'Nitrate Ion', charge: '-1', chargeNum: -1, type: 'anion', description: 'Resonance-stabilized trigonal planar polyatomic anion.' },
  { id: 'SO42-', symbol: 'SO₄²⁻', name: 'Sulfate Ion', charge: '-2', chargeNum: -2, type: 'anion', description: 'Tetrahedral divalent polyatomic oxoanion of sulfur(VI).' },
  { id: 'CO32-', symbol: 'CO₃²⁻', name: 'Carbonate Ion', charge: '-2', chargeNum: -2, type: 'anion', description: 'Trigonal planar divalent anion of carbonic acid and limestone.' },
  { id: 'HCO3-', symbol: 'HCO₃⁻', name: 'Bicarbonate (Hydrogen Carbonate) Ion', charge: '-1', chargeNum: -1, type: 'anion', description: 'Amphoteric monovalent buffer anion in blood and baking soda.' },
  { id: 'PO43-', symbol: 'PO₄³⁻', name: 'Phosphate Ion', charge: '-3', chargeNum: -3, type: 'anion', description: 'Trivalent tetrahedral oxoanion essential in bone mineral and ATP.' },
  { id: 'O2-', symbol: 'O²⁻', name: 'Oxide Ion', charge: '-2', chargeNum: -2, type: 'anion', description: 'Divalent oxide anion forming metallic and non-metallic oxides.' }
];

// Keep legacy alias for compatibility
export const REACTIMIX_REACTANTS = REACTIMIX_IONS.map((ion) => ({
  id: ion.id,
  symbol: ion.symbol,
  name: ion.name,
  kind: 'ion' as const,
  charge: ion.charge
}));

export interface VerifiedCompound {
  key: string;
  acceptedKeys: string[]; // Sorted '+' joined combinations of element symbols OR ion IDs that produce this compound
  formula: string;
  name: string;
  molarMass: string;
  compoundType: string;
  bondType: string;
  chargeBalance: string;
  properties: string[];
  uses: string;
  equation: string;
}

export const VERIFIED_COMPOUNDS: VerifiedCompound[] = [
  {
    key: 'H+O',
    acceptedKeys: ['H+O', 'H++O2-', 'H++OH-', 'H+OH-'],
    formula: 'H₂O',
    name: 'Water (Dihydrogen Monoxide)',
    molarMass: '18.015 g/mol',
    compoundType: 'Neutral Polar Covalent Oxide Solvent',
    bondType: 'Polar Covalent (sp³ bent geometry at 104.5° with intermolecular hydrogen bonding)',
    chargeBalance: '2 H (oxidation state +1) + 1 O (oxidation state -2) → (+2) + (-2) = 0 neutral molecule (H₂O)',
    properties: ['Boiling Point: 100 °C (373.15 K)', 'Melting Point: 0 °C (273.15 K)', 'Density: 1.00 g/cm³', 'Universal polar solvent'],
    uses: 'Biological solvent for cellular life, acid-base chemistry, industrial cooling, hydroelectricity.',
    equation: '2H₂ + O₂ → 2H₂O   |   H⁺ + OH⁻ → H₂O'
  },
  {
    key: 'C+O',
    acceptedKeys: ['C+O', 'C+O2-'],
    formula: 'CO₂',
    name: 'Carbon Dioxide',
    molarMass: '44.010 g/mol',
    compoundType: 'Acidic Non-Metal Covalent Oxide',
    bondType: 'Double Polar Covalent (Linear O=C=O, 180° sp hybridized)',
    chargeBalance: '1 C (oxidation state +4) + 2 O (oxidation state -2) → (+4) + 2(-2) = 0 neutral molecule (CO₂)',
    properties: ['Sublimes at -78.5 °C (Dry Ice)', 'Gas density: 1.98 g/L (denser than air)', 'Forms carbonic acid in water; turns limewater milky'],
    uses: 'Photosynthesis carbon source, fire extinguishers, beverage carbonation, supercritical decaffeination.',
    equation: 'C + O₂ → CO₂'
  },
  {
    key: 'Cl+Na',
    acceptedKeys: ['Cl+Na', 'Cl-+Na+', 'Cl-+Na', 'Cl+Na+'],
    formula: 'NaCl',
    name: 'Sodium Chloride (Halite / Table Salt)',
    molarMass: '58.443 g/mol',
    compoundType: 'Neutral Ionic Halide Salt',
    bondType: 'Ionic Crystal Lattice (Face-Centered Cubic 6:6 coordination)',
    chargeBalance: 'Na⁺ (+1) + Cl⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 stoichiometric ratio (NaCl)',
    properties: ['Melting Point: 801 °C', 'Boiling Point: 1465 °C', 'Water soluble (360 g/L at 25 °C)', 'Conducts electricity when molten or aqueous'],
    uses: 'Dietary electrolyte, medical 0.9% normal saline IV, chlor-alkali industrial production of NaOH and Cl₂.',
    equation: 'Na⁺ + Cl⁻ → NaCl   |   2Na + Cl₂ → 2NaCl'
  },
  {
    key: 'Cl+H',
    acceptedKeys: ['Cl+H', 'Cl-+H+', 'Cl-+H', 'Cl+H+'],
    formula: 'HCl',
    name: 'Hydrochloric Acid (Hydrogen Chloride)',
    molarMass: '36.461 g/mol',
    compoundType: 'Strong Monoprotic Mineral Acid',
    bondType: 'Polar Covalent gas that ionizes 100% in water into H₃O⁺ and Cl⁻',
    chargeBalance: 'H⁺ (+1) + Cl⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (HCl)',
    properties: ['pKa = -6.3 (strong acid)', 'Boiling Point (gas): -85.05 °C', 'Reacts with active metals to liberate H₂ gas'],
    uses: 'Human gastric acid digestion, steel pickling, PVC plastic production, laboratory acid-base titration.',
    equation: 'H⁺ + Cl⁻ → HCl   |   H₂ + Cl₂ → 2HCl'
  },
  {
    key: 'Na+OH',
    acceptedKeys: ['H+Na+O', 'Na++OH-', 'Na+OH-'],
    formula: 'NaOH',
    name: 'Sodium Hydroxide (Caustic Soda)',
    molarMass: '39.997 g/mol',
    compoundType: 'Strong Monobasic Alkali / Base',
    bondType: 'Ionic attraction between Na⁺ cation and covalent OH⁻ hydroxide ion',
    chargeBalance: 'Na⁺ (+1) + OH⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (NaOH)',
    properties: ['Melting Point: 323 °C', 'Deliquescent white pellets', 'Highly exothermic dissolution in water', 'Turns red litmus blue'],
    uses: 'Soap & detergent saponification, paper pulping, bauxite aluminum refining, titration standard.',
    equation: 'Na⁺ + OH⁻ → NaOH   |   2Na + 2H₂O → 2NaOH + H₂↑'
  },
  {
    key: 'H+N',
    acceptedKeys: ['H+N'],
    formula: 'NH₃',
    name: 'Ammonia (Azane)',
    molarMass: '17.031 g/mol',
    compoundType: 'Weak Brønsted-Lowry Base & Covalent Hydride',
    bondType: 'Polar Covalent (sp³ Trigonal Pyramidal, 107.8° bond angle with lone pair)',
    chargeBalance: '1 N (oxidation state -3) + 3 H (oxidation state +1) → (-3) + 3(+1) = 0 neutral molecule (NH₃)',
    properties: ['Boiling Point: -33.34 °C', 'Pungent colorless gas', 'Highly soluble in water via hydrogen bonding'],
    uses: 'Nitrogen fertilizers (Haber-Bosch process), nitric acid synthesis, industrial refrigeration.',
    equation: 'N₂ + 3H₂ ⇌ 2NH₃'
  },
  {
    key: 'C+H',
    acceptedKeys: ['C+H'],
    formula: 'CH₄',
    name: 'Methane',
    molarMass: '16.043 g/mol',
    compoundType: 'Saturated Hydrocarbon (Simplest Alkane)',
    bondType: 'Nonpolar Covalent (sp³ Tetrahedral geometry, 109.5° bond angles)',
    chargeBalance: '1 C (oxidation state -4) + 4 H (oxidation state +1) → (-4) + 4(+1) = 0 neutral molecule (CH₄)',
    properties: ['Boiling Point: -161.5 °C', 'Odorless gas lighter than air', 'Clean exothermic combustion (ΔH = -890 kJ/mol)'],
    uses: 'Primary constituent of natural gas fuel, power generation, hydrogen steam reforming feedstock.',
    equation: 'C + 2H₂ → CH₄'
  },
  {
    key: 'C+Ca+O',
    acceptedKeys: ['C+Ca+O', 'CO32-+Ca2+', 'CO32-+Ca', 'C+Ca2++O'],
    formula: 'CaCO₃',
    name: 'Calcium Carbonate (Limestone / Marble / Calcite)',
    molarMass: '100.087 g/mol',
    compoundType: 'Insoluble Basic Carbonate Salt',
    bondType: 'Ionic (Ca²⁺ cation) with resonance-stabilized covalent CO₃²⁻ anion',
    chargeBalance: 'Ca²⁺ (+2) + CO₃²⁻ (-2) → (+2) + (-2) = 0 net charge → 1:1 ratio (CaCO₃)',
    properties: ['Thermal decomposition at 825 °C into CaO + CO₂', 'Insoluble in pure water', 'Effervesces briskly with dilute acids'],
    uses: 'Portland cement & quicklime production, antacid tablets, marble architecture, soil acidity neutralization.',
    equation: 'Ca²⁺ + CO₃²⁻ → CaCO₃(s)'
  },
  {
    key: 'H+O+S',
    acceptedKeys: ['H+O+S', 'H++SO42-', 'H+SO42-'],
    formula: 'H₂SO₄',
    name: 'Sulfuric Acid (Oil of Vitriol)',
    molarMass: '98.079 g/mol',
    compoundType: 'Strong Diprotic Mineral Acid',
    bondType: 'Covalent tetrahedral sulfate core with two ionizable protons',
    chargeBalance: '2 H⁺ (2 × +1 = +2) + SO₄²⁻ (-2) → (+2) + (-2) = 0 net charge → 2:1 ratio (H₂SO₄)',
    properties: ['Density: 1.84 g/cm³', 'Boiling Point: 337 °C', 'Powerful dehydrating, sulfonating, and oxidizing agent'],
    uses: 'Phosphate fertilizers, lead-acid automotive batteries, chemical manufacturing, ore processing.',
    equation: '2H⁺ + SO₄²⁻ → H₂SO₄   |   SO₃ + H₂O → H₂SO₄'
  },
  {
    key: 'H+N+O',
    acceptedKeys: ['H+N+O', 'H++NO3-', 'H+NO3-'],
    formula: 'HNO₃',
    name: 'Nitric Acid (Aqua Fortis)',
    molarMass: '63.012 g/mol',
    compoundType: 'Strong Monoprotic Oxidizing Mineral Acid',
    bondType: 'Polar Covalent / Planar resonance-stabilized nitrate group',
    chargeBalance: 'H⁺ (+1) + NO₃⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (HNO₃)',
    properties: ['Boiling Point: 83 °C', 'Powerful oxidizing acid', 'Xanthoproteic reaction turns proteins yellow'],
    uses: 'Ammonium nitrate fertilizers (Ostwald process), metal etching, passivation of stainless steel.',
    equation: 'H⁺ + NO₃⁻ → HNO₃'
  },
  {
    key: 'C+Na+O',
    acceptedKeys: ['C+Na+O', 'CO32-+Na+', 'CO32-+Na'],
    formula: 'Na₂CO₃',
    name: 'Sodium Carbonate (Soda Ash / Washing Soda)',
    molarMass: '105.988 g/mol',
    compoundType: 'Alkaline Inorganic Carbonate Salt',
    bondType: 'Ionic (two Na⁺ cations balanced by one divalent CO₃²⁻ anion)',
    chargeBalance: '2 Na⁺ (2 × +1 = +2) + CO₃²⁻ (-2) → (+2) + (-2) = 0 net charge → 2:1 ratio (Na₂CO₃)',
    properties: ['Melting Point: 851 °C', 'Aqueous solution is alkaline (pH ~11)', 'Precipitates Ca²⁺ and Mg²⁺ to soften hard water'],
    uses: 'Soda-lime glass manufacturing, water softening, primary acid-base titration standard (Solvay process).',
    equation: '2Na⁺ + CO₃²⁻ → Na₂CO₃'
  },
  {
    key: 'C+H+Na+O',
    acceptedKeys: ['C+H+Na+O', 'HCO3-+Na+', 'HCO3-+Na', 'CO32-+H++Na+'],
    formula: 'NaHCO₃',
    name: 'Sodium Bicarbonate (Baking Soda / Sodium Hydrogen Carbonate)',
    molarMass: '84.007 g/mol',
    compoundType: 'Amphoteric Acid Salt / Chemical Leavening Agent',
    bondType: 'Ionic (Na⁺ cation) with hydrogen-bonded polymeric HCO₃⁻ anions',
    chargeBalance: 'Na⁺ (+1) + HCO₃⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (NaHCO₃)',
    properties: ['Decomposes above 80 °C into Na₂CO₃ + H₂O + CO₂↑', 'Mildly alkaline buffer (pH ~8.3)'],
    uses: 'Baking leavening agent, dry-chemical fire extinguishers, medical antacid, blood pH buffer.',
    equation: 'Na⁺ + HCO₃⁻ → NaHCO₃'
  },
  {
    key: 'Ca+H+O',
    acceptedKeys: ['Ca+H+O', 'Ca2++OH-', 'Ca+OH-'],
    formula: 'Ca(OH)₂',
    name: 'Calcium Hydroxide (Slaked Lime / Limewater)',
    molarMass: '74.093 g/mol',
    compoundType: 'Strong Divalent Inorganic Base',
    bondType: 'Ionic (1 Ca²⁺ cation balanced by 2 OH⁻ hydroxide ions)',
    chargeBalance: 'Ca²⁺ (+2) + 2 OH⁻ (2 × -1 = -2) → (+2) + (-2) = 0 net charge → 1:2 ratio Ca(OH)₂',
    properties: ['Sparingly soluble in water (1.7 g/L)', 'Clear aqueous solution (limewater) turns milky with CO₂'],
    uses: 'Diagnostic test for CO₂ gas, mortar & plaster, flue-gas desulfurization, soil liming.',
    equation: 'Ca²⁺ + 2OH⁻ → Ca(OH)₂   |   CaO + H₂O → Ca(OH)₂'
  },
  {
    key: 'Mg+O',
    acceptedKeys: ['Mg+O', 'Mg2++O2-', 'Mg+O2-', 'Mg2++O'],
    formula: 'MgO',
    name: 'Magnesium Oxide (Magnesia)',
    molarMass: '40.304 g/mol',
    compoundType: 'Refractory Basic Metal Oxide',
    bondType: 'High-Lattice-Energy Ionic Crystal (Halite rock-salt structure)',
    chargeBalance: 'Mg²⁺ (+2) + O²⁻ (-2) → (+2) + (-2) = 0 net charge → 1:1 ratio (MgO)',
    properties: ['Extremely high melting point: 2852 °C', 'White hygroscopic powder', 'High thermal conductivity & electrical insulation'],
    uses: 'Refractory furnace linings, fireproofing boards, medical antacid & magnesium supplement, heating elements.',
    equation: '2Mg + O₂ → 2MgO   |   Mg²⁺ + O²⁻ → MgO'
  },
  {
    key: 'Fe+O',
    acceptedKeys: ['Fe+O', 'Fe3++O2-', 'Fe+O2-', 'Fe3++O'],
    formula: 'Fe₂O₃',
    name: 'Iron(III) Oxide (Ferric Oxide / Hematite)',
    molarMass: '159.687 g/mol',
    compoundType: 'Amphoteric Transition Metal Oxide',
    bondType: 'Ionic / Covalent corundum crystal lattice',
    chargeBalance: '2 Fe³⁺ (2 × +3 = +6) + 3 O²⁻ (3 × -2 = -6) → (+6) + (-6) = 0 net charge → 2:3 ratio (Fe₂O₃)',
    properties: ['Melting Point: 1565 °C', 'Reddish-brown paramagnetic mineral', 'Reduced by carbon monoxide in blast furnaces'],
    uses: 'Primary iron ore for steelmaking, thermite aluminothermic welding, red iron oxide pigments, jeweler’s rouge.',
    equation: '4Fe + 3O₂ → 2Fe₂O₃   |   2Fe³⁺ + 3O²⁻ → Fe₂O₃'
  },
  {
    key: 'Cu+O+S',
    acceptedKeys: ['Cu+O+S', 'Cu2++SO42-', 'Cu+SO42-'],
    formula: 'CuSO₄',
    name: 'Copper(II) Sulfate (Blue Vitriol)',
    molarMass: '159.609 g/mol (Anhydrous) / 249.685 g/mol (Pentahydrate)',
    compoundType: 'Transition Metal Sulfate Salt',
    bondType: 'Ionic (Cu²⁺ and SO₄²⁻) with coordinate covalent hydration in CuSO₄·5H₂O',
    chargeBalance: 'Cu²⁺ (+2) + SO₄²⁻ (-2) → (+2) + (-2) = 0 net charge → 1:1 ratio (CuSO₄)',
    properties: ['Anhydrous form is white; turns bright azure blue upon contact with water', 'Electrolyte in Daniell galvanic cells'],
    uses: 'Electroplating & galvanic cells, test for presence of water, Bordeaux agricultural fungicide, Benedict/Fehling reagent.',
    equation: 'Cu²⁺ + SO₄²⁻ → CuSO₄'
  },
  {
    key: 'Ca+Cl',
    acceptedKeys: ['Ca+Cl', 'Ca2++Cl-', 'Ca2++Cl', 'Ca+Cl-'],
    formula: 'CaCl₂',
    name: 'Calcium Chloride',
    molarMass: '110.984 g/mol',
    compoundType: 'Hygroscopic Divalent Ionic Halide Salt',
    bondType: 'Ionic (1 Ca²⁺ cation balanced by 2 Cl⁻ anions)',
    chargeBalance: 'Ca²⁺ (+2) + 2 Cl⁻ (2 × -1 = -2) → (+2) + (-2) = 0 net charge → 1:2 ratio (CaCl₂)',
    properties: ['Melting Point: 772 °C', 'Strongly deliquescent desiccant', 'Highly exothermic dissolution in water'],
    uses: 'Laboratory drying tubes & desiccators, highway de-icing, concrete setting accelerator.',
    equation: 'Ca²⁺ + 2Cl⁻ → CaCl₂'
  },
  {
    key: 'Mg+O+S',
    acceptedKeys: ['Mg+O+S', 'Mg2++SO42-', 'Mg+SO42-'],
    formula: 'MgSO₄',
    name: 'Magnesium Sulfate (Epsom Salt)',
    molarMass: '120.366 g/mol',
    compoundType: 'Inorganic Ionic Sulfate Salt',
    bondType: 'Ionic (Mg²⁺ and SO₄²⁻)',
    chargeBalance: 'Mg²⁺ (+2) + SO₄²⁻ (-2) → (+2) + (-2) = 0 net charge → 1:1 ratio (MgSO₄)',
    properties: ['Highly soluble in water', 'Anhydrous MgSO₄ is a standard organic laboratory drying agent'],
    uses: 'Organic solvent drying agent, medical magnesium therapy, agricultural soil nutrient.',
    equation: 'Mg²⁺ + SO₄²⁻ → MgSO₄'
  },
  {
    key: 'Cl+H+N',
    acceptedKeys: ['Cl+H+N', 'Cl-+NH4+', 'Cl+NH4+'],
    formula: 'NH₄Cl',
    name: 'Ammonium Chloride (Sal Ammoniac)',
    molarMass: '53.491 g/mol',
    compoundType: 'Acidic Polyatomic Ionic Salt',
    bondType: 'Ionic attraction between NH₄⁺ and Cl⁻ with internal covalent N–H bonds',
    chargeBalance: 'NH₄⁺ (+1) + Cl⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (NH₄Cl)',
    properties: ['Sublimes/dissociates reversibly into NH₃ + HCl at 338 °C', 'Endothermic dissolution in water'],
    uses: 'Leclanché dry-cell battery electrolyte, metal tinning & soldering flux, biological buffer.',
    equation: 'NH₄⁺ + Cl⁻ → NH₄Cl   |   NH₃ + HCl → NH₄Cl'
  },
  {
    key: 'Cl+K',
    acceptedKeys: ['Cl+K', 'Cl-+K+', 'Cl-+K', 'Cl+K+'],
    formula: 'KCl',
    name: 'Potassium Chloride (Sylvite)',
    molarMass: '74.551 g/mol',
    compoundType: 'Neutral Alkali Halide Salt',
    bondType: 'Ionic Crystal Lattice (Face-Centered Cubic)',
    chargeBalance: 'K⁺ (+1) + Cl⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (KCl)',
    properties: ['Melting Point: 770 °C', 'Exhibits lilac flame test color', 'Readily soluble in water'],
    uses: 'Potash agricultural fertilizer, medical electrolyte replenishment, FTIR optical windows.',
    equation: 'K⁺ + Cl⁻ → KCl   |   2K + Cl₂ → 2KCl'
  },
  {
    key: 'H+K+O',
    acceptedKeys: ['H+K+O', 'K++OH-', 'K+OH-'],
    formula: 'KOH',
    name: 'Potassium Hydroxide (Caustic Potash)',
    molarMass: '56.106 g/mol',
    compoundType: 'Strong Alkali Base',
    bondType: 'Ionic (K⁺ and OH⁻)',
    chargeBalance: 'K⁺ (+1) + OH⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (KOH)',
    properties: ['Melting Point: 360 °C', 'Highly deliquescent & exothermic in water', 'Strong electrolyte'],
    uses: 'Alkaline battery electrolyte, liquid soap saponification, biodiesel transesterification.',
    equation: 'K⁺ + OH⁻ → KOH'
  },
  {
    key: 'K+N+O',
    acceptedKeys: ['K+N+O', 'K++NO3-', 'K+NO3-'],
    formula: 'KNO₃',
    name: 'Potassium Nitrate (Saltpeter)',
    molarMass: '101.103 g/mol',
    compoundType: 'Oxidizing Nitrate Salt',
    bondType: 'Ionic (K⁺ cation and planar NO₃⁻ anion)',
    chargeBalance: 'K⁺ (+1) + NO₃⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (KNO₃)',
    properties: ['Melting Point: 334 °C', 'Solubility increases sharply with temperature', 'Strong oxidizer'],
    uses: 'High-grade NPK fertilizers, solar thermal molten salt heat storage, desensitizing toothpaste.',
    equation: 'K⁺ + NO₃⁻ → KNO₃'
  },
  {
    key: 'Ca+O+P',
    acceptedKeys: ['Ca+O+P', 'Ca2++PO43-', 'Ca+PO43-'],
    formula: 'Ca₃(PO₄)₂',
    name: 'Tricalcium Phosphate',
    molarMass: '310.177 g/mol',
    compoundType: 'Biomineral Phosphate Salt',
    bondType: 'Ionic (3 Ca²⁺ cations to 2 covalent PO₄³⁻ anions)',
    chargeBalance: '3 Ca²⁺ (3 × +2 = +6) + 2 PO₄³⁻ (2 × -3 = -6) → (+6) + (-6) = 0 net charge → 3:2 ratio Ca₃(PO₄)₂',
    properties: ['Melting Point: 1670 °C', 'Practically insoluble in neutral water, soluble in acids'],
    uses: 'Primary mineral matrix of vertebrate bones and tooth enamel, phosphate fertilizers, bone grafts.',
    equation: '3Ca²⁺ + 2PO₄³⁻ → Ca₃(PO₄)₂'
  },
  {
    key: 'Na+O+P',
    acceptedKeys: ['Na+O+P', 'Na++PO43-', 'Na+PO43-'],
    formula: 'Na₃PO₄',
    name: 'Trisodium Phosphate (TSP)',
    molarMass: '163.941 g/mol',
    compoundType: 'Alkaline Phosphate Salt',
    bondType: 'Ionic (3 Na⁺ cations balanced by 1 PO₄³⁻ anion)',
    chargeBalance: '3 Na⁺ (3 × +1 = +3) + PO₄³⁻ (-3) → (+3) + (-3) = 0 net charge → 3:1 ratio (Na₃PO₄)',
    properties: ['Melting Point: 1583 °C', 'Forms strongly alkaline aqueous solutions (pH ~12)'],
    uses: 'Heavy-duty degreaser, boiler water treatment, food acidity regulator.',
    equation: '3Na⁺ + PO₄³⁻ → Na₃PO₄'
  },
  {
    key: 'H+O+P',
    acceptedKeys: ['H+O+P', 'H++PO43-', 'H+PO43-'],
    formula: 'H₃PO₄',
    name: 'Phosphoric Acid (Orthophosphoric Acid)',
    molarMass: '97.995 g/mol',
    compoundType: 'Triprotic Mineral Acid',
    bondType: 'Polar Covalent tetrahedral molecule with three ionizable –OH groups',
    chargeBalance: '3 H⁺ (3 × +1 = +3) + PO₄³⁻ (-3) → (+3) + (-3) = 0 net charge → 3:1 ratio (H₃PO₄)',
    properties: ['Melting Point: 42.35 °C', 'Non-volatile syrupy liquid', 'Three stepwise acid dissociation constants (pKa₁=2.15)'],
    uses: 'Phosphate fertilizers, rust conversion on iron/steel, biological phosphate buffers.',
    equation: '3H⁺ + PO₄³⁻ → H₃PO₄'
  },
  {
    key: 'Al+O',
    acceptedKeys: ['Al+O', 'Al+O2-'],
    formula: 'Al₂O₃',
    name: 'Aluminum Oxide (Alumina / Corundum)',
    molarMass: '101.961 g/mol',
    compoundType: 'Amphoteric Ceramic Oxide',
    bondType: 'Strong Ionic-Covalent Hexagonal Crystal Lattice',
    chargeBalance: '2 Al³⁺ (2 × +3 = +6) + 3 O²⁻ (3 × -2 = -6) → (+6) + (-6) = 0 net charge → 2:3 ratio (Al₂O₃)',
    properties: ['Melting Point: 2072 °C', 'Mohs hardness: 9.0 (second only to diamond among minerals)', 'Electrically insulating ceramic'],
    uses: 'Hall-Héroult aluminum smelting feedstock, sapphire watch crystals & laser rods, high-grade abrasives.',
    equation: '4Al + 3O₂ → 2Al₂O₃'
  },
  {
    key: 'O+Zn',
    acceptedKeys: ['O+Zn', 'O2-+Zn'],
    formula: 'ZnO',
    name: 'Zinc Oxide (Zincite)',
    molarMass: '81.38 g/mol',
    compoundType: 'Amphoteric Wide-Bandgap Semiconductor Oxide',
    bondType: 'Ionic / Wurtzite crystal lattice',
    chargeBalance: 'Zn²⁺ (+2) + O²⁻ (-2) → (+2) + (-2) = 0 net charge → 1:1 ratio (ZnO)',
    properties: ['Thermochromic: white at room temperature, turns lemon-yellow when heated', 'Bandgap: 3.37 eV (absorbs UV light)'],
    uses: 'Broad-spectrum UVA/UVB sunscreen, rubber vulcanization activator, varistor surge protectors.',
    equation: '2Zn + O₂ → 2ZnO'
  },
  {
    key: 'Ag+Cl',
    acceptedKeys: ['Ag+Cl', 'Ag+Cl-'],
    formula: 'AgCl',
    name: 'Silver Chloride',
    molarMass: '143.321 g/mol',
    compoundType: 'Photosensitive Insoluble Halide Salt',
    bondType: 'Ionic with significant covalent polarization',
    chargeBalance: 'Ag⁺ (+1) + Cl⁻ (-1) → (+1) + (-1) = 0 net charge → 1:1 ratio (AgCl)',
    properties: ['Curdy white precipitate insoluble in water and HNO₃', 'Decomposes into purple-gray metallic Ag upon light exposure'],
    uses: 'Qualitative analytical test for chloride ions, Ag/AgCl reference electrodes, photographic emulsions.',
    equation: 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)↓'
  },
  {
    key: 'O+S',
    acceptedKeys: ['O+S'],
    formula: 'SO₂',
    name: 'Sulfur Dioxide',
    molarMass: '64.066 g/mol',
    compoundType: 'Acidic Covalent Non-Metal Oxide',
    bondType: 'Resonance-stabilized Bent Polar Covalent (119°)',
    chargeBalance: '1 S (oxidation state +4) + 2 O (oxidation state -2) → (+4) + 2(-2) = 0 neutral molecule (SO₂)',
    properties: ['Boiling Point: -10 °C', 'Decolorizes acidified potassium permanganate (KMnO₄)'],
    uses: 'Contact process precursor for sulfuric acid, food preservative, laboratory reducing agent.',
    equation: 'S + O₂ → SO₂'
  },
  {
    key: 'Cl+Mg',
    acceptedKeys: ['Cl+Mg', 'Cl-+Mg2+', 'Cl-+Mg', 'Cl+Mg2+'],
    formula: 'MgCl₂',
    name: 'Magnesium Chloride',
    molarMass: '95.211 g/mol',
    compoundType: 'Divalent Ionic Halide Salt',
    bondType: 'Ionic (1 Mg²⁺ cation to 2 Cl⁻ anions)',
    chargeBalance: 'Mg²⁺ (+2) + 2 Cl⁻ (2 × -1 = -2) → (+2) + (-2) = 0 net charge → 1:2 ratio (MgCl₂)',
    properties: ['Melting Point: 714 °C', 'Highly soluble in water', 'Ziegler-Natta catalyst support'],
    uses: 'Electrolytic production of magnesium metal, tofu coagulant (nigari), dust & ice control.',
    equation: 'Mg²⁺ + 2Cl⁻ → MgCl₂'
  },
  {
    key: 'H+Mg+O',
    acceptedKeys: ['H+Mg+O', 'Mg2++OH-', 'Mg+OH-'],
    formula: 'Mg(OH)₂',
    name: 'Magnesium Hydroxide (Milk of Magnesia)',
    molarMass: '58.320 g/mol',
    compoundType: 'Weakly Soluble Divalent Base',
    bondType: 'Ionic layered brucite structure (1 Mg²⁺ to 2 OH⁻)',
    chargeBalance: 'Mg²⁺ (+2) + 2 OH⁻ (2 × -1 = -2) → (+2) + (-2) = 0 net charge → 1:2 ratio Mg(OH)₂',
    properties: ['Low water solubility (Ksp = 5.6 × 10⁻¹²)', 'Endothermic decomposition at 332 °C releases water'],
    uses: 'Medical antacid suspension (neutralizes excess gastric HCl), halogen-free flame retardant.',
    equation: 'Mg²⁺ + 2OH⁻ → Mg(OH)₂'
  },
  {
    key: 'Cl+Fe',
    acceptedKeys: ['Cl+Fe', 'Cl-+Fe3+', 'Cl+Fe3+', 'Cl-+Fe'],
    formula: 'FeCl₃',
    name: 'Iron(III) Chloride (Ferric Chloride)',
    molarMass: '162.204 g/mol',
    compoundType: 'Lewis-Acidic Transition Metal Halide',
    bondType: 'Polar Covalent / Ionic layered crystal',
    chargeBalance: 'Fe³⁺ (+3) + 3 Cl⁻ (3 × -1 = -3) → (+3) + (-3) = 0 net charge → 1:3 ratio (FeCl₃)',
    properties: ['Deliquescent dark crystals', 'Hydrolyzes in water to give strongly acidic amber solution'],
    uses: 'Copper PCB circuit board etchant, municipal water coagulant, Friedel-Crafts aromatic chlorination catalyst.',
    equation: 'Fe³⁺ + 3Cl⁻ → FeCl₃   |   2Fe + 3Cl₂ → 2FeCl₃'
  },
  {
    key: 'Cu+O',
    acceptedKeys: ['Cu+O', 'Cu2++O2-', 'Cu+O2-', 'Cu2++O'],
    formula: 'CuO',
    name: 'Copper(II) Oxide (Cupric Oxide)',
    molarMass: '79.545 g/mol',
    compoundType: 'Basic Transition Metal Oxide',
    bondType: 'Monoclinic Ionic-Covalent Crystal',
    chargeBalance: 'Cu²⁺ (+2) + O²⁻ (-2) → (+2) + (-2) = 0 net charge → 1:1 ratio (CuO)',
    properties: ['Melting Point: 1326 °C', 'Black solid insoluble in water; reacts with dilute acids to form blue Cu²⁺ salts'],
    uses: 'Ceramic blue/green glazes, YBCO high-temperature superconductor precursor, organic elemental analysis.',
    equation: '2Cu + O₂ → 2CuO   |   Cu²⁺ + O²⁻ → CuO'
  },
  {
    key: 'Ca+O+S',
    acceptedKeys: ['Ca+O+S', 'Ca2++SO42-', 'Ca+SO42-'],
    formula: 'CaSO₄',
    name: 'Calcium Sulfate (Gypsum / Plaster of Paris)',
    molarMass: '136.141 g/mol',
    compoundType: 'Inorganic Divalent Sulfate Salt',
    bondType: 'Ionic (Ca²⁺ and SO₄²⁻)',
    chargeBalance: 'Ca²⁺ (+2) + SO₄²⁻ (-2) → (+2) + (-2) = 0 net charge → 1:1 ratio (CaSO₄)',
    properties: ['Hemihydrate (CaSO₄·½H₂O) sets into hard gypsum dihydrate when mixed with water'],
    uses: 'Orthopedic casts, drywall plasterboard, blackboard chalk, Drierite laboratory desiccant.',
    equation: 'Ca²⁺ + SO₄²⁻ → CaSO₄'
  },
  {
    key: 'O+Si',
    acceptedKeys: ['O+Si', 'O2-+Si'],
    formula: 'SiO₂',
    name: 'Silicon Dioxide (Silica / Quartz)',
    molarMass: '60.084 g/mol',
    compoundType: 'Giant Covalent Network Oxide',
    bondType: '3D Tetrahedral Covalent Network (each Si bonded to 4 O atoms)',
    chargeBalance: '1 Si (oxidation state +4) + 2 O (oxidation state -2) → (+4) + 2(-2) = 0 stoichiometric ratio (SiO₂)',
    properties: ['Melting Point: 1713 °C', 'Mohs hardness: 7.0', 'Piezoelectric in crystalline quartz form'],
    uses: 'Optical fibers, laboratory quartz glassware, semiconductor gate oxide, concrete & glass manufacture.',
    equation: 'Si + O₂ → SiO₂'
  }
];

export interface PlanetInfo {
  id: string;
  name: string;
  type: string;
  distanceFromSun: string;
  orbitalPeriod: string;
  radiusKm: string;
  gravityMs2: number;
  meanTemp: string;
  moons: number;
  atmosphere: string;
  color: string;
  summary: string;
}

export const SOLAR_SYSTEM_BODIES: PlanetInfo[] = [
  {
    id: 'sun',
    name: 'The Sun (Sol)',
    type: 'G2V Main-Sequence Star',
    distanceFromSun: '0 AU (Center)',
    orbitalPeriod: '230M Years (Galactic)',
    radiusKm: '696,340 km',
    gravityMs2: 274.0,
    meanTemp: '5,778 K (Surface)',
    moons: 0,
    atmosphere: '73% Hydrogen, 25% Helium',
    color: '#F59E0B',
    summary: 'Contains 99.86% of the Solar System’s mass, fusing 600 million tons of hydrogen into helium every second.'
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial Planet',
    distanceFromSun: '0.39 AU (57.9M km)',
    orbitalPeriod: '88.0 Earth Days',
    radiusKm: '2,439.7 km',
    gravityMs2: 3.7,
    meanTemp: '-180 °C to +430 °C',
    moons: 0,
    atmosphere: 'Ultra-thin exosphere (O₂, Na, H₂)',
    color: '#94A3B8',
    summary: 'Smallest planet with a massive iron core accounting for ~85% of its radius and extreme temperature swings.'
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial Planet',
    distanceFromSun: '0.72 AU (108.2M km)',
    orbitalPeriod: '224.7 Earth Days',
    radiusKm: '6,051.8 km',
    gravityMs2: 8.87,
    meanTemp: '+465 °C (737 K)',
    moons: 0,
    atmosphere: '96.5% CO₂, 3.5% N₂, H₂SO₄ clouds',
    color: '#FBBF24',
    summary: 'Rotates retrograde and exhibits the hottest planetary surface due to a dense CO₂ greenhouse atmosphere.'
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial Ocean World',
    distanceFromSun: '1.00 AU (149.6M km)',
    orbitalPeriod: '365.25 Days',
    radiusKm: '6,371.0 km',
    gravityMs2: 9.81,
    meanTemp: '+15 °C (288 K)',
    moons: 1,
    atmosphere: '78% N₂, 21% O₂, 0.93% Ar',
    color: '#38BDF8',
    summary: 'Only known body harboring life, protected by a dipole magnetosphere and sustained by liquid oceans.'
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial Planet',
    distanceFromSun: '1.52 AU (227.9M km)',
    orbitalPeriod: '687.0 Earth Days',
    radiusKm: '3,389.5 km',
    gravityMs2: 3.71,
    meanTemp: '-65 °C (208 K)',
    moons: 2,
    atmosphere: '95% CO₂, 2.6% N₂, 1.9% Ar',
    color: '#EF4444',
    summary: 'Home to Olympus Mons (21.9 km volcano) and Valles Marineris canyon; colored red by iron(III) oxide dust.'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas Giant',
    distanceFromSun: '5.20 AU (778.5M km)',
    orbitalPeriod: '11.86 Earth Years',
    radiusKm: '69,911 km',
    gravityMs2: 24.79,
    meanTemp: '-110 °C (Cloud tops)',
    moons: 95,
    atmosphere: '90% H₂, 10% He, NH₃ clouds',
    color: '#FB923C',
    summary: 'Largest planet in the Solar System (2.5× the mass of all others combined), featuring the Great Red Spot.'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas Giant',
    distanceFromSun: '9.58 AU (1.43B km)',
    orbitalPeriod: '29.45 Earth Years',
    radiusKm: '58,232 km',
    gravityMs2: 10.44,
    meanTemp: '-140 °C (Cloud tops)',
    moons: 146,
    atmosphere: '96% H₂, 3% He, CH₄',
    color: '#FDE047',
    summary: 'Adorned by an icy ring system; has a mean density (0.687 g/cm³) lower than liquid water.'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice Giant',
    distanceFromSun: '19.20 AU (2.87B km)',
    orbitalPeriod: '84.02 Earth Years',
    radiusKm: '25,362 km',
    gravityMs2: 8.69,
    meanTemp: '-195 °C (78 K)',
    moons: 28,
    atmosphere: '83% H₂, 15% He, 2.3% CH₄',
    color: '#22D3EE',
    summary: 'Rotates on its side with an axial tilt of 97.77°, with atmospheric methane giving it a cyan-blue hue.'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice Giant',
    distanceFromSun: '30.05 AU (4.50B km)',
    orbitalPeriod: '164.8 Earth Years',
    radiusKm: '24,622 km',
    gravityMs2: 11.15,
    meanTemp: '-200 °C (72 K)',
    moons: 16,
    atmosphere: '80% H₂, 19% He, 1.5% CH₄',
    color: '#3B82F6',
    summary: 'First planet predicted by mathematical calculation before telescope observation; hosts supersonic winds.'
  }
];

export interface BodySystemInfo {
  id: string;
  name: string;
  tagline: string;
  keyOrgans: string[];
  primaryFunction: string;
  mechanism: string;
  clinicalFact: string;
}

export const HUMAN_BODY_SYSTEMS: BodySystemInfo[] = [
  {
    id: 'skeletal',
    name: 'Skeletal System',
    tagline: '206 mineralized bones providing structural framework, leverage, and hematopoiesis.',
    keyOrgans: ['Cranium', 'Vertebral Column', 'Rib Cage', 'Femur', 'Pelvic Girdle', 'Red Bone Marrow'],
    primaryFunction: 'Mechanical support, organ protection, calcium reservoir, and blood cell synthesis in red marrow.',
    mechanism: 'Osteoblasts deposit collagen and hydroxyapatite Ca₁₀(PO₄)₆(OH)₂ while osteoclasts remodel bone along stress lines.',
    clinicalFact: 'Red bone marrow generates roughly 2 million new red blood cells every second.'
  },
  {
    id: 'muscular',
    name: 'Muscular System',
    tagline: 'Over 600 skeletal, smooth, and cardiac muscles converting ATP into mechanical force.',
    keyOrgans: ['Skeletal Striated Muscles', 'Myocardium', 'Visceral Smooth Muscle', 'Tendons', 'Diaphragm'],
    primaryFunction: 'Locomotion, posture maintenance, blood propulsion, peristalsis, and thermogenesis.',
    mechanism: 'Sliding Filament Theory: Ca²⁺ binds troponin, shifting tropomyosin so myosin heads pull actin filaments using ATP.',
    clinicalFact: 'Cardiac muscle cells contain up to 40% mitochondria by volume so the heart never fatigues.'
  },
  {
    id: 'respiratory',
    name: 'Respiratory System',
    tagline: 'Gas-exchange architecture across 300 million pulmonary alveoli.',
    keyOrgans: ['Nasal Cavity & Pharynx', 'Larynx & Trachea', 'Bronchi & Bronchioles', 'Alveolar Sacs', 'Diaphragm'],
    primaryFunction: 'Ventilation (O₂ uptake and CO₂ elimination) and blood acid-base pH buffering.',
    mechanism: 'Diaphragm contraction lowers intrathoracic pressure (Boyle’s Law); O₂ diffuses across the 0.5-µm alveolar membrane.',
    clinicalFact: 'Unfolded flat, the gas-exchange surface area of human lungs is ~75 m² (half a tennis court).'
  },
  {
    id: 'circulatory',
    name: 'Circulatory System',
    tagline: 'Dual-loop pressurized vascular network driven by a four-chambered muscular pump.',
    keyOrgans: ['Four-Chambered Heart', 'Aorta & Arteries', 'Capillary Beds', 'Veins & Venae Cavae', 'Blood'],
    primaryFunction: 'Transport of oxygen, nutrients, hormones, immune cells, and metabolic waste across pulmonary and systemic loops.',
    mechanism: 'SA node pacemaker initiates depolarization; right ventricle drives pulmonary oxygenation while left ventricle drives systemic flow.',
    clinicalFact: 'At rest, the human heart pumps ~5 liters of blood per minute, rising to 25+ L/min during exercise.'
  },
  {
    id: 'digestive',
    name: 'Digestive System',
    tagline: 'Enzymatic hydrolysis and microvillar nutrient absorption along a 9-meter tract.',
    keyOrgans: ['Oral Cavity', 'Esophagus & Stomach', 'Liver & Gallbladder', 'Pancreas', 'Small & Large Intestine'],
    primaryFunction: 'Mechanical breakdown, enzymatic hydrolysis of macromolecules, and nutrient/water absorption.',
    mechanism: 'Gastric HCl (pH 1.5–2.0) activates pepsin; bile salts emulsify lipids while pancreatic enzymes digest starch, protein, and fat.',
    clinicalFact: 'Intestinal villi and microvilli amplify the absorptive surface area of the small intestine by 600-fold.'
  },
  {
    id: 'nervous',
    name: 'Nervous System',
    tagline: 'Electrochemical signal computation across 86 billion neurons and 100 trillion synapses.',
    keyOrgans: ['Cerebrum & Cortex', 'Cerebellum', 'Brainstem', 'Spinal Cord', 'Peripheral Nerves'],
    primaryFunction: 'Sensory integration, motor coordination, homeostasis, memory consolidation, and cognition.',
    mechanism: 'Voltage-gated Na⁺/K⁺ channels propagate action potentials up to 120 m/s along myelinated axons before synaptic transmission.',
    clinicalFact: 'Accounting for 2% of body weight, the brain consumes 20% of the body’s oxygen and glucose budget.'
  },
  {
    id: 'endocrine',
    name: 'Endocrine System',
    tagline: 'Chemical feedback signaling via blood-borne hormones regulating metabolism and growth.',
    keyOrgans: ['Hypothalamus & Pituitary', 'Thyroid & Parathyroid', 'Adrenal Glands', 'Pancreatic Islets', 'Pineal Gland'],
    primaryFunction: 'Regulation of metabolic rate, blood glucose homeostasis, electrolyte balance, and somatic growth.',
    mechanism: 'Negative feedback loops: elevated glucose stimulates pancreatic β-cells to secrete insulin, promoting cellular glucose uptake.',
    clinicalFact: 'Hormones act at picomolar (10⁻¹² M) concentrations in the bloodstream.'
  }
];
