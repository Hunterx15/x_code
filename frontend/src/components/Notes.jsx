import { useEffect, useState, useCallback } from "react";
import axiosClient from "../utils/axiosClient";
import { Plus, Trash2, Loader2, StickyNote, Edit3, X, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Notes — per-user, per-problem personal notes.
// Props: problemId
// Uses GET/POST/PUT/DELETE /user/notes/:problemId and /user/notes/:noteId
// ---------------------------------------------------------------------------

const Notes = ({ problemId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/user/notes/${problemId}`);
      setNotes(data.notes || []);
    } catch (err) {
      console.error("Notes fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = useCallback(async () => {
    if (!newNote.trim()) return;
    try {
      setSaving(true);
      const { data } = await axiosClient.post(`/user/notes/${problemId}`, {
        content: newNote,
      });
      setNotes((prev) => [data.note, ...prev]);
      setNewNote("");
    } catch (err) {
      console.error("Note create error:", err);
    } finally {
      setSaving(false);
    }
  }, [newNote, problemId]);

  const handleDelete = useCallback(async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await axiosClient.delete(`/user/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error("Note delete error:", err);
    }
  }, []);

  const handleUpdate = useCallback(async (noteId) => {
    if (!editingContent.trim()) return;
    try {
      const { data } = await axiosClient.put(`/user/notes/${noteId}`, {
        content: editingContent,
      });
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? data.note : n))
      );
      setEditingId(null);
      setEditingContent("");
    } catch (err) {
      console.error("Note update error:", err);
    }
  }, [editingContent]);

  const startEdit = (note) => {
    setEditingId(note._id);
    setEditingContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={20} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New note composer */}
      <div className="rounded-lg border border-zinc-800 bg-[#131316] p-3">
        <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400">
          <Plus size={14} />
          <span>Add a note</span>
        </div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write down your approach, edge cases, or insights..."
          className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-y min-h-[80px] font-mono"
          rows={4}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleCreate}
            disabled={!newNote.trim() || saving}
            className="btn-ide btn-ide-primary"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Save Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-8">
          <StickyNote size={24} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">
            No notes yet. Add your first note above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note._id}
              className="rounded-lg border border-zinc-800 bg-[#131316] p-3"
            >
              {editingId === note._id ? (
                <>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full bg-zinc-900 text-sm text-zinc-200 outline-none resize-y min-h-[60px] font-mono p-2 rounded"
                    rows={4}
                  />
                  <div className="flex justify-end gap-1 mt-2">
                    <button onClick={cancelEdit} className="btn-ide">
                      <X size={12} /> Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(note._id)}
                      className="btn-ide btn-ide-success"
                    >
                      <Check size={12} /> Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <pre className="flex-1 text-sm text-zinc-200 whitespace-pre-wrap font-mono">
                      {note.content}
                    </pre>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                        title="Edit note"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-2">
                    {note.updatedAt
                      ? `Updated ${new Date(note.updatedAt).toLocaleString()}`
                      : `Created ${new Date(note.createdAt).toLocaleString()}`}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;
