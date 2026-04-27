import { useCallback, useEffect, useRef, useState } from 'react';

import { writeClipboardText } from '../lib/clipboard';

export type CopyStatus = 'idle' | 'success' | 'error';

interface UseCopyFeedbackOptions {
  resetDelayMs?: number;
}

export function useCopyFeedback({ resetDelayMs = 1200 }: UseCopyFeedbackOptions = {}) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const timerRef = useRef<number | null>(null);

  const clearCopyTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearCopyTimer();
    },
    [clearCopyTimer],
  );

  const copyText = useCallback(
    async (text: string) => {
      clearCopyTimer();
      setCopyStatus('idle');

      const copied = await writeClipboardText(text);
      if (!copied) {
        setCopyStatus('error');
        return false;
      }

      setCopyStatus('success');
      timerRef.current = window.setTimeout(() => {
        setCopyStatus('idle');
        timerRef.current = null;
      }, resetDelayMs);
      return true;
    },
    [clearCopyTimer, resetDelayMs],
  );

  return { copyStatus, copyText };
}
