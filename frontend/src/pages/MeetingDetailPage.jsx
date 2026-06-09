import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const MeetingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Edit mode state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await api.get(`/meetings/${id}`);
        setMeeting(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load meeting.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeeting();
  }, [id]);

  // ── Polling: re-fetch while status is 'processing' ──
  const pollingRef = useRef(null);

  useEffect(() => {
    // Start polling only when the meeting exists and is still processing
    if (meeting && meeting.status === 'processing') {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/meetings/${id}`);
          setMeeting(res.data);

          // Stop polling once the status resolves
          if (res.data.status !== 'processing') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } catch (err) {
          console.error('Polling error:', err.message);
        }
      }, 3000);
    }

    // Cleanup on unmount or when status changes
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [meeting?.status, id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/meetings/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete meeting.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ── Edit helpers ──

  /** Enter edit mode: snapshot current meeting data into editData */
  const enterEditMode = () => {
    setEditData({
      title: meeting.title,
      summary: meeting.summary || '',
      actionItems: meeting.actionItems?.map((item) => ({
        task: item.task,
        owner: item.owner || 'Unassigned',
        deadline: item.deadline || '',
      })) || [],
      decisions: [...(meeting.decisions || [])],
    });
    setSaveError('');
    setIsEditing(true);
  };

  /** Cancel editing and discard changes */
  const cancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setSaveError('');
  };

  /** Save changes to backend */
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      // Filter out empty decisions before saving
      const payload = {
        ...editData,
        decisions: editData.decisions.filter((d) => d.trim() !== ''),
      };
      const res = await api.put(`/meetings/${id}`, payload);
      setMeeting(res.data);
      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors.join(', ')
        : err.response?.data?.message || 'Failed to save changes.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Action item helpers ──
  const updateActionItem = (index, field, value) => {
    setEditData((prev) => {
      const updated = [...prev.actionItems];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, actionItems: updated };
    });
  };

  const removeActionItem = (index) => {
    setEditData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.filter((_, i) => i !== index),
    }));
  };

  const addActionItem = () => {
    setEditData((prev) => ({
      ...prev,
      actionItems: [...prev.actionItems, { task: '', owner: 'Unassigned', deadline: '' }],
    }));
  };

  // ── Decision helpers ──
  const updateDecision = (index, value) => {
    setEditData((prev) => {
      const updated = [...prev.decisions];
      updated[index] = value;
      return { ...prev, decisions: updated };
    });
  };

  const removeDecision = (index) => {
    setEditData((prev) => ({
      ...prev,
      decisions: prev.decisions.filter((_, i) => i !== index),
    }));
  };

  const addDecision = () => {
    setEditData((prev) => ({
      ...prev,
      decisions: [...prev.decisions, ''],
    }));
  };

  // Input type icon and label
  const inputTypeDisplay = {
    transcript: { icon: '✏️', label: 'Pasted Text' },
    transcript_file: { icon: '📄', label: 'File Upload' },
    audio: { icon: '🎙️', label: 'Audio' },
    video: { icon: '🎬', label: 'Video' },
  };

  /** Format a date for the "Last edited" display */
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  // ── Shared input styles ──
  const inputClass = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder-white/20';
  const textareaClass = `${inputClass} resize-none`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Navbar skeleton */}
        <nav className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-xl font-bold tracking-tight">
              Meet<span className="text-indigo-400">Mind</span>
            </div>
            <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-10 animate-[fadeIn_0.3s_ease-out]">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 animate-pulse">
            <div className="flex-1 min-w-0">
              <div className="h-8 w-2/3 rounded bg-white/[0.06] mb-3" />
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 rounded bg-white/[0.04]" />
                <div className="h-4 w-24 rounded bg-white/[0.04]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-20 rounded-lg bg-white/[0.04]" />
              <div className="h-9 w-20 rounded-lg bg-white/[0.04]" />
            </div>
          </div>

          {/* Content grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6 animate-pulse">
              {/* Summary skeleton */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="h-5 w-24 rounded bg-indigo-500/20 mb-4" />
                <div className="space-y-2.5">
                  <div className="h-4 w-full rounded bg-white/[0.04]" />
                  <div className="h-4 w-full rounded bg-white/[0.04]" />
                  <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
                </div>
              </div>

              {/* Action items skeleton */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="h-5 w-32 rounded bg-purple-500/20 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                      <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-16 rounded bg-white/[0.04]" />
                        <div className="h-5 w-16 rounded bg-white/[0.04]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decisions skeleton */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="h-5 w-32 rounded bg-blue-500/20 mb-4" />
                <div className="space-y-2">
                  {[1, 2].map((n) => (
                    <div key={n} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                      <div className="h-4 w-4 rounded bg-white/[0.06] mt-0.5 flex-shrink-0" />
                      <div className="h-4 w-full rounded bg-white/[0.04]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column — Transcript skeleton */}
            <div className="lg:col-span-1 animate-pulse">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="h-5 w-36 rounded bg-emerald-500/20 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="h-3.5 rounded bg-white/[0.04]" style={{ width: `${60 + Math.random() * 40}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-md text-center">
          {error}
        </div>
        <Link to="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const typeInfo = inputTypeDisplay[meeting.inputType] || { icon: '📋', label: meeting.inputType };
  const wasEdited = meeting.updatedAt && meeting.updatedAt !== meeting.createdAt;

  // ── Processing screen ──
  if (meeting.status === 'processing') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Navbar */}
        <nav className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/dashboard" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              Meet<span className="text-indigo-400">Mind</span>
            </Link>
            <Link to="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center animate-[fadeIn_0.3s_ease-out]">
          {/* Animated spinner */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full border-4 border-white/[0.06]" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
          </div>

          <h1 className="text-2xl font-semibold mb-2">{meeting.title}</h1>
          <p className="text-white/50 mb-6">AI is analyzing your meeting...</p>

          <div className="space-y-3 w-full max-w-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-indigo-400">✓</span>
              <span className="text-white/60 text-sm">File uploaded</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="w-4 h-4 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
              <span className="text-white/60 text-sm">Extracting insights...</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] opacity-40">
              <span className="text-white/30">○</span>
              <span className="text-white/30 text-sm">Ready for review</span>
            </div>
          </div>

          <p className="text-white/20 text-xs mt-8">This page will update automatically</p>
        </main>
      </div>
    );
  }

  // ── Failed screen ──
  if (meeting.status === 'failed') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Navbar */}
        <nav className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/dashboard" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              Meet<span className="text-indigo-400">Mind</span>
            </Link>
            <Link to="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </nav>

        <main className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center animate-[fadeIn_0.3s_ease-out]">
          {/* Error icon */}
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold mb-2">Processing Failed</h1>
          <p className="text-white/50 mb-2">{meeting.title}</p>

          <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-8">
            {meeting.errorMessage || 'An unknown error occurred during processing.'}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/meetings/new"
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-all"
            >
              Try Again
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            Meet<span className="text-indigo-400">Mind</span>
          </Link>
          <Link to="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            {/* Title — editable or display */}
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                className={`${inputClass} text-2xl sm:text-3xl font-semibold mb-2 !bg-white/[0.03]`}
                placeholder="Meeting title"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-semibold mb-2 break-words">{meeting.title}</h1>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/40">
              <span>{typeInfo.icon} {typeInfo.label}</span>
              <span>•</span>
              <span>{formatDate(meeting.createdAt)}</span>
              {wasEdited && (
                <>
                  <span>•</span>
                  <span className="text-white/30 italic" title={formatDateTime(meeting.updatedAt)}>
                    Edited {formatDateTime(meeting.updatedAt)}
                  </span>
                </>
              )}
              {meeting.sourceFileName && (
                <>
                  <span>•</span>
                  <span className="text-white/30">{meeting.sourceFileName}</span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <div className="flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm text-white/60 bg-white/[0.05] rounded-lg hover:bg-white/[0.1] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={enterEditMode}
                  className="px-4 py-2 text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit
                </button>

                {/* Delete button */}
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                    <span className="text-sm text-white/50">Sure?</span>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-500 transition-all disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-2 text-sm text-white/50 bg-white/[0.05] rounded-lg hover:bg-white/[0.1] transition-all"
                    >
                      No
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Save error banner */}
        {saveError && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-[fadeIn_0.2s_ease-out]">
            {saveError}
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — AI Insights (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-3 text-indigo-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                Summary
              </h2>
              {isEditing ? (
                <textarea
                  value={editData.summary}
                  onChange={(e) => setEditData((prev) => ({ ...prev, summary: e.target.value }))}
                  className={`${textareaClass} min-h-[120px]`}
                  placeholder="Meeting summary..."
                  rows={5}
                />
              ) : (
                <p className="text-white/80 leading-relaxed">{meeting.summary || 'No summary available.'}</p>
              )}
            </div>

            {/* Action Items */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-4 text-purple-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Action Items
                {(() => {
                  const items = isEditing ? editData.actionItems : meeting.actionItems;
                  return items?.length > 0 && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  );
                })()}
              </h2>

              {isEditing ? (
                <div className="space-y-3">
                  {editData.actionItems.map((item, i) => (
                    <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.04] space-y-3 animate-[fadeIn_0.2s_ease-out]">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={item.task}
                            onChange={(e) => updateActionItem(i, 'task', e.target.value)}
                            className={inputClass}
                            placeholder="Task description"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={item.owner}
                              onChange={(e) => updateActionItem(i, 'owner', e.target.value)}
                              className={`${inputClass} flex-1`}
                              placeholder="Owner"
                            />
                            <input
                              type="text"
                              value={item.deadline}
                              onChange={(e) => updateActionItem(i, 'deadline', e.target.value)}
                              className={`${inputClass} flex-1`}
                              placeholder="Deadline"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeActionItem(i)}
                          className="mt-1 p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remove action item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addActionItem}
                    className="w-full py-2.5 text-sm text-purple-300/70 border border-dashed border-white/[0.08] rounded-xl hover:border-purple-500/30 hover:text-purple-300 hover:bg-purple-500/[0.03] transition-all"
                  >
                    + Add Action Item
                  </button>
                </div>
              ) : (
                meeting.actionItems?.length > 0 ? (
                  <ul className="space-y-3">
                    {meeting.actionItems.map((item, i) => (
                      <li key={item._id || i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-white/[0.03] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                        <span className="text-white/90">{item.task}</span>
                        <div className="flex items-center gap-3 text-xs flex-shrink-0">
                          <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-300">
                            👤 {item.owner || 'Unassigned'}
                          </span>
                          {item.deadline && (
                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-300">
                              ⏱️ {item.deadline}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/40 italic">No action items detected.</p>
                )
              )}
            </div>

            {/* Decisions */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-3 text-blue-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                Key Decisions
                {(() => {
                  const items = isEditing ? editData.decisions : meeting.decisions;
                  return items?.length > 0 && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  );
                })()}
              </h2>

              {isEditing ? (
                <div className="space-y-2">
                  {editData.decisions.map((decision, i) => (
                    <div key={i} className="flex items-start gap-2 animate-[fadeIn_0.2s_ease-out]">
                      <span className="text-blue-400 mt-2.5 flex-shrink-0">✦</span>
                      <input
                        type="text"
                        value={decision}
                        onChange={(e) => updateDecision(i, e.target.value)}
                        className={`${inputClass} flex-1`}
                        placeholder="Decision"
                      />
                      <button
                        onClick={() => removeDecision(i)}
                        className="mt-1 p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                        title="Remove decision"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addDecision}
                    className="w-full py-2.5 text-sm text-blue-300/70 border border-dashed border-white/[0.08] rounded-xl hover:border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/[0.03] transition-all"
                  >
                    + Add Decision
                  </button>
                </div>
              ) : (
                meeting.decisions?.length > 0 ? (
                  <ul className="space-y-2">
                    {meeting.decisions.map((decision, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                        <span className="text-blue-400 mt-0.5">✦</span>
                        <span className="text-white/80">{decision}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/40 italic">No key decisions detected.</p>
                )
              )}
            </div>
          </div>

          {/* Right column — Transcript (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 lg:sticky lg:top-6">
              <h2 className="text-lg font-medium mb-3 text-emerald-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Original Transcript
              </h2>
              {meeting.rawText ? (
                <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{meeting.rawText}</p>
                </div>
              ) : (
                <p className="text-white/40 italic text-sm">Transcript not available.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MeetingDetailPage;
