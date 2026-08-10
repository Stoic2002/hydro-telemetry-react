import { useEffect, useState } from 'react';

/** Keep a browser object URL in sync with an optional Blob and revoke it safely. */
export function useObjectUrl(blob: Blob | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let nextObjectUrl: string | null = null;
    const updateTimer = window.setTimeout(() => {
      nextObjectUrl = blob ? URL.createObjectURL(blob) : null;
      setObjectUrl(nextObjectUrl);
    }, 0);

    return () => {
      window.clearTimeout(updateTimer);
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [blob]);

  return objectUrl;
}

