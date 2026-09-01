import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, X, Upload } from "lucide-react";
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
} from "@/lib/attachments";
import { Button } from "@/components/ui/Button";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ taskId }: { taskId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: attachments } = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: () => listAttachments(taskId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(taskId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["attachments", taskId],
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["attachments", taskId],
      }),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-paper/40">
          Attachments
        </h3>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          isLoading={uploadMutation.isPending}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              uploadMutation.mutate(file);
            }

            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-3 space-y-1.5">
        {attachments?.length === 0 && (
          <p className="text-sm text-paper/30">
            No attachments yet.
          </p>
        )}

        {attachments?.map((att) => (
          <div
            key={att.id}
            className="group flex items-center gap-2 rounded border border-line bg-white/[0.02] px-3 py-2"
          >
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-paper/40" />

            <a
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 truncate text-sm text-paper hover:text-signal"
            >
              {att.fileName}
            </a>

            <span className="font-mono text-[10px] text-paper/30">
              {formatFileSize(att.fileSize)}
            </span>

            <button
              type="button"
              onClick={() => deleteMutation.mutate(att.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5 text-paper/30 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}