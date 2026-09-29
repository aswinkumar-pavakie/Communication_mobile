const MIME_BY_EXTENSION: Record<string, string> = {
  m4a: 'audio/m4a',
  caf: 'audio/x-caf',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
};

export function extensionAndMimeType(uri: string): { name: string; mimeType: string } {
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
  return { name: `recording.${extension}`, mimeType: MIME_BY_EXTENSION[extension] ?? 'audio/m4a' };
}

export function formatDuration(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
