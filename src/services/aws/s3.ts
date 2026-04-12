/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * AWS S3 — 媒體上傳服務
 * 透過 Pre-signed URL（Lambda 產生）上傳，避免在 App 存放 AWS 金鑰
 */
import * as FileSystem from 'expo-file-system/legacy';
import { AWS_CONFIG } from '../../config/aws';
import { getIdToken } from './cognito';

const BASE = `${AWS_CONFIG.apiGateway.baseUrl}/${AWS_CONFIG.apiGateway.stage}`;

// ── 取得 Pre-signed Upload URL ───────────────────────────────────────────────

interface PresignedResponse {
  uploadUrl: string;
  fileKey:   string;
  publicUrl: string;
}

async function getPresignedUrl(
  userId: string,
  fileName: string,
  contentType: string,
): Promise<PresignedResponse> {
  const token = await getIdToken();
  const res = await fetch(`${BASE}/media/presign`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, fileName, contentType }),
  });
  if (!res.ok) throw new Error(`presign failed: ${res.status}`);
  return res.json();
}

// ── 上傳圖片（本地 URI → S3）────────────────────────────────────────────────

export async function uploadPhoto(
  userId: string,
  localUri: string,
  slot: 'avatar' | 'photo1' | 'photo2' | 'photo3' = 'avatar',
): Promise<string> {
  const ext          = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType  = ext === 'png' ? 'image/png' : 'image/jpeg';
  const fileName     = `${userId}/${slot}_${Date.now()}.${ext}`;

  const { uploadUrl, publicUrl } = await getPresignedUrl(userId, fileName, contentType);

  // expo-file-system 上傳（支援 iOS/Android）
  const uploadResult = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod:  'PUT',
    uploadType:  FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers:     { 'Content-Type': contentType },
  });

  if (uploadResult.status !== 200) {
    throw new Error(`S3 upload failed: ${uploadResult.status}`);
  }

  return publicUrl;
}

// ── 刪除媒體（透過 API）─────────────────────────────────────────────────────

export async function deleteMedia(fileKey: string): Promise<void> {
  const token = await getIdToken();
  const res = await fetch(`${BASE}/media/${encodeURIComponent(fileKey)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`delete media failed: ${res.status}`);
}

// ── 取得公開 CDN URL ─────────────────────────────────────────────────────────

export function getPublicUrl(fileKey: string): string {
  return `https://${AWS_CONFIG.s3.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${fileKey}`;
}
