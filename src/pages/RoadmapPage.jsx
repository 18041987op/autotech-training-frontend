/**
 * RoadmapPage — employee-facing page (/roadmap) showing:
 *   1. The roadmap (admin-curated items: planned, in_progress, shipped)
 *   2. Ideas (employee suggestions; user sees their own + promoted ones,
 *      admin sees all)
 *   3. Submit-an-idea form
 *
 * Each item / idea supports: 👍 vote, comment thread (modal), and the
 * status flow visible at a glance.
 */

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Lightbulb, ThumbsUp, MessageCircle, Plus, X, Send,
  Map, CheckCircle, PlayCircle, Circle, XCircle,
  Sparkles, Wrench, Settings as SettingsIcon, Bug, Zap,
} from "lucide-react";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import {
  getRoadmap, submitIdea, toggleVote, addComment, getComments,
  updateComment, deleteComment,
} from "../lib/roadmapApi";
import { PageHero } from "../components/PageHero";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

// ── Constants ────────────────────────────────────────────────────────────

const STATUS_META = {
  planned:     { label: "Planned",     icon: Circle,      color: "slate"   },
  in_progress: { label: "In Progress", icon: PlayCircle,  color: "sky"     },
  shipped:     { label: "Shipped",     icon: CheckCircle, color: "emerald" },
  canceled:    { label: "Canceled",    icon: XCircle,     color: "red"     },
};

const CATEGORY_META = {
  feature:        { label: "Feature",        icon: Sparkles,    color: "violet"  },
  improvement:    { label: "Improvement",    icon: Zap,         color: "amber"   },
  fix:            { label: "Fix",            icon: Bug,         color: "red"     },
  infrastructure: { label: "Infrastructure", icon: Wrench,      color: "slate"   },
  integration:    { label: "Integration",    icon: SettingsIcon, color: "blue"   },
};

const IDEA_STATUS_META = {
  pending:    { label: "Pending Review", color: "amber"   },
  promoted:   { label: "Promoted to Roadmap 🎉", color: "emerald" },
  dismissed:  { label: "Not Planned", color: "slate"   },
  duplicate:  { label: "Duplicate", color: "slate"   },
};

// ── Page ─────────────────────────────────────────────────────────────────

export function RoadmapPage() {
  const { t } = useTranslation();
  const ready = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const email = user?.email;

  const [submitOpen, setSubmitOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null); // { type, id, title }

  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["roadmap", email],
    queryFn: () => getRoadmap(email),
    enabled: !!ready && !!email,
    staleTime: 60 * 1000,
  });

  const voteMut = useMutation({
    mutationFn: ({ target_type, target_id }) => toggleVote(email, target_type, target_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roadmap", email] }),
    onError: (e) => toast.error(e?.message || "Vote failed"),
  });

  const onVote = (target_type, target_id) => {
    if (voteMut.isPending) return;
    voteMut.mutate({ target_type, target_id });
  };

  // Hooks first — derived data (memoized) must come BEFORE any early return.
  const items = data?.items || [];
  const ideas = data?.ideas || [];
  const voteCounts = data?.vote_counts || {};
  const commentCounts = data?.comment_counts || {};
  const myVotes = new Set(data?.my_votes || []);

  const itemsByStatus = useMemo(() => {
    const groups = { in_progress: [], planned: [], shipped: [], canceled: [] };
    for (const it of items) (groups[it.status] || groups.planned).push(it);
    return groups;
  }, [items]);

  const visibleIdeas = useMemo(() =>
    (ideas || []).filter(i => i.status !== "promoted" && i.status !== "duplicate"),
    [ideas]
  );

  if (!ready) return <LoadingSkeleton />;
  if (!email) {
    return <div className="card p-6 text-sm text-slate-600">{t("auth.signInRequired", "Sign in to view the roadmap.")}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("nav2.feedback", "Feedback")}
        title={t("roadmap.title", "Roadmap & Ideas")}
        subtitle={t("roadmap.subtitle", "What we're building, and what the team is asking for. Vote 👍 the ones you want and add comments.")}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="card p-6 border-red-200 bg-red-50 text-red-700 text-sm">
          {error?.message || t("roadmap.loadError", "Could not load roadmap")}
        </div>
      ) : (
        <>
          {/* ── Roadmap (admin items) ─────────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeader
              icon={Map}
              title={t("roadmap.section.roadmap", "What we're building")}
              count={items.length}
            />
            {items.length === 0 ? (
              <div className="card p-6 text-sm text-slate-500">
                {t("roadmap.empty.items", "No roadmap items yet.")}
              </div>
            ) : (
              <>
                {(["in_progress","planned","shipped","canceled"]).map((status) => {
                  const group = itemsByStatus[status];
                  if (!group || group.length === 0) return null;
                  return (
                    <StatusGroup
                      key={status}
                      status={status}
                      items={group}
                      myVotes={myVotes}
                      voteCounts={voteCounts}
                      commentCounts={commentCounts}
                      onVote={onVote}
                      onComment={(item) => setCommentTarget({ type: "item", id: item.id, title: item.title })}
                      voteBusy={voteMut.isPending}
                      t={t}
                    />
                  );
                })}
              </>
            )}
          </section>

          {/* ── Ideas (user-submitted) ────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SectionHeader
                icon={Lightbulb}
                title={t("roadmap.section.ideas", "Ideas from the team")}
                count={visibleIdeas.length}
              />
              <button
                onClick={() => setSubmitOpen(true)}
                className="btn-primary-sm flex items-center gap-1.5"
                type="button"
              >
                <Plus className="h-4 w-4" />
                {t("roadmap.submitIdea", "Submit an idea")}
              </button>
            </div>

            {visibleIdeas.length === 0 ? (
              <div className="card p-6 text-sm text-slate-500">
                {t("roadmap.empty.ideas", "No ideas submitted yet — be the first!")}
              </div>
            ) : (
              <div className="space-y-2">
                {visibleIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    voteCount={voteCounts[`idea:${idea.id}`] || 0}
                    commentCount={commentCounts[`idea:${idea.id}`] || 0}
                    voted={myVotes.has(`idea:${idea.id}`)}
                    onVote={() => onVote("idea", idea.id)}
                    onComment={() => setCommentTarget({ type: "idea", id: idea.id, title: idea.title })}
                    voteBusy={voteMut.isPending}
                    t={t}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {submitOpen && (
        <SubmitIdeaModal
          email={email}
          onClose={() => setSubmitOpen(false)}
          onSubmitted={() => {
            queryClient.invalidateQueries({ queryKey: ["roadmap", email] });
            setSubmitOpen(false);
          }}
        />
      )}

      {commentTarget && (
        <CommentsModal
          target={commentTarget}
          email={email}
          onClose={() => setCommentTarget(null)}
          onChanged={() => queryClient.invalidateQueries({ queryKey: ["roadmap", email] })}
        />
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="grid h-7 w-7 place-items-center rounded-xl bg-sky-100 text-sky-700">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
      <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-slate-100 text-slate-500">
        {count}
      </span>
    </div>
  );
}

// ── Status group ──────────────────────────────────────────────────────────

function StatusGroup({ status, items, myVotes, voteCounts, commentCounts, onVote, onComment, voteBusy, t }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1 flex items-center gap-1.5">
        <Icon className={`h-3 w-3 text-${meta.color}-500`} />
        {t(`roadmap.status.${status}`, meta.label)}
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">{items.length}</span>
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            voteCount={voteCounts[`item:${item.id}`] || 0}
            commentCount={commentCounts[`item:${item.id}`] || 0}
            voted={myVotes.has(`item:${item.id}`)}
            onVote={() => onVote("item", item.id)}
            onComment={() => onComment(item)}
            voteBusy={voteBusy}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────

function ItemCard({ item, voteCount, commentCount, voted, onVote, onComment, voteBusy, t }) {
  const cat = CATEGORY_META[item.category] || CATEGORY_META.feature;
  const CatIcon = cat.icon;
  const status = STATUS_META[item.status] || STATUS_META.planned;

  return (
    <div className="card p-4 flex gap-3">
      {/* Vote button */}
      <button
        onClick={onVote}
        disabled={voteBusy}
        className={`flex-shrink-0 w-12 flex flex-col items-center justify-center rounded-xl border transition py-2 disabled:opacity-50
          ${voted
            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
            : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
          }`}
        type="button"
        title={voted ? t("roadmap.unvote", "Click to remove your vote") : t("roadmap.vote", "Vote 👍")}
      >
        <ThumbsUp className={`h-4 w-4 ${voted ? "fill-emerald-700" : ""}`} />
        <span className="text-xs font-extrabold mt-0.5">{voteCount}</span>
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-bold text-slate-900 leading-snug">{item.title}</p>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border bg-${status.color}-50 text-${status.color}-700 border-${status.color}-200`}>
            {React.createElement(status.icon, { className: "h-3 w-3" })}
            {t(`roadmap.status.${item.status}`, status.label)}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.description}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className={`inline-flex items-center gap-1 text-${cat.color}-700`}>
            <CatIcon className="h-3 w-3" />
            {t(`roadmap.category.${item.category}`, cat.label)}
          </span>
          {item.target_release && (
            <span>· {item.target_release}</span>
          )}
          <button
            onClick={onComment}
            className="ml-auto inline-flex items-center gap-1 hover:text-sky-600 transition"
            type="button"
          >
            <MessageCircle className="h-3 w-3" />
            {commentCount === 0
              ? t("roadmap.addComment", "Comment")
              : `${commentCount} ${commentCount === 1 ? t("roadmap.comment", "comment") : t("roadmap.comments", "comments")}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Idea card ────────────────────────────────────────────────────────────

function IdeaCard({ idea, voteCount, commentCount, voted, onVote, onComment, voteBusy, t }) {
  const cat = CATEGORY_META[idea.category] || CATEGORY_META.feature;
  const CatIcon = cat.icon;
  const statusMeta = IDEA_STATUS_META[idea.status] || IDEA_STATUS_META.pending;

  return (
    <div className="card p-4 flex gap-3 border-l-4 border-l-amber-300">
      <button
        onClick={onVote}
        disabled={voteBusy}
        className={`flex-shrink-0 w-12 flex flex-col items-center justify-center rounded-xl border transition py-2 disabled:opacity-50
          ${voted
            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
            : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
          }`}
        type="button"
      >
        <ThumbsUp className={`h-4 w-4 ${voted ? "fill-emerald-700" : ""}`} />
        <span className="text-xs font-extrabold mt-0.5">{voteCount}</span>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-bold text-slate-900 leading-snug">{idea.title}</p>
          <span className={`flex-shrink-0 inline-flex text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border bg-${statusMeta.color}-50 text-${statusMeta.color}-700 border-${statusMeta.color}-200`}>
            {t(`roadmap.ideaStatus.${idea.status}`, statusMeta.label)}
          </span>
        </div>
        {idea.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{idea.description}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className={`inline-flex items-center gap-1 text-${cat.color}-700`}>
            <CatIcon className="h-3 w-3" />
            {t(`roadmap.category.${idea.category}`, cat.label)}
          </span>
          <span>· {idea.submitter_name || t("roadmap.anonymous", "Anonymous")}</span>
          <button
            onClick={onComment}
            className="ml-auto inline-flex items-center gap-1 hover:text-sky-600 transition"
            type="button"
          >
            <MessageCircle className="h-3 w-3" />
            {commentCount === 0
              ? t("roadmap.addComment", "Comment")
              : `${commentCount}`}
          </button>
        </div>
        {idea.triage_notes && idea.status !== "pending" && (
          <p className="mt-2 text-[11px] italic text-slate-500 bg-slate-50 rounded-lg p-2">
            <strong>{t("roadmap.adminResponse", "Admin response")}:</strong> {idea.triage_notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Submit Idea modal ────────────────────────────────────────────────────

function SubmitIdeaModal({ email, onClose, onSubmitted }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("feature");

  const submit = useMutation({
    mutationFn: () => submitIdea(email, { title: title.trim(), description: description.trim(), category }),
    onSuccess: () => {
      toast.success(t("roadmap.ideaSubmitted", "Idea submitted! Osman will review it."));
      onSubmitted();
    },
    onError: (e) => toast.error(e?.message || t("roadmap.submitError", "Could not submit")),
  });

  const onSend = () => {
    if (title.trim().length < 3) return toast.error(t("roadmap.titleTooShort", "Title is too short"));
    if (description.trim().length < 5) return toast.error(t("roadmap.descTooShort", "Description is too short"));
    submit.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {t("roadmap.submitTitle", "Submit an idea")}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100" type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1">
              {t("roadmap.fieldTitle", "Title")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder={t("roadmap.titlePlaceholder", "e.g. Add dark mode to the timesheet page")}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1">
              {t("roadmap.fieldDesc", "Description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder={t("roadmap.descPlaceholder", "Why is this useful? What problem does it solve?")}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-y"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1">
              {t("roadmap.fieldCategory", "Category")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="feature">{t("roadmap.category.feature", "Feature")}</option>
              <option value="improvement">{t("roadmap.category.improvement", "Improvement")}</option>
              <option value="fix">{t("roadmap.category.fix", "Fix")}</option>
              <option value="infrastructure">{t("roadmap.category.infrastructure", "Infrastructure")}</option>
              <option value="integration">{t("roadmap.category.integration", "Integration")}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end border-t border-slate-200 px-5 py-3 bg-slate-50">
          <button onClick={onClose} className="btn-outline-sm" type="button" disabled={submit.isPending}>
            {t("common.cancel", "Cancel")}
          </button>
          <button
            onClick={onSend}
            disabled={submit.isPending}
            className="btn-primary-sm flex items-center gap-1.5 disabled:opacity-50"
            type="button"
          >
            <Send className="h-4 w-4" />
            {submit.isPending ? t("common.sending", "Sending...") : t("roadmap.send", "Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single comment row with edit/delete for own comments ────────────────

function CommentRow({ comment, email, onChanged, t }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [busy, setBusy] = useState(false);

  // Read current user from auth store inside the row.
  // We compare email rather than emp_id because the comments API only stores user_id (emp_id).
  // The comment carries user_name; we approximate "is mine" by also passing the logged-in user's name.
  // Better: backend includes user_email on comments. For now, rely on user_id check via API itself.
  // Show edit/delete optimistically; the backend enforces permission.
  const isMine = comment.user_email
    ? comment.user_email === email
    : comment.user_name && useAuthStore.getState().user?.name === comment.user_name;

  const save = async () => {
    if (draft.trim().length < 1) return;
    setBusy(true);
    try {
      await updateComment(email, comment.id, draft.trim());
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(e?.message || "Edit failed");
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(t("roadmap.confirmDelete", "Delete this comment?"))) return;
    setBusy(true);
    try {
      await deleteComment(email, comment.id);
      onChanged();
    } catch (e) {
      toast.error(e?.message || "Delete failed");
    } finally { setBusy(false); }
  };

  return (
    <div className={`rounded-xl p-3 ${comment.is_admin_response ? "bg-sky-50 border border-sky-200" : "bg-slate-50"}`}>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs font-bold text-slate-700">
          {comment.user_name}
          {comment.is_admin_response && <span className="ml-1.5 text-[9px] font-extrabold uppercase tracking-wide text-sky-600">· admin</span>}
        </p>
        <p className="text-[10px] text-slate-400 ml-auto">
          {new Date(comment.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={2000}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
          />
          <div className="flex gap-2 mt-1.5">
            <button onClick={save} disabled={busy || draft.trim().length < 1}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50" type="button">
              {t("common.save", "Save")}
            </button>
            <button onClick={() => { setEditing(false); setDraft(comment.body); }} disabled={busy}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md text-slate-500 hover:text-slate-700" type="button">
              {t("common.cancel", "Cancel")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.body}</p>
          {isMine && (
            <div className="flex gap-3 mt-1.5">
              <button onClick={() => setEditing(true)} disabled={busy}
                className="text-[10px] text-slate-500 hover:text-sky-600 transition" type="button">
                {t("common.edit", "Edit")}
              </button>
              <button onClick={remove} disabled={busy}
                className="text-[10px] text-slate-500 hover:text-red-600 transition" type="button">
                {t("common.delete", "Delete")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Comments modal ──────────────────────────────────────────────────────

function CommentsModal({ target, email, onClose, onChanged }) {
  const { t } = useTranslation();
  const [body, setBody] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["roadmap-comments", target.type, target.id],
    queryFn: () => getComments(target.type, target.id),
    enabled: !!target.id,
  });

  const post = useMutation({
    mutationFn: () => addComment(email, target.type, target.id, body.trim()),
    onSuccess: () => {
      setBody("");
      refetch();
      onChanged();
    },
    onError: (e) => toast.error(e?.message || "Failed"),
  });

  const onSend = () => {
    if (body.trim().length < 1) return;
    post.mutate();
  };

  const comments = data?.comments || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {t("roadmap.commentsOn", "Comments on")}
            </p>
            <p className="text-sm font-bold text-slate-900 truncate">{target.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 flex-shrink-0" type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="text-xs text-slate-500">{t("status.loading", "Loading...")}</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              {t("roadmap.firstComment", "Be the first to comment.")}
            </div>
          ) : (
            comments.map((c) => (
              <CommentRow key={c.id} comment={c} email={email} onChanged={() => { refetch(); onChanged(); }} t={t} />
            ))
          )}
        </div>

        <div className="border-t border-slate-200 p-3 flex gap-2 flex-shrink-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("roadmap.commentPlaceholder", "Add a comment...")}
            rows={2}
            maxLength={2000}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-y"
          />
          <button
            onClick={onSend}
            disabled={post.isPending || body.trim().length < 1}
            className="btn-primary-sm flex items-center gap-1 self-end disabled:opacity-50"
            type="button"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
