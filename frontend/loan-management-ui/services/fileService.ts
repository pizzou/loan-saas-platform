import API from './api';
import { BorrowerFile } from '../types/index';

const unwrap = (body: unknown): unknown => {
  if (body !== null && typeof body === 'object' && 'data' in body) {
    return (body as { data: unknown }).data;
  }
  return body;
};

export const getFilesByBorrower = (borrowerId: number): Promise<BorrowerFile[]> =>
  API.get(`/files/borrower/${borrowerId}`)
    .then(r => unwrap(r.data) as BorrowerFile[]);

export const uploadFile = (borrowerId: number, file: File): Promise<BorrowerFile> => {
  const form = new FormData();
  form.append('file', file);
  return API.post(`/files/upload/${borrowerId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => unwrap(r.data) as BorrowerFile);
};

export const deleteFile = (fileId: number): Promise<void> =>
  API.delete(`/files/${fileId}`).then(() => undefined);

export const getDownloadUrl = (fileId: number): string => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  return `${base}/files/download/${fileId}`;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const fileIcon = (fileType?: string): string => {
  if (!fileType) return '📄';
  if (fileType.includes('pdf'))                                    return '📕';
  if (fileType.includes('image'))                                  return '🖼️';
  if (fileType.includes('word') || fileType.includes('document'))  return '📝';
  if (fileType.includes('sheet') || fileType.includes('excel'))    return '📊';
  return '📄';
};