import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate, NavLink } from 'react-router';
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
  const navigate = useNavigate();

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

  const editorRef = useRef(null);
  const leftPanelRef = useRef(null);
  const runAbortRef = useRef(null);

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
  // Submit code — identical API contract to the original.
  // POST /submission/submit/:id  { code, language }
  // After a successful ACCEPTED submission, clear the autosave draft so
  // the user gets the fresh template next time (LeetCode behavior).
  // ------------------------------------------------------------------
  const handleSubmitCode = useCallback(async () => {
    setLoading(true);
    setSubmitResult(null);
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code,
        language: selectedLanguage,
      });
      setSubmitResult(response.data);
      setActiveRightTab('result');
      if (response.data?.accepted) {
        clearDraft(problemId, selectedLanguage);
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setActiveRightTab('result');
    } finally {
      setLoading(false);
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
          onClick={() => navigate('/')}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          aria-label="Back to problems"
          title="Back to problems"
        >
          <ChevronLeft size={18} />
        </button>
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
  }, [problem, navigate, getDifficultyColor, lastSaved, isBookmarked, isFavorite, handleToggleBookmark, handleToggleFavorite]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSave}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            title="Save (Alt+S)"
            aria-label="Save code"
          >
            <Save size={14} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
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
            fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Consolas, monospace',
            fontLigatures: true,
            minimap: { enabled: false },
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
    selectedLanguage, code, loading, isFullscreen,
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

              {runResult?.testCases?.length > 0 && (
                <div className="space-y-2">
                  {runResult.testCases.map((tc, i) => (
                    <div key={i} className="rounded border border-zinc-800 bg-[#131316] p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-zinc-500">Case {i + 1}</span>
                        <span className={`text-xs ${tc.status_id === 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tc.status_id === 3 ? '✓ Passed' : '✗ Failed'}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs font-mono">
                        <div><span className="text-zinc-500">Input:</span> <span className="text-zinc-200">{tc.stdin}</span></div>
                        <div><span className="text-zinc-500">Expected:</span> <span className="text-zinc-200">{tc.expected_output}</span></div>
                        <div><span className="text-zinc-500">Output:</span> <span className="text-zinc-300">{tc.stdout || '(empty)'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Submission Result
              </h3>
              {submitResult ? (
                <div className={`rounded-lg border p-4 ${
                  submitResult.accepted
                    ? 'border-emerald-700/50 bg-emerald-950/20'
                    : 'border-rose-700/50 bg-rose-950/20'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {submitResult.accepted
                      ? <CheckCircle2 size={20} className="text-emerald-400" />
                      : <XCircle size={20} className="text-rose-400" />}
                    <span className={`text-base font-semibold ${submitResult.accepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {submitResult.accepted ? 'Accepted' : (submitResult.error || 'Wrong Answer')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded border border-zinc-800 bg-[#131316] p-2.5">
                      <div className="text-zinc-500 mb-0.5">Test Cases</div>
                      <div className="text-zinc-100 font-mono">
                        {submitResult.passedTestCases}/{submitResult.totalTestCases}
                      </div>
                    </div>
                    <div className="rounded border border-zinc-800 bg-[#131316] p-2.5">
                      <div className="text-zinc-500 mb-0.5">Runtime</div>
                      <div className="text-zinc-100 font-mono">{submitResult.runtime} sec</div>
                    </div>
                    <div className="rounded border border-zinc-800 bg-[#131316] p-2.5">
                      <div className="text-zinc-500 mb-0.5">Memory</div>
                      <div className="text-zinc-100 font-mono">{submitResult.memory} KB</div>
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
  }, [activeRightTab, runResult, submitResult]);

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

  // The mobile-only / desktop-only classes are toggled by the CSS media
  // queries in index.css. We render both so the transition is instant
  // when the viewport crosses 768px.
  return (
    <div data-theme="dark" className="h-screen">
      {MobileView}
      {DesktopView}
    </div>
  );
};

export default ProblemPage;
