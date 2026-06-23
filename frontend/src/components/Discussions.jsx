import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import {
  MessageSquare,
  ChevronUp,
  Plus,
  Loader2,
  Send,
  Trash2,
  ArrowLeft,
  MessagesSquare,
  Pin,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Batch J: Discussions component — used in the ProblemPage left panel.
//
// Props: problemId
//
// Three sub-views:
//   1. List view (default) — shows all discussions for this problem
//   2. Detail view — shows one discussion + its comments
//   3. Create view — form to create a new discussion
//
// Uses /discussion endpoints. All calls require auth (userMiddleware).
// ---------------------------------------------------------------------------

const Discussions = ({ problemId }) => {
  // Bug #9 fix: get the current user's ID so we can check ownership before
  // showing the delete button. The old code had a tautology
  // (d.userId?._id === d.userId?._id) that showed delete for everyone.
  const currentUserId = useSelector((state) => state.auth?.user?._id);
  const [view, setView] = useState("list"); // 'list' | 'detail' | 'create'
  const [discussions, setDiscussions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("problem");
  const [creating, setCreating] = useState(false);
  // New comment state (per detail view)
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  // ------------------------------------------------------------------
  // Fetch discussions list
  // ------------------------------------------------------------------
  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/discussion/${problemId}?limit=20`);
      setDiscussions(data.discussions || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load discussions");
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  // ------------------------------------------------------------------
  // Fetch single discussion with comments
  // ------------------------------------------------------------------
  const fetchDiscussion = useCallback(async (discussionId) => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/discussion/${problemId}/${discussionId}`);
      setSelectedDiscussion(data.discussion);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load discussion");
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  // ------------------------------------------------------------------
  // Create discussion
  // ------------------------------------------------------------------
  const handleCreate = useCallback(async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      setCreating(true);
      await axiosClient.post(`/discussion/${problemId}`, {
        title: newTitle,
        content: newContent,
        type: newType,
      });
      setNewTitle("");
      setNewContent("");
      setNewType("problem");
      setView("list");
      fetchDiscussions();
    } catch (err) {
      console.error("Create discussion error:", err);
    } finally {
      setCreating(false);
    }
  }, [newTitle, newContent, newType, problemId, fetchDiscussions]);

  // ------------------------------------------------------------------
  // Toggle discussion upvote (optimistic)
  // ------------------------------------------------------------------
  const handleToggleDiscussionUpvote = useCallback(async (discussionId, currentlyUpvoted) => {
    // Optimistic update on list
    setDiscussions((prev) =>
      prev.map((d) =>
        d._id === discussionId
          ? {
              ...d,
              hasUpvoted: !currentlyUpvoted,
              upvoteCount: d.upvoteCount + (currentlyUpvoted ? -1 : 1),
            }
          : d
      )
    );
    // Also update detail view if it's the same discussion
    setSelectedDiscussion((prev) =>
      prev && prev._id === discussionId
        ? {
            ...prev,
            hasUpvoted: !currentlyUpvoted,
            upvoteCount: prev.upvoteCount + (currentlyUpvoted ? -1 : 1),
          }
        : prev
    );
    try {
      await axiosClient.post(`/discussion/${discussionId}/upvote`);
    } catch (err) {
      // Revert on failure
      setDiscussions((prev) =>
        prev.map((d) =>
          d._id === discussionId
            ? {
                ...d,
                hasUpvoted: currentlyUpvoted,
                upvoteCount: d.upvoteCount + (currentlyUpvoted ? 1 : -1),
              }
            : d
        )
      );
    }
  }, []);

  // ------------------------------------------------------------------
  // Add comment
  // ------------------------------------------------------------------
  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !selectedDiscussion) return;
    try {
      setCommenting(true);
      const { data } = await axiosClient.post(
        `/discussion/${selectedDiscussion._id}/comment`,
        { content: newComment }
      );
      setSelectedDiscussion((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), data.comment],
        commentCount: data.commentCount,
      }));
      setNewComment("");
    } catch (err) {
      console.error("Add comment error:", err);
    } finally {
      setCommenting(false);
    }
  }, [newComment, selectedDiscussion]);

  // ------------------------------------------------------------------
  // Toggle comment upvote
  // ------------------------------------------------------------------
  const handleToggleCommentUpvote = useCallback(async (commentId, currentlyUpvoted) => {
    setSelectedDiscussion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === commentId
            ? {
                ...c,
                hasUpvoted: !currentlyUpvoted,
                upvoteCount: (c.upvoteCount || 0) + (currentlyUpvoted ? -1 : 1),
              }
            : c
        ),
      };
    });
    try {
      await axiosClient.post(
        `/discussion/${selectedDiscussion._id}/comment/${commentId}/upvote`
      );
    } catch (err) {
      // Revert
      setSelectedDiscussion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  hasUpvoted: currentlyUpvoted,
                  upvoteCount: (c.upvoteCount || 0) + (currentlyUpvoted ? 1 : -1),
                }
              : c
          ),
        };
      });
    }
  }, [selectedDiscussion]);

  // ------------------------------------------------------------------
  // Delete discussion (own only)
  // ------------------------------------------------------------------
  const handleDeleteDiscussion = useCallback(async (discussionId) => {
    if (!window.confirm("Delete this discussion?")) return;
    try {
      await axiosClient.delete(`/discussion/${discussionId}`);
      setView("list");
      setSelectedDiscussion(null);
      fetchDiscussions();
    } catch (err) {
      console.error("Delete discussion error:", err);
    }
  }, [fetchDiscussions]);

  // ------------------------------------------------------------------
  // Loading + error states
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={20} className="animate-spin text-zinc-500" />
      </div>
    );
  }
  if (error) {
    return <div className="text-sm text-rose-400 py-4">{error}</div>;
  }

  // ====================================================================
  // CREATE VIEW
  // ====================================================================
  if (view === "create") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("list")}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-semibold text-zinc-100">New Discussion</h2>
        </div>

        <div className="space-y-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Discussion title..."
            className="w-full bg-[#131316] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600"
            maxLength={200}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="bg-[#131316] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
          >
            <option value="problem">Problem Discussion</option>
            <option value="editorial">Editorial Discussion</option>
          </select>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your discussion content..."
            className="w-full bg-[#131316] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600 resize-y min-h-[160px] font-mono"
            maxLength={20000}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setView("list")} className="btn-ide">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || !newContent.trim() || creating}
              className="btn-ide btn-ide-primary"
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Post Discussion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================
  // DETAIL VIEW
  // ====================================================================
  if (view === "detail" && selectedDiscussion) {
    const d = selectedDiscussion;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setView("list"); setSelectedDiscussion(null); }}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs text-zinc-500">Back to discussions</span>
        </div>

        {/* Discussion post */}
        <div className="rounded-lg border border-zinc-800 bg-[#131316] p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="text-lg font-semibold text-zinc-100">{d.title}</h2>
            {d.userId?._id === currentUserId && (
              <button
                onClick={() => handleDeleteDiscussion(d._id)}
                className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                title="Delete discussion"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-3">
            <span>by {d.userId?.firstName || "Unknown"}</span>
            <span>·</span>
            <span>{new Date(d.createdAt).toLocaleString()}</span>
            {d.type === "editorial" && (
              <span className="px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-400">editorial</span>
            )}
          </div>
          <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-mono mb-3">{d.content}</pre>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggleDiscussionUpvote(d._id, d.hasUpvoted)}
              className={`flex items-center gap-1 text-xs ${d.hasUpvoted ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <ChevronUp size={14} fill={d.hasUpvoted ? "currentColor" : "none"} />
              {d.upvoteCount || 0}
            </button>
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <MessageSquare size={12} />
              {d.commentCount || 0} comments
            </span>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Comments</h3>
          <div className="space-y-2 mb-4">
            {(d.comments || []).length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No comments yet. Be the first!</p>
            ) : (
              d.comments.map((c) => (
                <div key={c._id} className="rounded-lg border border-zinc-800 bg-[#131316] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400">{c.userId?.firstName || "Unknown"}</span>
                    <span className="text-[10px] text-zinc-600">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-mono mb-2">{c.content}</pre>
                  <button
                    onClick={() => handleToggleCommentUpvote(c._id, c.hasUpvoted)}
                    className={`flex items-center gap-1 text-xs ${c.hasUpvoted ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <ChevronUp size={11} fill={c.hasUpvoted ? "currentColor" : "none"} />
                    {c.upvoteCount || 0}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* New comment composer */}
          <div className="rounded-lg border border-zinc-800 bg-[#131316] p-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-y min-h-[60px] font-mono"
              rows={2}
            />
            <div className="flex justify-end mt-1">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || commenting}
                className="btn-ide btn-ide-primary"
              >
                {commenting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================
  // LIST VIEW (default)
  // ====================================================================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessagesSquare size={16} className="text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Discussions</h2>
          <span className="text-xs text-zinc-500">({pagination.total})</span>
        </div>
        <button
          onClick={() => setView("create")}
          className="btn-ide btn-ide-primary"
        >
          <Plus size={12} />
          New
        </button>
      </div>

      {discussions.length === 0 ? (
        <div className="text-center py-8">
          <MessagesSquare size={24} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No discussions yet.</p>
          <p className="text-xs text-zinc-600 mt-1">Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {discussions.map((d) => (
            <button
              key={d._id}
              onClick={() => { fetchDiscussion(d._id); setView("detail"); }}
              className="w-full text-left rounded-lg border border-zinc-800 bg-[#131316] p-3 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {d.pinned && <Pin size={11} className="text-amber-400" />}
                    <span className="text-sm font-medium text-zinc-100 truncate">{d.title}</span>
                    {d.type === "editorial" && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-purple-950/40 text-purple-400">editorial</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>by {d.userId?.firstName || "Unknown"}</span>
                    <span>·</span>
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  <span className={`flex items-center gap-1 ${d.hasUpvoted ? "text-blue-400" : "text-zinc-500"}`}>
                    <ChevronUp size={11} fill={d.hasUpvoted ? "currentColor" : "none"} />
                    {d.upvoteCount || 0}
                  </span>
                  <span className="flex items-center gap-1 text-zinc-500">
                    <MessageSquare size={11} />
                    {d.commentCount || 0}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discussions;
