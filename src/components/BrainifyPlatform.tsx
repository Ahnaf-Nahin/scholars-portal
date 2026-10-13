import React, { useState, useMemo } from 'react';
import { usePlatform, BrainifyTab } from '../context/PlatformContext';
import { PortalHeaderBar } from './PortalHeaderBar';
import { BRAINIFY_QUESTIONS, QuizQuestion } from '../data/brainifyData';
import {
  CircuitMakerModule,
  PeriodicTableModule,
  ReactiMixModule,
  PhysicsLabModule,
  MathLabModule,
  SpaceAndBodyExplorerModule
} from './BrainifyLabs';
import { sound } from '../utils/sound';
import {
  Atom,
  Brain,
  Calculator,
  BookOpenCheck,
  Cpu,
  Table2,
  FlaskConical,
  Gauge,
  Telescope,
  HeartPulse,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Globe,
  Sparkles,
  Beaker
} from 'lucide-react';

// ============================================================================
// REUSABLE QUIZ ENGINE COMPONENT (General Knowledge, Science, Math, IQ, English)
// ============================================================================
const ReusableQuizEngine: React.FC<{
  quizType: 'gk' | 'science' | 'math' | 'iq' | 'english';
  activityId: BrainifyTab;
  title: string;
  subtitle: string;
}> = ({ quizType, activityId, title, subtitle }) => {
  const { recordBrainifyQuiz, updateActivityProgress } = usePlatform();

  const pool = useMemo(
    () => BRAINIFY_QUESTIONS.filter((q) => q.quizType === quizType),
    [quizType]
  );

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(pool.map((q) => q.category)))],
    [pool]
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [numericalInput, setNumericalInput] = useState<string>('');
  const [answersLog, setAnswersLog] = useState<
    Array<{ question: QuizQuestion; userAns: string; correct: boolean }>
  >([]);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const activeQuestions = useMemo(() => {
    const filtered = pool.filter(
      (q) =>
        (selectedCategory === 'All' || q.category === selectedCategory) &&
        (selectedDifficulty === 'All' || q.difficulty === selectedDifficulty)
    );
    return filtered.length > 0 ? filtered : pool;
  }, [pool, selectedCategory, selectedDifficulty]);

  const currentQuestion = activeQuestions[currentIdx] || activeQuestions[0];

  const handleSelectOption = (answer: string) => {
    if (selectedAnswer !== null) return;
    const isCorrect =
      answer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    if (isCorrect) sound.playCorrect();
    else sound.playWrong();

    setSelectedAnswer(answer);
    const nextLog = [
      ...answersLog,
      { question: currentQuestion, userAns: answer, correct: isCorrect }
    ];
    setAnswersLog(nextLog);

    // Update real progress based on actual questions answered in this quiz
    const realPct = Math.round((nextLog.length / (activeQuestions.length || 1)) * 100);
    updateActivityProgress(activityId, realPct, 'max');
  };

  const handleNextQuestion = () => {
    sound.playClick();
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setNumericalInput('');
    } else {
      const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
      setElapsedSeconds(duration);
      setQuizFinished(true);
      sound.playComplete();

      const correctCount = answersLog.filter((a) => a.correct).length;
      const totalCount = activeQuestions.length;
      const accuracy = Math.round((correctCount / (totalCount || 1)) * 100);
      updateActivityProgress(activityId, Math.max(accuracy, 100), 'max');
      recordBrainifyQuiz(
        {
          category: title,
          subTopic: selectedCategory === 'All' ? title : selectedCategory,
          difficulty: selectedDifficulty,
          score: correctCount,
          total: totalCount,
          accuracy,
          timeSeconds: duration
        },
        correctCount * 50 + 25
      );
    }
  };

  const handleRestartQuiz = () => {
    sound.playClick();
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setNumericalInput('');
    setAnswersLog([]);
    setQuizFinished(false);
    setStartTime(Date.now());
  };

  const correctCount = answersLog.filter((a) => a.correct).length;
  const wrongCount = answersLog.length - correctCount;
  const accuracyPct = Math.round(
    (correctCount / (activeQuestions.length || 1)) * 100
  );

  const reasoningScore = 85 + Math.round((accuracyPct / 100) * 60);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Category & Difficulty Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              handleRestartQuiz();
            }}
            className="bg-[#0B0D18] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Topic: {c}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              handleRestartQuiz();
            }}
            className="bg-[#0B0D18] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {!quizFinished ? (
        <div className="bg-[#0B0D18] border border-purple-500/35 rounded-2xl p-6 md:p-8 max-w-3xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4">
            <span>
              Question {currentIdx + 1} of {activeQuestions.length} · {currentQuestion.category} · {currentQuestion.difficulty}
            </span>
            <span className="text-purple-400">
              Score: {correctCount} / {answersLog.length}
            </span>
          </div>

          <h3 className="font-display text-lg md:text-xl font-bold text-white mb-6 leading-snug">
            {currentQuestion.question}
          </h3>

          {currentQuestion.inputType === 'numerical' ? (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  disabled={selectedAnswer !== null}
                  value={numericalInput}
                  onChange={(e) => setNumericalInput(e.target.value)}
                  placeholder="Enter numerical answer..."
                  className="bg-[#070810] border border-white/20 rounded-lg px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-400"
                />
                {selectedAnswer === null && (
                  <button
                    onClick={() => handleSelectOption(numericalInput)}
                    className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Submit Answer
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {currentQuestion.options?.map((opt) => {
                const isPicked = selectedAnswer === opt;
                const isRight = opt === currentQuestion.correctAnswer;
                let borderStyle = 'border-white/10 bg-[#070810] hover:border-purple-400/50 text-slate-200';
                if (selectedAnswer !== null) {
                  if (isRight) {
                    borderStyle = 'border-emerald-500 bg-emerald-950/35 text-emerald-200';
                  } else if (isPicked && !isRight) {
                    borderStyle = 'border-red-500 bg-red-950/35 text-red-200';
                  }
                }
                return (
                  <button
                    key={opt}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${borderStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedAnswer !== null && isRight && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {selectedAnswer !== null && isPicked && !isRight && (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedAnswer !== null && (
            <div
              className={`p-5 rounded-xl border mb-6 space-y-2 ${
                selectedAnswer.trim().toLowerCase() ===
                currentQuestion.correctAnswer.trim().toLowerCase()
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-red-950/30 border-red-500/40'
              }`}
            >
              {selectedAnswer.trim().toLowerCase() ===
              currentQuestion.correctAnswer.trim().toLowerCase() ? (
                <div className="font-display text-sm font-bold text-emerald-300">
                  ✓ Correct
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-display text-sm font-bold text-red-300">
                    ✕ Incorrect
                  </div>
                  <div className="text-xs text-white">
                    <strong>Correct Answer: </strong>
                    {currentQuestion.correctAnswer}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-200 leading-relaxed">
                <strong className="text-purple-300">Explanation: </strong>
                {currentQuestion.explanation}
              </p>

              {currentQuestion.steps && currentQuestion.steps.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1 text-xs font-mono text-cyan-200">
                  <div className="text-slate-400">Step-by-Step Derivation:</div>
                  {currentQuestion.steps.map((st, idx) => (
                    <div key={idx}>
                      Step {idx + 1}: {st}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedAnswer !== null && (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
            >
              {currentIdx + 1 < activeQuestions.length ? 'Next Question →' : 'Finish & View Summary →'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#0B0D18] border border-purple-500/35 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-mono text-purple-400">QUIZ COMPLETED</div>
              <h3 className="font-display text-2xl font-bold text-white mt-1">
                {title} — Performance Summary
              </h3>
            </div>
            <button
              onClick={handleRestartQuiz}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Quiz</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-[#070810] border border-white/10">
              <div className="text-xs text-slate-400">Final Score</div>
              <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                {correctCount} / {activeQuestions.length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#070810] border border-white/10">
              <div className="text-xs text-slate-400">Accuracy</div>
              <div className="font-mono text-2xl font-bold text-purple-400 mt-1 tabular-nums">
                {accuracyPct}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#070810] border border-white/10">
              <div className="text-xs text-slate-400">Correct</div>
              <div className="font-mono text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
                {correctCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#070810] border border-white/10">
              <div className="text-xs text-slate-400">Wrong</div>
              <div className="font-mono text-2xl font-bold text-red-400 mt-1 tabular-nums">
                {wrongCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#070810] border border-white/10">
              <div className="text-xs text-slate-400">Time Elapsed</div>
              <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                {elapsedSeconds}s
              </div>
            </div>
          </div>

          {quizType === 'iq' && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1">
              <div className="font-display text-lg font-bold text-purple-300">
                Analytical Reasoning Score: {reasoningScore}
              </div>
              <p className="text-xs text-slate-300">
                Note: This Reasoning Score is an educational pattern-recognition and logic metric designed for classroom practice.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-white">
              Review Answers &amp; Explanations
            </h4>
            {answersLog.map((entry, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-[#070810] border border-white/10 text-xs space-y-1"
              >
                <div className="font-bold text-white">
                  Q{idx + 1}. {entry.question.question}
                </div>
                <div className="font-mono">
                  <span className={entry.correct ? 'text-emerald-400' : 'text-red-400'}>
                    Your Answer: {entry.userAns} ({entry.correct ? '✓ Correct' : '✕ Wrong'})
                  </span>
                  {!entry.correct && (
                    <span className="text-purple-300 ml-3">
                      Correct Answer: {entry.question.correctAnswer}
                    </span>
                  )}
                </div>
                <p className="text-slate-400">{entry.question.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// VIRTUAL CHEMISTRY LAB MODULE
// ============================================================================
const VirtualChemistryLabModule: React.FC = () => {
  const { updateActivityProgress } = usePlatform();
  const [naohAdded, setNaohAdded] = useState<number>(0);

  const titrationState = useMemo(() => {
    if (naohAdded < 24) {
      const ph = (1.0 + (naohAdded / 24) * 2.2).toFixed(2);
      return {
        ph,
        color: 'rgba(56, 189, 248, 0.25)',
        label: 'Acidic Region (Colorless Phenolphthalein)',
        obs: `Solution remains clear and colorless. ${25 - naohAdded} mL of 0.10 M HCl remains unreacted.`,
        res: `pH = ${ph} (Pre-equivalence acidic solution)`
      };
    }
    if (naohAdded >= 24 && naohAdded <= 26) {
      return {
        ph: '7.00',
        color: 'rgba(244, 114, 182, 0.45)',
        label: 'Equivalence Point Reached (Pale Pink)',
        obs: 'Faint persistent pale-pink endpoint achieved! Moles of H⁺ equal moles of OH⁻ added.',
        res: 'pH = 7.00 at 25.0 mL — Complete Stoichiometric Neutralization (NaCl + H₂O)'
      };
    }
    const ph = (11.2 + ((naohAdded - 26) / 24) * 1.6).toFixed(2);
    return {
      ph,
      color: 'rgba(236, 72, 153, 0.75)',
      label: 'Alkaline Excess (Deep Magenta Pink)',
      obs: `Solution turns bright magenta-pink due to ${naohAdded - 25} mL excess 0.10 M NaOH.`,
      res: `pH = ${ph} (Post-equivalence basic solution)`
    };
  }, [naohAdded]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">
          Virtual Chemistry Lab — Acid-Base Titration &amp; Indicator Simulation
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Structured scientific protocol: Objective → Materials → Procedure → Experiment → Observation → Result → Explanation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#0B0D18] border border-white/10 rounded-xl p-5 space-y-4 text-xs">
          <div>
            <span className="font-mono text-purple-400 block mb-1">01. OBJECTIVE</span>
            <p className="text-slate-200 leading-relaxed">
              Determine the neutralization equivalence point of 25.0 mL of 0.10 M Hydrochloric Acid (HCl) titrated with 0.10 M Sodium Hydroxide (NaOH) using phenolphthalein indicator.
            </p>
          </div>
          <div>
            <span className="font-mono text-purple-400 block mb-1">02. MATERIALS</span>
            <p className="text-slate-300">
              50 mL Graduated Burette (0.10 M NaOH) · 250 mL Conical Flask (25.0 mL 0.10 M HCl) · Phenolphthalein Indicator · Digital pH Probe
            </p>
          </div>
          <div>
            <span className="font-mono text-purple-400 block mb-1">03. PROCEDURE</span>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Pipette 25.0 mL of 0.10 M HCl into the conical flask with 2 drops of phenolphthalein.</li>
              <li>Use the burette volume slider to add 0.10 M NaOH incrementally from 0 mL to 50 mL.</li>
              <li>Observe the sharp equivalence point transition at 25.0 mL.</li>
            </ol>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#0B0D18] border border-purple-500/35 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-purple-400">
              04. INTERACTIVE TITRATION CHAMBER
            </span>
            <span className="font-mono text-sm font-bold text-white">
              Live pH Meter: {titrationState.ph}
            </span>
          </div>

          <div className="p-6 rounded-xl bg-[#070810] border border-white/10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-36 rounded-b-2xl border-2 border-slate-400/60 relative overflow-hidden flex items-end justify-center shrink-0">
              <div
                className="w-full transition-all duration-300"
                style={{
                  height: `${45 + naohAdded}%`,
                  backgroundColor: titrationState.color
                }}
              />
              <span className="absolute bottom-2 font-mono text-[11px] text-white font-bold">
                {25 + naohAdded} mL Total
              </span>
            </div>

            <div className="flex-1 w-full space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-200 font-semibold">
                    Volume of 0.10 M NaOH Added from Burette:
                  </span>
                  <span className="font-mono text-purple-300 font-bold">{naohAdded} mL</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={naohAdded}
                  onChange={(e) => {
                    setNaohAdded(Number(e.target.value));
                    updateActivityProgress('chemistry-lab', 25, 'add');
                  }}
                  className="w-full accent-purple-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setNaohAdded(0);
                    updateActivityProgress('chemistry-lab', 20, 'add');
                  }}
                  className="px-3 py-1.5 rounded bg-white/10 text-white cursor-pointer"
                >
                  0 mL (Start)
                </button>
                <button
                  onClick={() => {
                    setNaohAdded(25);
                    updateActivityProgress('chemistry-lab', 50, 'add');
                  }}
                  className="px-3 py-1.5 rounded bg-purple-600 text-white font-bold cursor-pointer"
                >
                  25 mL (Equivalence Point)
                </button>
                <button
                  onClick={() => {
                    setNaohAdded(40);
                    updateActivityProgress('chemistry-lab', 25, 'add');
                  }}
                  className="px-3 py-1.5 rounded bg-white/10 text-white cursor-pointer"
                >
                  40 mL (Excess Base)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
              <strong className="text-cyan-400 block mb-1">05. OBSERVATION</strong>
              <p className="text-slate-300">{titrationState.obs}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
              <strong className="text-emerald-400 block mb-1">06. RESULT</strong>
              <p className="text-slate-300">{titrationState.res}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
              <strong className="text-purple-400 block mb-1">07. EXPLANATION</strong>
              <p className="text-slate-300">
                HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l). Phenolphthalein shifts from colorless to pink above pH 8.2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN INTERACTIVE LEARNING PLATFORM SHELL (FUTURISTIC DEEP-PURPLE & BLACK LAB)
// ============================================================================
interface ActivityCardMeta {
  id: BrainifyTab;
  title: string;
  subtitle: string;
  description: string;
  subject: string;
  difficulty: string;
  icon: React.ReactNode;
  iconGradient: string;
  glowBorder: string;
  barGradient: string;
}

export const BrainifyPlatform: React.FC = () => {
  const { db, brainifyTab, setBrainifyTab, exitBrainify } = usePlatform();

  // Compute real progress for any activity from actual saved student activity data
  const getRealActivityProgress = (id: BrainifyTab): number => {
    const savedMap = db.brainify.activityProgress || {};
    if (typeof savedMap[id] === 'number' && savedMap[id] > 0) {
      return Math.min(100, Math.round(savedMap[id]));
    }
    return 0;
  };

  const activityCards: ActivityCardMeta[] = [
    {
      id: 'gk-quiz',
      title: 'General Knowledge Quiz',
      subtitle: 'World & Bangladesh Knowledge Test',
      description: 'Test your knowledge across Bangladesh history, engineering milestones, geography, and global science.',
      subject: 'General Knowledge',
      difficulty: 'Easy – Hard',
      icon: <Globe className="w-6 h-6 text-white" />,
      iconGradient: 'from-purple-600 to-indigo-600',
      glowBorder: 'hover:border-purple-500/60 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.28)]',
      barGradient: 'from-purple-500 to-indigo-400'
    },
    {
      id: 'science-quiz',
      title: 'Science Quiz',
      subtitle: 'Science Knowledge Challenge',
      description: 'Difficulty-graded Physics, Chemistry, Biology, Earth & Space Science questions with step-by-step explanations.',
      subject: 'Science',
      difficulty: 'Adaptive',
      icon: <Atom className="w-6 h-6 text-white" />,
      iconGradient: 'from-cyan-500 to-blue-600',
      glowBorder: 'hover:border-cyan-500/60 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.28)]',
      barGradient: 'from-cyan-400 to-blue-500'
    },
    {
      id: 'math-quiz',
      title: 'Mathematics Challenge',
      subtitle: 'Algebra & Problem Solving',
      description: 'Solve Algebra, Geometry, Mensuration, Trigonometry, and Probability problems with full derivations.',
      subject: 'Mathematics',
      difficulty: 'Medium – Hard',
      icon: <Calculator className="w-6 h-6 text-white" />,
      iconGradient: 'from-pink-500 to-rose-600',
      glowBorder: 'hover:border-pink-500/60 hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.28)]',
      barGradient: 'from-pink-500 to-rose-400'
    },
    {
      id: 'reactimix',
      title: 'ReactiMix',
      subtitle: 'Interactive Chemistry Laboratory',
      description: 'Explore all 118 elements and combine compatible ions & elements to synthesize verified chemical compounds.',
      subject: 'Chemistry · 118 Elements',
      difficulty: 'Interactive Lab',
      icon: <FlaskConical className="w-6 h-6 text-white" />,
      iconGradient: 'from-emerald-500 to-teal-600',
      glowBorder: 'hover:border-emerald-500/60 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.28)]',
      barGradient: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'periodic-table',
      title: 'Periodic Table',
      subtitle: 'Explore All 118 Elements',
      description: 'Complete IUPAC periodic table from Hydrogen (1) to Oganesson (118) with Bohr electron shells and oxidation states.',
      subject: 'Chemistry Reference',
      difficulty: 'All Levels',
      icon: <Table2 className="w-6 h-6 text-white" />,
      iconGradient: 'from-blue-500 to-purple-600',
      glowBorder: 'hover:border-blue-500/60 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.28)]',
      barGradient: 'from-blue-400 to-purple-500'
    },
    {
      id: 'circuit-maker',
      title: 'Circuit Builder',
      subtitle: 'Build & Test Circuits',
      description: 'Assemble DC loops with batteries, switches, resistors, LEDs, motors, and buzzers with live Ohm’s Law diagnostics.',
      subject: 'Physics & Electronics',
      difficulty: 'Interactive Lab',
      icon: <Cpu className="w-6 h-6 text-white" />,
      iconGradient: 'from-amber-500 to-red-600',
      glowBorder: 'hover:border-amber-500/60 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.28)]',
      barGradient: 'from-amber-400 to-red-500'
    },
    {
      id: 'iq-quiz',
      title: 'IQ & Logical Reasoning',
      subtitle: 'Analytical & Pattern Deduction',
      description: 'Sharpen sequence recognition, contrapositive logic, analogies, and 3D spatial cube reasoning.',
      subject: 'Cognitive Logic',
      difficulty: 'Easy – Hard',
      icon: <Brain className="w-6 h-6 text-white" />,
      iconGradient: 'from-violet-600 to-fuchsia-600',
      glowBorder: 'hover:border-violet-500/60 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.28)]',
      barGradient: 'from-violet-400 to-fuchsia-500'
    },
    {
      id: 'english-quiz',
      title: 'English Language Challenge',
      subtitle: 'Grammar, Voice & Vocabulary',
      description: 'Practice subject-verb agreement, tenses, active/passive voice, indirect narration, and academic vocabulary.',
      subject: 'English',
      difficulty: 'Easy – Hard',
      icon: <BookOpenCheck className="w-6 h-6 text-white" />,
      iconGradient: 'from-sky-500 to-indigo-600',
      glowBorder: 'hover:border-sky-500/60 hover:shadow-[0_0_30px_-5px_rgba(14,165,233,0.28)]',
      barGradient: 'from-sky-400 to-indigo-500'
    },
    {
      id: 'physics-lab',
      title: 'Physics Simulation Lab',
      subtitle: 'Kinematics, Force & Snell’s Law',
      description: 'Manipulate mass, velocity, gravitational field, force, and optical refraction angles in real time.',
      subject: 'Physics',
      difficulty: 'Simulation',
      icon: <Gauge className="w-6 h-6 text-white" />,
      iconGradient: 'from-red-600 to-orange-500',
      glowBorder: 'hover:border-red-500/60 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.28)]',
      barGradient: 'from-red-500 to-orange-400'
    },
    {
      id: 'chemistry-lab',
      title: 'Titration Chamber',
      subtitle: 'Acid-Base Neutralization Lab',
      description: 'Perform quantitative HCl + NaOH burette titration with phenolphthalein indicator and live pH telemetry.',
      subject: 'Analytical Chemistry',
      difficulty: 'Simulation',
      icon: <Beaker className="w-6 h-6 text-white" />,
      iconGradient: 'from-fuchsia-500 to-pink-600',
      glowBorder: 'hover:border-fuchsia-500/60 hover:shadow-[0_0_30px_-5px_rgba(217,70,239,0.28)]',
      barGradient: 'from-fuchsia-400 to-pink-500'
    },
    {
      id: 'math-lab',
      title: 'Mathematics Function Lab',
      subtitle: 'Scientific Evaluator & Wave Plotter',
      description: 'Evaluate trigonometric and logarithmic functions and visualize live harmonic sine waves.',
      subject: 'Higher Mathematics',
      difficulty: 'Interactive Tool',
      icon: <Calculator className="w-6 h-6 text-white" />,
      iconGradient: 'from-teal-500 to-cyan-600',
      glowBorder: 'hover:border-teal-500/60 hover:shadow-[0_0_30px_-5px_rgba(20,184,166,0.28)]',
      barGradient: 'from-teal-400 to-cyan-500'
    },
    {
      id: 'space-explorer',
      title: 'Space & Solar System Lab',
      subtitle: 'Planetary Orbits & Surface Gravity',
      description: 'Inspect the Sun and all 8 planets with orbital radii, atmospheric composition, and gravitational acceleration.',
      subject: 'Astrophysics',
      difficulty: 'Exploration',
      icon: <Telescope className="w-6 h-6 text-white" />,
      iconGradient: 'from-indigo-500 to-purple-600',
      glowBorder: 'hover:border-indigo-500/60 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.28)]',
      barGradient: 'from-indigo-400 to-purple-500'
    },
    {
      id: 'human-body',
      title: 'Human Body Explorer',
      subtitle: 'Physiological Organ Systems',
      description: 'Explore skeletal, muscular, respiratory, circulatory, digestive, nervous, and endocrine architectures.',
      subject: 'Human Biology',
      difficulty: 'Exploration',
      icon: <HeartPulse className="w-6 h-6 text-white" />,
      iconGradient: 'from-rose-500 to-red-600',
      glowBorder: 'hover:border-rose-500/60 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.28)]',
      barGradient: 'from-rose-400 to-red-500'
    }
  ];

  const navButtons: Array<{ id: BrainifyTab; label: string }> = [
    { id: 'home', label: 'All Activities' },
    { id: 'gk-quiz', label: 'General Knowledge' },
    { id: 'science-quiz', label: 'Science Quiz' },
    { id: 'math-quiz', label: 'Mathematics' },
    { id: 'reactimix', label: 'ReactiMix (118)' },
    { id: 'periodic-table', label: 'Periodic Table' },
    { id: 'circuit-maker', label: 'Circuit Builder' },
    { id: 'iq-quiz', label: 'IQ & Logic' },
    { id: 'english-quiz', label: 'English' },
    { id: 'physics-lab', label: 'Physics Lab' },
    { id: 'chemistry-lab', label: 'Titration Lab' },
    { id: 'math-lab', label: 'Math Lab' },
    { id: 'space-explorer', label: 'Space Lab' },
    { id: 'human-body', label: 'Human Body' },
    { id: 'progress', label: 'Progress Tracker' }
  ];

  const overallChronosProgress = Math.round(
    activityCards.reduce((sum, c) => sum + getRealActivityProgress(c.id), 0) /
      (activityCards.length || 1)
  );
  const startedModulesCount = activityCards.filter(
    (c) => getRealActivityProgress(c.id) > 0
  ).length;

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Deep Purple Futuristic Ambient Atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.18) 0%, rgba(17, 12, 36, 0.08) 45%, rgba(5, 5, 10, 0) 75%)'
        }}
      />

      <PortalHeaderBar
        portalTitle="SCHOLAR'S SCHOOL & COLLEGE · CHRONOS"
        accentMode="crimson"
      />

      {/* Dedicated Chronos Top Navigation Bar */}
      <div className="relative z-10 bg-[#080912]/90 backdrop-blur-md border-b border-purple-500/25 px-3 sm:px-5 md:px-8 py-2.5">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="px-2.5 py-1 rounded-lg bg-purple-600/20 border border-purple-400/40 font-display text-xs font-extrabold tracking-wider text-purple-300 mr-1 shrink-0">
              CHRONOS
            </span>
            {navButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  sound.playClick();
                  setBrainifyTab(btn.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  brainifyTab === btn.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/25'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={exitBrainify}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Portal</span>
            <span className="sm:hidden">Portal</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-[1360px] w-full mx-auto px-3.5 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
        {/* ================================================================= */}
        {/* FUTURISTIC INTERACTIVE LEARNING LAUNCHER                          */}
        {/* ================================================================= */}
        {brainifyTab === 'home' && (
          <div className="space-y-8 sm:space-y-10">
            {/* Centered Header: Only EXPLORE. LEARN. EXPERIMENT. */}
            <div className="text-center max-w-3xl mx-auto pt-1">
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                EXPLORE. LEARN. EXPERIMENT.
              </h1>
            </div>

            {/* LIVE PROGRESS TRACKER BAR */}
            <div className="bg-[#0B0C14]/95 border border-purple-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-display font-bold text-white">
                    Overall Progress Tracker
                  </span>
                  <span className="font-mono font-bold text-purple-300 tabular-nums">
                    {overallChronosProgress}% Overall ({startedModulesCount}/{activityCards.length} Modules Started)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${overallChronosProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                <div className="text-xs font-mono text-slate-300">
                  <span className="text-purple-300 font-bold">{db.brainify.xp.toLocaleString()} XP</span> ·{' '}
                  <span>{db.brainify.quizzesCompleted} Quizzes</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBrainifyTab('progress');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Open Progress Tracker →
                </button>
              </div>
            </div>

            {/* Responsive 3-Column (Desktop) / 2-Column (Tablet) / 1-Column (Mobile) Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activityCards.map((card) => {
                const progress = getRealActivityProgress(card.id);
                const statusLabel =
                  progress === 0
                    ? 'Not Started'
                    : progress >= 100
                    ? 'Completed'
                    : 'In Progress';

                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      sound.playClick();
                      setBrainifyTab(card.id);
                    }}
                    className={`group relative rounded-2xl bg-[#0B0C14]/90 border border-white/10 p-4 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer ${card.glowBorder}`}
                  >
                    <div>
                      {/* Top Row: Colorful Gradient Icon + Subject / Difficulty Badges */}
                      <div className="flex items-start justify-between gap-2.5 mb-4">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${card.iconGradient} flex items-center justify-center shadow-lg shrink-0`}
                        >
                          {card.icon}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] sm:text-[11px] font-mono text-slate-300">
                            {card.subject}
                          </span>
                          <span className="text-[10px] font-mono text-purple-300/90">
                            {card.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* White Activity Title & Subtitle */}
                      <h2 className="font-display text-lg sm:text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                        {card.title}
                      </h2>
                      <p className="text-xs font-semibold text-slate-300 mt-0.5">
                        {card.subtitle}
                      </p>

                      {/* Gray Description */}
                      <p className="text-xs text-slate-400 leading-relaxed mt-2 mb-5">
                        {card.description}
                      </p>
                    </div>

                    {/* Bottom Section: Real Progress Bar + Launch Action */}
                    <div className="pt-4 border-t border-white/10 space-y-3.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span
                            className={
                              progress === 0
                                ? 'text-slate-500'
                                : 'text-slate-300 font-semibold'
                            }
                          >
                            {statusLabel}
                          </span>
                          <span
                            className={
                              progress === 0
                                ? 'text-slate-500'
                                : 'text-white font-bold tabular-nums'
                            }
                          >
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${card.barGradient} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-mono text-slate-500">
                          {progress === 0
                            ? '0% · Not Started'
                            : `${progress}% progress`}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                          <span>Launch</span>
                          <span className="transition-transform duration-200 group-hover:translate-x-1">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {brainifyTab === 'gk-quiz' && (
          <ReusableQuizEngine
            quizType="gk"
            activityId="gk-quiz"
            title="General Knowledge Quiz"
            subtitle="World & Bangladesh Knowledge Test · History · Geography · Science & Engineering"
          />
        )}

        {brainifyTab === 'science-quiz' && (
          <ReusableQuizEngine
            quizType="science"
            activityId="science-quiz"
            title="Science Quiz"
            subtitle="Physics · Chemistry · Biology · Earth Science · Space Science · General Science"
          />
        )}

        {brainifyTab === 'math-quiz' && (
          <ReusableQuizEngine
            quizType="math"
            activityId="math-quiz"
            title="Mathematics Challenge"
            subtitle="Algebra · Geometry · Mensuration · Statistics · Probability · Equations · Trigonometry"
          />
        )}

        {brainifyTab === 'iq-quiz' && (
          <ReusableQuizEngine
            quizType="iq"
            activityId="iq-quiz"
            title="IQ & Logical Reasoning Quiz"
            subtitle="Number Patterns · Logical Deduction · Analogies · Spatial Reasoning"
          />
        )}

        {brainifyTab === 'english-quiz' && (
          <ReusableQuizEngine
            quizType="english"
            activityId="english-quiz"
            title="English Language & Grammar Quiz"
            subtitle="Tenses · Articles · Prepositions · Voice · Narration · Subject-Verb Agreement · Vocabulary"
          />
        )}

        {brainifyTab === 'circuit-maker' && <CircuitMakerModule />}
        {brainifyTab === 'periodic-table' && <PeriodicTableModule />}
        {brainifyTab === 'reactimix' && <ReactiMixModule />}
        {brainifyTab === 'physics-lab' && <PhysicsLabModule />}
        {brainifyTab === 'chemistry-lab' && <VirtualChemistryLabModule />}
        {brainifyTab === 'math-lab' && <MathLabModule />}
        {brainifyTab === 'space-explorer' && <SpaceAndBodyExplorerModule mode="space" />}
        {brainifyTab === 'human-body' && <SpaceAndBodyExplorerModule mode="body" />}

        {/* PROGRESS TRACKER & ACTIVITY LOG */}
        {brainifyTab === 'progress' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  Chronos Progress Tracker &amp; Activity History
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real saved progress across all 13 Chronos modules, ReactiMix syntheses, and quizzes
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-400/40 font-mono text-xs text-purple-200 font-bold">
                Overall Mastery: {overallChronosProgress}% ({startedModulesCount}/{activityCards.length} Modules Started)
              </div>
            </div>

            {/* Module-by-Module Progress Tracker Grid */}
            <div className="bg-[#0B0D18] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                All Modules Progress Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {activityCards.map((c) => {
                  const pct = getRealActivityProgress(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => setBrainifyTab(c.id)}
                      className="p-3.5 rounded-xl bg-[#070810] border border-white/10 hover:border-purple-400/50 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xs sm:text-sm font-bold text-white truncate">
                          {c.title}
                        </span>
                        <span className="font-mono text-xs font-bold text-purple-300 tabular-nums">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${c.barGradient} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>{pct === 0 ? 'Not Started' : pct >= 100 ? 'Completed' : 'In Progress'}</span>
                        <span className="text-purple-300">Open →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="bg-[#0B0D18] border border-purple-500/30 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="font-display text-base sm:text-lg font-bold text-white">
                  Unlocked Scientific Badges ({db.brainify.unlockedAchievements.length})
                </h3>
                {db.brainify.unlockedAchievements.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No badges unlocked yet. Complete a quiz or run an experiment in ReactiMix or Circuit Builder to earn badges.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {db.brainify.unlockedAchievements.map((ach, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-[#070810] border border-purple-500/30 flex items-center gap-3 text-xs text-purple-200 font-semibold"
                      >
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#0B0D18] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="font-display text-base sm:text-lg font-bold text-white">
                  Completed Quiz Log ({db.brainify.quizHistory.length})
                </h3>
                {db.brainify.quizHistory.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No quizzes completed yet. Launch any quiz from Interactive Learning to record your score.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {db.brainify.quizHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-3.5 rounded-xl bg-[#070810] border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{h.category}</div>
                          <div className="text-slate-400">
                            {h.subTopic} · {h.date}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-purple-400 font-bold">
                            {h.score}/{h.total} ({h.accuracy}%)
                          </div>
                          <div className="text-slate-500">{h.timeSeconds}s</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
