import { api, ApiResponse } from "./api";

export interface Comment {
  id: string;
  taskId: string;
  body: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  createdAt: string;
}

export async function listComments(taskId: string) {
  const res = await api.get<ApiResponse<{ comments: Comment[] }>>("/comments", {
    params: { taskId },
  });
  return res.data.data.comments;
}

export async function createComment(taskId: string, body: string) {
  const res = await api.post<ApiResponse<{ comment: Comment }>>("/comments", { taskId, body });
  return res.data.data.comment;
}

export async function deleteComment(commentId: string) {
  await api.delete(`/comments/${commentId}`);
}