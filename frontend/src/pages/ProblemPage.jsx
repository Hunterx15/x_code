import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate, useSearchParams, NavLink } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Play,
  Send,
  Maximize2,
  Minimize2,
  Save,
  ChevronLeft,
  FileCode2,
  MessageSquare,
  Video,
  History,
  Lightbulb,
  Code2,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  MemoryStick,
  Bookmark,
  Heart,
  StickyNote,
  Link2,
  MessagesSquare,
  RotateCcw,
  Settings2,
  Award,
  Sparkles,
  X,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import SubmissionHistory from '../components/SubmissionHistory';
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import Notes from '../components/Notes';
import Discussions from '../components/Discussions';

// Map our internal language keys -> the casing the backend stores
// startCode.referenceSolution under (C++/Java/JavaScript).
const LANG_DISPLAY = {
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
};
const LANGS = ['javascript', 'java', 'cpp'];

const LEFT_TABS = [
  { id: 'description', label: 'Description', icon: FileCode2 },
  { id: 'editorial', label: 'Editorial', icon: Video },
  { id: 'solutions', label: 'Solutions', icon: Lightbulb },
  { id: 'submissions', label: 'Submissions', icon: History },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'discussions', label: 'Discussions', icon: MessagesSquare },
  { id: 'chatAI', label: 'ChatAI', icon: MessageSquare },
];

const RIGHT_TABS = [
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'testcase', label: 'Testcase', icon: Terminal },
  { id: 'result', label: 'Result', icon: CheckCircle2 },
];

// --- localStorage autosave helpers ------------------------------------------
// Keyed by problemId + language so switching problems or languages restores
// the right draft. We never persist over a freshly fetched template unless
// the user actually edited it.
const autosaveKey = (problemId, lang) => `14dev:code:${problemId}:${lang}`;

const loadDraft = (problemId, lang) => {
  try {
    return localStorage.getItem(autosaveKey(problemId, lang)) || null;
  } catch {
    return null; // localStorage may be unavailable (private mode, etc.)
  }
};

const saveDraft = (problemId, lang, code) => {
  try {
    localStorage.setItem(autosaveKey(problemId, lang), code);
  } catch {
    // ignore quota / availability errors — autosave is best-effort
  }
};

const clearDraft = (problemId, lang) => {
  try {
    localStorage.removeItem(autosaveKey(problemId, lang));
  } catch {
    // ignore
  }
};

// --- Keyboard shortcut helper ------------------------------------------------
// Returns true if the event matches Cmd on macOS or Ctrl elsewhere.
const isModifier = (e) => e.metaKey || e.ctrlKey;

const ProblemPage = () => {
  const { problemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contestId = searchParams.get('contestId');
  const isVirtualContest = searchParams.get('virtual') === 'true';

  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileView, setMobileView] = useState('description'); // 'description' | 'code'
  const [lastSaved, setLastSaved] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('14dev:editor:fontSize')) || 13);
  const [minimap, setMinimap] = useState(() => localStorage.getItem('14dev:editor:minimap') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [awardedBadges, setAwardedBadges] = useState([]);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);

  const editorRef = useRef(null);
  const leftPanelRef = useRef(null);
  const runAbortRef = useRef(null);

  const handleResetCode = useCallback(() => {
    if (!problem) return;
    const startCodeObj = problem.startCode?.find(
      (sc) => sc.language === LANG_DISPLAY[selectedLanguage]
    );
    const initial = startCodeObj?.initialCode || '';
    setCode(initial);
    clearDraft(problemId, selectedLanguage);
    setShowResetConfirm(false);
  }, [problem, problemId, selectedLanguage]);

  const updateFontSize = useCallback((size) => {
    setFontSize(size);
    try { localStorage.setItem('14dev:editor:fontSize', String(size)); } catch {}
  }, []);

  const toggleMinimap = useCallback(() => {
    setMinimap((prev) => {
      const next = !prev;
      try { localStorage.setItem('14dev:editor:minimap', String(next)); } catch {}
      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // Fetch problem on problemId change.
  // Restores any autosaved draft for the default language; falls back to
  // the problem's startCode template if no draft exists.
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const fetchProblem = async () => {
      setInitialLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        if (cancelled) return;
        setProblem(response.data);
        // Batch H: sync bookmark/favorite state from the backend response
        // (getProblemById now includes isBookmarked + isFavorite fields).
        setIsBookmarked(!!response.data.isBookmarked);
        setIsFavorite(!!response.data.isFavorite);

        const draft = loadDraft(problemId, 'javascript');
        if (draft != null) {
          setCode(draft);
        } else {
          const startCode = response.data.startCode?.find(
            (sc) => sc.language === LANG_DISPLAY['javascript']
          );
          setCode(startCode?.initialCode || '');
        }
      } catch (error) {
        console.error('Error fetching problem:', error);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };
    fetchProblem();
    return () => {
      cancelled = true;
    };
  }, [problemId]);

  // ------------------------------------------------------------------
  // On language switch: try to restore a draft for that language,
  // otherwise fall back to the problem's startCode template.
  // The previous language's code has already been autosaved by the
  // editor's onChange handler (debounced via saveDraft calls).
  // ------------------------------------------------------------------
  const handleLanguageChange = useCallback(
    (lang) => {
      if (!problem) return;

      const draft = loadDraft(problemId, lang);
      if (draft != null) {
        setCode(draft);
      } else {
        const startCode = problem.startCode?.find(
          (sc) => sc.language === LANG_DISPLAY[lang]
        );
        setCode(startCode?.initialCode || '');
      }
      setSelectedLanguage(lang);
    },
    [problem, problemId]
  );

  // ------------------------------------------------------------------
  // Editor change handler — also persists to localStorage (autosave).
  // We don't debounce here because localStorage writes are cheap and
  // synchronous-ish; the cost is negligible vs. the simplicity benefit.
  // ------------------------------------------------------------------
  const handleEditorChange = useCallback(
    (value) => {
      const next = value || '';
      setCode(next);
      saveDraft(problemId, selectedLanguage, next);
      setLastSaved(new Date());
    },
    [problemId, selectedLanguage]
  );

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    // Define a custom dark theme that matches our app palette.
    monaco.editor.defineTheme('14dev-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0a0b',
        'editor.foreground': '#e4e4e7',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editor.selectionBackground': '#264f7855',
        'editor.lineHighlightBackground': '#18181b',
        'editorCursor.foreground': '#3b82f6',
        'editorWidget.background': '#131316',
        'editorWidget.border': '#27272a',
        'editorSuggestWidget.background': '#131316',
        'editorSuggestWidget.selectedBackground': '#27272a',
        'scrollbarSlider.background': '#27272a55',
        'scrollbarSlider.hoverBackground': '#3f3f46',
      },
    });
    monaco.editor.setTheme('14dev-dark');
  }, []);

  // ------------------------------------------------------------------
  // Run code — identical API contract to the original.
  // POST /submission/run/:id  { code, language }
  // ------------------------------------------------------------------
  const handleRun = useCallback(async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage,
      });
      setRunResult(response.data);
      setActiveRightTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({ success: false, error: 'Internal server error' });
      setActiveRightTab('testcase');
    } finally {
      setLoading(false);
    }
  }, [code, problemId, selectedLanguage]);

  // ------------------------------------------------------------------
  // Submit code — async 202 Accepted + status polling pipeline.
  // POST /submission/submit/:id  -> 202 { submissionId, status: "pending" }
  // GET  /submission/status/:id  -> poll until status !== "pending"
  // ------------------------------------------------------------------
  useEffect(() => {
    return () => {
      runAbortRef.current?.abort();
    };
  }, []);

  const handleSubmitCode = useCallback(async () => {
    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    setLoading(true);
    setActiveRightTab('result');
    setSubmitResult({ status: 'pending' });

    try {
      const response = await axiosClient.post(
        `/submission/submit/${problemId}`,
        { code, language: selectedLanguage },
        { signal: controller.signal }
      );

      let finalResult = response.data;

      // Async path: poll GET /submission/status/:submissionId until judge finishes
      if (finalResult?.status === 'pending' && finalResult?.submissionId) {
        const submissionId = finalResult.submissionId;
        const deadline = Date.now() + 65_000;

        while (Date.now() < deadline) {
          if (controller.signal.aborted) return;
          await new Promise((resolve) => setTimeout(resolve, 800));
          if (controller.signal.aborted) return;

          const statusRes = await axiosClient.get(
            `/submission/status/${submissionId}`,
            { signal: controller.signal }
          );
          if (statusRes.data?.status !== 'pending') {
            finalResult = statusRes.data;
            break;
          }
        }

        if (finalResult?.status === 'pending') {
          finalResult = {
            accepted: false,
            status: 'error',
            error: 'Judging timed out. Check Submissions tab shortly.',
            passedTestCases: 0,
            totalTestCases: finalResult.totalTestCases || 0,
            runtime: 0,
            memory: 0,
          };
        }
      }

      if (controller.signal.aborted) return;

      setSubmitResult(finalResult);
      if (finalResult?.accepted) {
        clearDraft(problemId, selectedLanguage);
        if (
          Array.isArray(finalResult?.newlyAwardedBadges) &&
          finalResult.newlyAwardedBadges.length > 0
        ) {
          setAwardedBadges(finalResult.newlyAwardedBadges);
        }
      }
    } catch (error) {
      if (controller.signal.aborted || error?.code === 'ERR_CANCELED') return;
      console.error('Error submitting code:', error);
      const errMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Submission failed. Please try again.';
      setSubmitResult({
        accepted: false,
        status: 'error',
        error: errMsg,
        passedTestCases: 0,
        totalTestCases: 0,
        runtime: 0,
        memory: 0,
      });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [code, problemId, selectedLanguage]);

  // ------------------------------------------------------------------
  // Fullscreen editor toggle — collapses the left description panel
  // to its minimum size so the editor takes the full width.
  // ------------------------------------------------------------------
  const toggleFullscreen = useCallback(() => {
    if (!leftPanelRef.current) return;
    if (!isFullscreen) {
      leftPanelRef.current.collapse();
      setIsFullscreen(true);
    } else {
      leftPanelRef.current.expand();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // ------------------------------------------------------------------
  // Manual save (Alt+S) — forces a localStorage write + flash indicator.
  // ------------------------------------------------------------------
  const handleManualSave = useCallback(() => {
    saveDraft(problemId, selectedLanguage, code);
    setLastSaved(new Date());
  }, [problemId, selectedLanguage, code]);

  // ------------------------------------------------------------------
  // Batch H: Bookmark + Favorite toggle handlers.
  // Calls the engagement endpoints; updates local state immediately for
  // responsive UI, reconciles with the server response.
  // ------------------------------------------------------------------
  const handleToggleBookmark = useCallback(async () => {
    // Optimistic update for instant feedback
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      await axiosClient.post(`/user/bookmark/${problemId}`);
    } catch (err) {
      // Revert on failure
      setIsBookmarked(!next);
      console.error('Bookmark toggle failed:', err);
    }
  }, [isBookmarked, problemId]);

  const handleToggleFavorite = useCallback(async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await axiosClient.post(`/user/favorite/${problemId}`);
    } catch (err) {
      setIsFavorite(!next);
      console.error('Favorite toggle failed:', err);
    }
  }, [isFavorite, problemId]);

  // ------------------------------------------------------------------
  // Keyboard shortcuts (registered on window so they work even when
  // focus is outside the Monaco editor — e.g. on the description).
  //   Ctrl/Cmd + Enter           -> submit
  //   Ctrl/Cmd + Shift + Enter   -> run   (also Alt+R)
  //   Alt + R                    -> run
  //   Alt + F                    -> toggle fullscreen editor
  //   Alt + S                    -> manual save
  //   Alt + 1..5                 -> switch left tabs
  //   Alt + Q / W / E            -> switch right tabs (code/testcase/result)
  //   Esc                        -> exit fullscreen
  // We deliberately do NOT hijack Ctrl+S (browser save) because that's
  // jarring; Alt+S is the manual-save chord.
  // ------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      // Submit: Ctrl/Cmd + Enter
      if (isModifier(e) && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitCode();
        return;
      }
      // Run: Ctrl/Cmd + Shift + Enter  OR  Alt+R
      if ((isModifier(e) && e.key === 'Enter' && e.shiftKey) || (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        handleRun();
        return;
      }
      // Alt-based shortcuts (no Ctrl/Cmd to avoid clashing with browser)
      if (e.altKey && !isModifier(e)) {
        const k = e.key.toLowerCase();
        if (k === 'f') { e.preventDefault(); toggleFullscreen(); return; }
        if (k === 's') { e.preventDefault(); handleManualSave(); return; }
        if (k === 'q') { e.preventDefault(); setActiveRightTab('code'); return; }
        if (k === 'w') { e.preventDefault(); setActiveRightTab('testcase'); return; }
        if (k === 'e') { e.preventDefault(); setActiveRightTab('result'); return; }
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= LEFT_TABS.length) {
          e.preventDefault();
          setActiveLeftTab(LEFT_TABS[num - 1].id);
          return;
        }
      }
      // Esc exits fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSubmitCode, handleRun, toggleFullscreen, handleManualSave, isFullscreen]);

  // ------------------------------------------------------------------
  // Monaco language id mapping (unchanged from original)
  // ------------------------------------------------------------------
  const getLanguageForMonaco = useCallback((lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  }, []);

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-400';
      case 'medium': return 'text-amber-400';
      case 'hard': return 'text-rose-400';
      default: return 'text-zinc-400';
    }
  }, []);

  // ------------------------------------------------------------------
  // Top bar — back button + problem title + difficulty + autosave status
  // ------------------------------------------------------------------
  const TopBar = useMemo(() => {
    if (!problem) return null;
    return (
      <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-[#131316]">
        <button
          onClick={() =>
            contestId
              ? navigate(`/contests/${contestId}${isVirtualContest ? '?virtual=true' : ''}`)
              : navigate('/problems')
          }
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-1 text-xs"
          aria-label={contestId ? 'Back to contest arena' : 'Back to problems'}
          title={contestId ? 'Back to contest arena' : 'Back to problems'}
        >
          <ChevronLeft size={18} />
          {contestId && <span className="hidden sm:inline font-medium text-amber-300">Arena</span>}
        </button>
        {contestId && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">
            {isVirtualContest ? 'Virtual Contest' : 'Live Contest'}
          </span>
        )}
        <h1 className="text-sm font-medium text-zinc-100 truncate flex-1">
          {problem.title}
        </h1>
        <span className={`text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
          {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
        </span>
        <span className="text-xs text-zinc-500">·</span>
        <span className="text-xs text-zinc-400">{problem.tags}</span>

        {/* Batch H: bookmark + favorite toggles */}
        <button
          onClick={handleToggleBookmark}
          className={`p-1.5 rounded hover:bg-zinc-800 ${isBookmarked ? 'text-yellow-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
          title={isBookmarked ? 'Bookmarked' : 'Bookmark'}
        >
          <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleToggleFavorite}
          className={`p-1.5 rounded hover:bg-zinc-800 ${isFavorite ? 'text-rose-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          aria-label={isFavorite ? 'Remove favorite' : 'Add to favorites'}
          title={isFavorite ? 'Favorited' : 'Favorite'}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {lastSaved && (
          <span className="text-xs text-zinc-500 hidden sm:inline">
            <Save size={11} className="inline mr-1" />
            {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  }, [problem, navigate, contestId, isVirtualContest, getDifficultyColor, lastSaved, isBookmarked, isFavorite, handleToggleBookmark, handleToggleFavorite]);

  // ------------------------------------------------------------------
  // Left tab strip
  // ------------------------------------------------------------------
  const LeftTabStrip = useMemo(() => (
    <div className="tab-strip">
      {LEFT_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`tab-pill ${activeLeftTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveLeftTab(tab.id)}
          >
            <Icon size={13} className="inline mr-1.5 -mt-0.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  ), [activeLeftTab]);

  // ------------------------------------------------------------------
  // Left content — switches based on activeLeftTab.
  // Wraps each panel in AnimatePresence for a subtle fade.
  // ------------------------------------------------------------------
  const LeftContent = useMemo(() => {
    if (!problem) return null;
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLeftTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {activeLeftTab === 'description' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-zinc-100">{problem.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded border border-current ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">{problem.tags}</span>
                </div>
                <div className="problem-description whitespace-pre-wrap">
                  {problem.description}
                </div>
                {problem.visibleTestCases?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3">Examples</h3>
                    <div className="space-y-3">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className="rounded-lg border border-zinc-800 bg-[#131316] p-4">
                          <div className="text-xs font-medium text-zinc-400 mb-2">Example {index + 1}</div>
                          <div className="space-y-1.5 text-xs font-mono">
                            <div><span className="text-zinc-500">Input:</span> <span className="text-zinc-200">{example.input}</span></div>
                            <div><span className="text-zinc-500">Output:</span> <span className="text-zinc-200">{example.output}</span></div>
                            <div><span className="text-zinc-500">Explanation:</span> <span className="text-zinc-300">{example.explanation}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Batch H: Related Problems (same tag) */}
                {problem.relatedProblems?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-1.5">
                      <Link2 size={13} />
                      Related Problems
                    </h3>
                    <div className="space-y-1.5">
                      {problem.relatedProblems.map((rp) => (
                        <NavLink
                          key={rp._id}
                          to={`/problem/${rp._id}`}
                          className="flex items-center justify-between gap-2 p-2 rounded hover:bg-zinc-800/40 transition-colors border border-transparent hover:border-zinc-700"
                        >
                          <span className="text-sm text-zinc-200 truncate">{rp.title}</span>
                          <span className={`text-[10px] ${
                            rp.difficulty === 'easy' ? 'text-emerald-400'
                              : rp.difficulty === 'medium' ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}>
                            {rp.difficulty}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeLeftTab === 'editorial' && (
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-4">Editorial</h2>
                <Editorial
                  secureUrl={problem.secureUrl}
                  thumbnailUrl={problem.thumbnailUrl}
                  duration={problem.duration}
                />
              </div>
            )}

            {activeLeftTab === "solutions" && (
  <div className="space-y-5">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">
          Solutions
        </h2>

        <p className="text-sm text-zinc-500 mt-1">
          Reference implementations for this problem
        </p>
      </div>

      {problem.referenceSolution?.length > 0 && (
        <div className="px-3 py-1 rounded-full border border-zinc-800 bg-[#131316] text-xs text-zinc-400">
          {problem.referenceSolution.length} Solution
          {problem.referenceSolution.length > 1 ? "s" : ""}
        </div>
      )}
    </div>

    {/* Solutions */}
    {problem.referenceSolution?.length > 0 ? (
      <div className="space-y-5">
        {problem.referenceSolution.map(
          (solution, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0f0f11]"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#131316]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-100">
                    {solution?.language}
                  </span>

                  <span className="text-xs text-zinc-500">
                    Solution #{index + 1}
                  </span>
                </div>

                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      solution?.completeCode || ""
                    )
                  }
                  className="btn-secondary"
                >
                  Copy Code
                </button>
              </div>

              {/* Code */}
              <pre className="overflow-x-auto p-5 text-sm bg-[#0a0a0b]">
                <code className="text-zinc-200 font-mono whitespace-pre">
                  {solution?.completeCode}
                </code>
              </pre>
            </div>
          )
        )}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-zinc-800 bg-[#0f0f11]">
        <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
          💡
        </div>

        <h3 className="text-zinc-300 font-medium">
          No Solutions Available
        </h3>

        <p className="text-zinc-500 text-sm mt-2 text-center max-w-md">
          Solutions will appear here after they are added
          by the problem creator.
        </p>
      </div>
    )}
  </div>
)}

            {activeLeftTab === 'submissions' && (
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-4">My Submissions</h2>
                <SubmissionHistory problemId={problemId} />
              </div>
            )}

            {activeLeftTab === 'chatAI' && (
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-4">Chat with AI</h2>
                <ChatAi problem={problem} />
              </div>
            )}

            {activeLeftTab === 'notes' && (
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-4">My Notes</h2>
                <Notes problemId={problemId} />
              </div>
            )}

            {activeLeftTab === 'discussions' && (
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-4">Discussions</h2>
                <Discussions problemId={problemId} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }, [problem, activeLeftTab, problemId, getDifficultyColor]);

  // ------------------------------------------------------------------
  // Editor panel (right side) — language selector, Monaco, action bar
  // ------------------------------------------------------------------
  const EditorPanel = useMemo(() => (
    <div className="h-full flex flex-col min-h-0">
      {/* Language selector + fullscreen toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-[#131316]">
        <div className="flex gap-1">
          {LANGS.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                selectedLanguage === lang
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {LANG_DISPLAY[lang]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 relative">
          {/* Reset Code Button */}
          <div className="relative">
            <button
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Reset code to starter template"
              aria-label="Reset code"
            >
              <RotateCcw size={14} />
            </button>
            {showResetConfirm && (
              <div className="absolute right-0 top-full mt-2 w-52 p-3 surface-elevated rounded-lg shadow-xl z-50 border border-[var(--border-default)]">
                <p className="text-[12px] text-[var(--text-secondary)] mb-2.5">
                  Reset code to initial template? All changes in this draft will be lost.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetCode}
                    className="px-2 py-1 text-[11px] rounded bg-rose-600 hover:bg-rose-500 text-white font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Editor Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Editor Settings"
              aria-label="Editor settings"
            >
              <Settings2 size={14} />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-48 p-3 surface-elevated rounded-lg shadow-xl z-50 border border-[var(--border-default)]">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Editor Settings
                </div>
                <div className="space-y-2.5 text-[12px]">
                  <div>
                    <label className="text-zinc-400 block mb-1">Font Size</label>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono">
                      {[12, 13, 14, 16].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => updateFontSize(sz)}
                          className={`py-1 rounded text-xs transition-colors ${
                            fontSize === sz ? 'bg-[var(--accent)] text-white font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span className="text-zinc-300">Minimap</span>
                    <button
                      onClick={toggleMinimap}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        minimap ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {minimap ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleManualSave}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Save (Alt+S)"
            aria-label="Save code"
          >
            <Save size={14} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Toggle fullscreen editor (Alt+F)"
            aria-label="Toggle fullscreen editor"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Monaco */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={getLanguageForMonaco(selectedLanguage)}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: fontSize,
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Consolas, monospace',
            fontLigatures: true,
            minimap: { enabled: minimap },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 12,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            cursorBlinking: 'smooth',
            mouseWheelZoom: true,
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
        />
      </div>

      {/* Action bar — Run / Submit */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 bg-[#131316]">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">⌘/Ctrl+↵</kbd> submit
          </span>
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">⌘/Ctrl+⇧+↵</kbd> run
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Run
          </button>
          <button
            onClick={handleSubmitCode}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Submit
          </button>
        </div>
      </div>
    </div>
  ), [
    selectedLanguage, code, loading, isFullscreen, fontSize, minimap,
    showSettings, showResetConfirm, handleResetCode, updateFontSize, toggleMinimap,
    handleLanguageChange, handleEditorChange, handleEditorDidMount,
    handleRun, handleSubmitCode, handleManualSave, toggleFullscreen,
    getLanguageForMonaco,
  ]);

  // ------------------------------------------------------------------
  // Right tab strip (code/testcase/result)
  // ------------------------------------------------------------------
  const RightTabStrip = useMemo(() => (
    <div className="tab-strip">
      {RIGHT_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`tab-pill ${activeRightTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveRightTab(tab.id)}
          >
            <Icon size={13} className="inline mr-1.5 -mt-0.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  ), [activeRightTab]);

  // ------------------------------------------------------------------
  // Console panel — shown when activeRightTab is 'testcase' or 'result'.
  // Rendered as a horizontally-resizable bottom panel under the editor
  // (LeetCode's console layout).
  // ------------------------------------------------------------------
  const ConsolePanel = useMemo(() => {
    if (activeRightTab === 'code') return null;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRightTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="h-full overflow-y-auto p-4"
        >
          {activeRightTab === 'testcase' && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Test Results
              </h3>
              {runResult ? (
                <div className={`rounded-lg border p-3 mb-3 ${
                  runResult.success
                    ? 'border-emerald-700/50 bg-emerald-950/20'
                    : 'border-rose-700/50 bg-rose-950/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {runResult.success
                      ? <CheckCircle2 size={16} className="text-emerald-400" />
                      : <XCircle size={16} className="text-rose-400" />}
                    <span className={`text-sm font-medium ${runResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {runResult.success ? 'All test cases passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {runResult.runtime} sec
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MemoryStick size={11} /> {runResult.memory} KB
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic">
                  Click "Run" to test your code with the example test cases.
                </div>
              )}

              {runResult?.testCases?.length > 0 ? (
                <div className="space-y-3">
                  {/* Case selection tabs */}
                  <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2 overflow-x-auto">
                    {runResult.testCases.map((tc, i) => {
                      const passed = tc.status_id === 3;
                      const isSelected = selectedTestCaseIdx === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedTestCaseIdx(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all flex-shrink-0 ${
                            isSelected
                              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${passed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          Case {i + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active case diff view */}
                  {(() => {
                    const tc = runResult.testCases[selectedTestCaseIdx] || runResult.testCases[0];
                    if (!tc) return null;
                    const passed = tc.status_id === 3;
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            passed
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          }`}>
                            {passed ? '✓ Test Case Passed' : '✗ Output Mismatch'}
                          </span>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Input</div>
                          <pre className="p-2.5 rounded-lg bg-[#0e0f12] border border-zinc-800 text-xs font-mono text-zinc-200 overflow-x-auto">
                            {tc.stdin || 'None'}
                          </pre>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-1">Expected Output</div>
                            <pre className="p-2.5 rounded-lg bg-emerald-950/10 border border-emerald-900/40 text-xs font-mono text-emerald-300 overflow-x-auto">
                              {tc.expected_output}
                            </pre>
                          </div>
                          <div>
                            <div className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                              Your Output
                            </div>
                            <pre className={`p-2.5 rounded-lg text-xs font-mono overflow-x-auto border ${
                              passed
                                ? 'bg-emerald-950/10 border-emerald-900/40 text-emerald-300'
                                : 'bg-rose-950/20 border-rose-900/50 text-rose-300'
                            }`}>
                              {tc.stdout || '(empty)'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Submission Result
              </h3>
              {submitResult?.status === 'pending' ? (
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/15 p-5 flex items-center gap-3">
                  <Loader2 size={20} className="animate-spin text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-blue-300">
                      Evaluating submission…
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Running against hidden test cases in the background worker queue.
                    </div>
                  </div>
                </div>
              ) : submitResult ? (
                <div className={`rounded-xl border p-5 ${
                  submitResult.accepted
                    ? 'border-emerald-600/40 bg-gradient-to-br from-emerald-950/20 to-[#131316]'
                    : 'border-rose-600/40 bg-gradient-to-br from-rose-950/20 to-[#131316]'
                }`}>
                  <div className="flex items-center gap-2.5 mb-4">
                    {submitResult.accepted
                      ? <CheckCircle2 size={22} className="text-emerald-400" />
                      : <XCircle size={22} className="text-rose-400" />}
                    <div>
                      <span className={`text-base font-bold ${submitResult.accepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {submitResult.accepted ? 'Accepted' : (submitResult.error || 'Wrong Answer')}
                      </span>
                      <div className="text-[11px] text-zinc-400">
                        {submitResult.passedTestCases} of {submitResult.totalTestCases} test cases passed
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-1">
                    <div className="rounded-lg border border-zinc-800 bg-[#0e0f12] p-3">
                      <div className="text-zinc-500 mb-0.5">Runtime</div>
                      <div className="text-zinc-100 font-mono font-semibold text-sm">{submitResult.runtime}s</div>
                      {submitResult.accepted && (
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          {submitResult.runtimePercentile != null
                            ? `Beats ${submitResult.runtimePercentile}%`
                            : 'Benchmark recorded'}
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-[#0e0f12] p-3">
                      <div className="text-zinc-500 mb-0.5">Memory</div>
                      <div className="text-zinc-100 font-mono font-semibold text-sm">{submitResult.memory} KB</div>
                      {submitResult.accepted && (
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {submitResult.memoryPercentile != null
                            ? `Beats ${submitResult.memoryPercentile}%`
                            : 'Benchmark recorded'}
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-[#0e0f12] p-3 col-span-2 sm:col-span-1">
                      <div className="text-zinc-500 mb-0.5">Language</div>
                      <div className="text-zinc-100 font-mono font-semibold text-sm">{selectedLanguage}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Standard runtime</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic">
                  Click "Submit" to submit your solution for evaluation.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }, [activeRightTab, runResult, submitResult, selectedTestCaseIdx, selectedLanguage]);

  // ------------------------------------------------------------------
  // Loading spinner (initial fetch)
  // ------------------------------------------------------------------
  if (initialLoading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0b]">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Mobile view: stacked, tab-switched (no resizable panels — they
  // don't work well on touch and would force horizontal scrolling).
  // ------------------------------------------------------------------
  const MobileView = (
    <div className="mobile-only flex-col h-screen bg-[#0a0a0b]" style={{ display: 'none' }}>
      {TopBar}
      <div className="flex border-b border-zinc-800 bg-[#131316]">
        <button
          onClick={() => setMobileView('description')}
          className={`flex-1 py-2 text-xs font-medium ${mobileView === 'description' ? 'text-zinc-100 border-b-2 border-blue-500' : 'text-zinc-500'}`}
        >
          Problem
        </button>
        <button
          onClick={() => setMobileView('code')}
          className={`flex-1 py-2 text-xs font-medium ${mobileView === 'code' ? 'text-zinc-100 border-b-2 border-blue-500' : 'text-zinc-500'}`}
        >
          Code
        </button>
      </div>

      {mobileView === 'description' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {LeftTabStrip}
          <div className="flex-1 overflow-y-auto">{LeftContent}</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {RightTabStrip}
          <div className="flex-1 min-h-0">{EditorPanel}</div>
          {ConsolePanel && (
            <div className="h-48 border-t border-zinc-800 overflow-y-auto">
              {ConsolePanel}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ------------------------------------------------------------------
  // Desktop view: resizable 2-column split with a bottom console panel
  // on the right side.
  // ------------------------------------------------------------------
  const DesktopView = (
    <div className="desktop-only h-screen flex flex-col bg-[#0a0a0b]">
      {TopBar}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          <Panel ref={leftPanelRef} collapsible minSize={20} defaultSize={50}>
            <div className="flex flex-col h-full">
              {LeftTabStrip}
              {LeftContent}
            </div>
          </Panel>
          <PanelResizeHandle />
          <Panel minSize={30} defaultSize={50}>
            <div className="flex flex-col h-full">
              {RightTabStrip}
              <PanelGroup direction="vertical">
                <Panel order={1} defaultSize={60} minSize={30}>
                  {EditorPanel}
                </Panel>
                {activeRightTab !== 'code' && (
                  <>
                    <PanelResizeHandle />
                    <Panel order={2} defaultSize={30} minSize={10}>
                      <div className="h-full bg-[#0a0a0b]">{ConsolePanel}</div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );

  // Badge unlock celebration modal
  const BadgeModal = (
    <AnimatePresence>
      {awardedBadges.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="surface-elevated border border-[var(--border-strong)] rounded-2xl max-w-sm w-full p-6 text-center relative shadow-2xl overflow-hidden"
          >
            {/* Ambient gold glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={() => setAwardedBadges([])}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-md"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-600/30 border border-yellow-500/40 flex items-center justify-center mx-auto mb-4 text-yellow-400 shadow-lg">
              <Award size={36} className="animate-bounce" />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-1">
              <Sparkles size={13} />
              Badge Unlocked!
            </div>

            {awardedBadges.map((badge, idx) => (
              <div key={idx} className="my-3">
                <h3 className="text-xl font-bold text-white mb-1">{badge.name}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{badge.description}</p>
                <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                  {badge.tier || "Bronze"} Tier
                </div>
              </div>
            ))}

            <button
              onClick={() => setAwardedBadges([])}
              className="btn-primary w-full mt-4 !py-2.5 text-sm"
            >
              Awesome, keep going!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // The mobile-only / desktop-only classes are toggled by the CSS media
  // queries in index.css. We render both so the transition is instant
  // when the viewport crosses 768px.
  return (
    <div data-theme="dark" className="h-screen">
      {MobileView}
      {DesktopView}
      {BadgeModal}
    </div>
  );
};

export default ProblemPage;
