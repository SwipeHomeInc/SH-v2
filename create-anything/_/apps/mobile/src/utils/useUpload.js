import * as React from 'react';
import { UploadClient } from '@uploadcare/upload-client'

// Guard against undefined environment variable - only create client if key exists
const uploadcarePublicKey = process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY || '';
const client = uploadcarePublicKey ? new UploadClient({ publicKey: uploadcarePublicKey }) : null;

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      let response;

      if ("reactNativeAsset" in input && input.reactNativeAsset) {
        let asset = input.reactNativeAsset;

        if (asset.file) {
          const formData = new FormData();
          formData.append("file", asset.file);

          response = await fetch("/_create/api/upload/", {
            method: "POST",
            body: formData,
          });
        } else {
          // Fallback to presigned Uploadcare upload
          if (!client) {
            throw new Error("Uploadcare client not configured");
          }
          const presignRes = await fetch("/_create/api/upload/presign/", {
            method: "POST",
          });
          const { secureSignature, secureExpire } = await presignRes.json();

          const result = await client.uploadFile(asset, {
            fileName: asset.name ?? asset.uri.split("/").pop(),
            contentType: asset.mimeType,
            secureSignature,
            secureExpire
          });
          // Guard against undefined environment variable
          const baseContentURL = process.env.EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL || '';
          return { url: `${baseContentURL}/${result.uuid}/`, mimeType: result.mimeType || null };
        }
      } else if ("url" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        });
      } else if ("base64" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ base64: input.base64 })
        });
      } else {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: input.buffer
        });
      }
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Upload failed: File too large.");
        }
        throw new Error("Upload failed");
      }
      const data = await response.json();
      return { url: data.url, mimeType: data.mimeType || null };
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
export default useUpload;