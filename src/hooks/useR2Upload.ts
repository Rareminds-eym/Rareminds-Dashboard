// ponytail: React hook wrapping R2 upload with state management
import { useState, useCallback } from 'react';
import { uploadToR2, type R2UploadResult, type R2UploadOptions } from '@/lib/r2-upload';

export interface UseR2UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: R2UploadResult | null;
}

export function useR2Upload() {
  const [state, setState] = useState<UseR2UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const upload = useCallback(async (file: File, options?: R2UploadOptions) => {
    // ponytail: validation now in uploadToR2, no need to call twice
    setState({ isUploading: true, progress: 0, error: null, result: null });

    const result = await uploadToR2(file, {
      ...options,
      onProgress: (percent) => setState(prev => ({ ...prev, progress: percent })),
    });

    setState({
      isUploading: false,
      progress: result.success ? 100 : 0,
      error: result.error || null,
      result,
    });

    return result;
  }, []);

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null, result: null });
  }, []);

  return { ...state, upload, reset };
}
