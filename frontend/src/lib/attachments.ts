import { api, ApiResponse } from "./api";

export interface Attachment {
  id: string;
  taskId: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export async function listAttachments(taskId: string) {
  const res = await api.get<ApiResponse<{ attachments: Attachment[] }>>("/attachments", {
    params: { taskId },
  });
  return res.data.data.attachments;
}

export async function uploadAttachment(taskId: string, file: File) {
  const formData = new FormData();
  formData.append("taskId", taskId);
  formData.append("file", file);

  const res = await api.post<ApiResponse<{ attachment: Attachment }>>("/attachments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data.attachment;
}

export async function deleteAttachment(attachmentId: string) {
  await api.delete(`/attachments/${attachmentId}`);
}