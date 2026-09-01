import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { listComments, createComment } from "@/lib/comments";
import { Button } from "@/components/ui/Button";

export function CommentThread({ taskId }: { taskId: string }) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => listComments(taskId),
  });

  const mutation = useMutation({
    mutationFn: () => createComment(taskId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setBody("");
    },
  });

  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-paper/40">Comments</h3>

      <div className="mt-3 space-y-3">
        {comments?.length === 0 && <p className="text-sm text-paper/30">No comments yet.</p>}
        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-2.5">
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
              </div>
              <p className="mt-0.5 text-sm text-paper/80">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) mutation.mutate();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          className="h-9 flex-1 rounded border border-line bg-white/[0.03] px-3 text-sm text-paper placeholder:text-paper/30 focus:border-signal focus:outline-none"
        />
        <Button type="submit" size="sm" isLoading={mutation.isPending}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}