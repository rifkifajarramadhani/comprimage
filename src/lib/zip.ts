import { zip } from 'fflate'

export interface ZipEntry {
  name: string
  blob: Blob
}

/**
 * Bundle blobs into a single ZIP Blob (client-side, via fflate).
 * Images are already compressed, so entries are stored (level 0) for speed.
 * Wired for the future batch tool; not yet used by the core UI.
 */
export async function zipBlobs(entries: Array<ZipEntry>): Promise<Blob> {
  const files: Record<string, [Uint8Array, { level: 0 }]> = {}
  for (const entry of entries) {
    const buffer = new Uint8Array(await entry.blob.arrayBuffer())
    files[entry.name] = [buffer, { level: 0 }]
  }

  return new Promise<Blob>((resolve, reject) => {
    zip(files, (err, data) => {
      if (err) reject(err)
      else resolve(new Blob([data], { type: 'application/zip' }))
    })
  })
}
