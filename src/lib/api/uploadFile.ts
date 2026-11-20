import { API_URL, ApiError, getAccessToken, refreshSession } from "./client";

/**
 * Upload one file to `/brands/files/` with progress, and resolve with its
 * stored URL once the server has it.
 *
 * `api()` is fetch-based and fetch reports no upload progress, so this one
 * request uses XHR. A 401 refreshes the session once and tries again, the way
 * `api()` does. Errors come back as `ApiError`, so `errorText` words them.
 */
export async function uploadFile(file: Blob, name: string, onProgress: (fraction: number) => void): Promise<string> {
  const send = () =>
    new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/brands/files/`);
      xhr.withCredentials = true;
      const token = getAccessToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          /* a non-JSON error page */
        }
        resolve({ status: xhr.status, body });
      };
      xhr.onerror = () => reject(new ApiError("Can't reach the Markyos server. Check your connection and try again.", 0));
      const form = new FormData();
      form.append("file", file, name);
      xhr.send(form);
    });

  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  if (res.status >= 200 && res.status < 300) {
    onProgress(1);
    return (res.body as { url: string }).url;
  }
  const fields = (res.body ?? {}) as Record<string, unknown>;
  const first = Object.values(fields).flat().find((v) => typeof v === "string") as string | undefined;
  throw new ApiError(first ?? "The upload didn't go through.", res.status, {}, res.body);
}
