import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send, Pencil, Trash2, Check, X } from "lucide-react";
import { listComments, createComment, updateComment, deleteComment } from "@/lib/comments";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";

export function CommentThread({ taskId }: { taskId: string }) {
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => listComments(taskId),
  });

  const createMutation = useMutation({
    mutationFn: () => createComment(taskId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setBody("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(commentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", taskId] }),
  });

  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-paper/40">Comments</h3>

      <div className="mt-3 space-y-3">
        {comments?.length === 0 && <p className="text-sm text-paper/30">No comments yet.</p>}
        {comments?.map((comment) => {
          const isOwn = comment.author.id === currentUser?.id;
          const isEditing = editingId === comment.id;

          return (
            <div key={comment.id} className="group flex gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/20 font-mono text-[9px] text-signal">
                {comment.author.firstName[0]}
                {comment.author.lastName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-paper">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="font-mono text-[10px] text-paper/30">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>

                  {/* Only the author can edit; only the author sees delete here
                      too — org admins can also delete per the backend, but
                      that's a less common path we're not surfacing in this
                      compact view to keep the UI simple. */}
                  {isOwn && !isEditing && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditBody(comment.body);
                        }}
                        className="text-paper/30 hover:text-paper"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(comment.id)}
                        className="text-paper/30 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-1 flex gap-1.5">
                    <input
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      autoFocus
                      className="h-8 flex-1 rounded border border-signal bg-white/[0.03] px-2 text-sm text-paper focus:outline-none"
                    />
                    <button
                      onClick={() => updateMutation.mutate({ commentId: comment.id, body: editBody })}
                      className="text-done hover:text-done/80"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-paper/40 hover:text-paper">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm text-paper/80">{comment.body}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) createMutation.mutate();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          className="h-9 flex-1 rounded border border-line bg-white/[0.03] px-3 text-sm text-paper placeholder:text-paper/30 focus:border-signal focus:outline-none"
        />
        <Button type="submit" size="sm" isLoading={createMutation.isPending}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}