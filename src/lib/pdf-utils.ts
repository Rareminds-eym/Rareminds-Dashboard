import { supabase } from "@/integrations/supabase/client";

export interface PDFUploadResult {
  success: boolean;
  url?: string;
  // Exact storage key relative to the bucket (e.g., "events/uuid/enquiries/file.pdf")
  path?: string;
  error?: string;
}

/**
 * Validates if the uploaded file is a PDF and within size limits
 */
export const validatePDF = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Please select a PDF file' };
  }

  // Check file size (limit to 10MB)
  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeInBytes) {
    return { valid: false, error: 'PDF file size must be less than 10MB' };
  }

  return { valid: true };
};

/**
 * Uploads a PDF file to Supabase storage
 */
export const uploadPDFToStorage = async (
  file: File,
  eventId: string
): Promise<PDFUploadResult> => {
  try {
    // Validate the file first
    const validation = validatePDF(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `enquiry-${eventId}-${timestamp}.pdf`;
    // Store under {eventId}/enquiries to match your existing bucket structure
    const filePath = `${eventId}/enquiries/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('events_pdf') // Ensure this bucket exists in your Supabase storage
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: 'Failed to upload PDF file' };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('events_pdf')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl, path: filePath };
  } catch (error) {
    console.error('PDF upload error:', error);
    return { success: false, error: 'An unexpected error occurred during upload' };
  }
};

/**
 * Updates the event record with the PDF URL
 */
export const updateEventWithPDF = async (
  eventId: string,
  pdfUrl: string,
  pdfPath?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('events')
      // Cast to any to avoid type friction if generated types are stale
      .update({ enquiry_pdf: pdfUrl, enquiry_pdf_path: pdfPath } as any)
      .eq('id', eventId);

    if (error) {
      console.error('Database update error:', error);
      return { success: false, error: 'Failed to update event with PDF information' };
    }

    return { success: true };
  } catch (error) {
    console.error('Update event error:', error);
    return { success: false, error: 'An unexpected error occurred while updating the event' };
  }
};

/**
 * Complete workflow: Upload PDF and update event record
 */
export const uploadEventEnquiryPDF = async (
  file: File,
  eventId: string
): Promise<PDFUploadResult> => {
  try {
    // Upload the PDF to storage
    const uploadResult = await uploadPDFToStorage(file, eventId);
    
    if (!uploadResult.success || !uploadResult.url) {
      return uploadResult;
    }

    // Update the event record (save both URL and exact storage path)
    const updateResult = await updateEventWithPDF(eventId, uploadResult.url, uploadResult.path);
    
    if (!updateResult.success) {
      // If database update fails, we could optionally clean up the uploaded file
      return { success: false, error: updateResult.error };
    }

    return { success: true, url: uploadResult.url };
  } catch (error) {
    console.error('Complete upload workflow error:', error);
    return { success: false, error: 'Failed to complete PDF upload process' };
  }
};

// Helper: extract bucket and file path from a Supabase Storage URL
const extractBucketAndPathFromStorageUrl = (pdfUrl: string): { bucket: string; path: string } | null => {
  try {
    const urlObj = new URL(pdfUrl);
    let pathname = urlObj.pathname; // e.g. /storage/v1/object/public/events_pdf/events/.../file.pdf

    // Normalize to the segment after /object/
    const objectMarker = '/object/';
    const objectIdx = pathname.indexOf(objectMarker);
    if (objectIdx !== -1) {
      pathname = pathname.slice(objectIdx + objectMarker.length);
    } else {
      // If no /object/ segment, strip leading slash
      if (pathname.startsWith('/')) pathname = pathname.slice(1);
    }

    // Remove possible prefixes 'public/' or 'sign/'
    if (pathname.startsWith('public/')) {
      pathname = pathname.slice('public/'.length);
    } else if (pathname.startsWith('sign/')) {
      pathname = pathname.slice('sign/'.length);
    }

    // Expect `${bucket}/<path>` now
    const firstSlash = pathname.indexOf('/');
    if (firstSlash === -1) return null;
    const bucket = pathname.slice(0, firstSlash);
    const path = pathname.slice(firstSlash + 1);
    return { bucket, path: decodeURIComponent(path) };
  } catch {
    // If pdfUrl isn't a valid absolute URL, attempt a path-only parse
    try {
      const parts = pdfUrl.split('/');
      const objectIdx = parts.findIndex(p => p === 'object');
      const after = objectIdx !== -1 ? parts.slice(objectIdx + 1) : parts;
      const trimmed = after[0] === 'public' || after[0] === 'sign' ? after.slice(1) : after;
      const bucket = trimmed[0];
      const path = decodeURIComponent(trimmed.slice(1).join('/'));
      if (bucket && path) return { bucket, path };
    } catch {}
    return null;
  }
};

/**
 * Deletes a PDF file from storage and removes reference from event
 */
export const deleteEventEnquiryPDF = async (
  eventId: string,
  pdfUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Prefer exact stored path from DB if available
    let bucket: string | null = null;
    let parsedPath: string | null = null;

    // Fetch the path saved on the event (if column exists)
    try {
      const { data: eventRow } = await supabase
        .from('events')
        .select('enquiry_pdf_path')
        .eq('id', eventId)
        .maybeSingle();
      if (eventRow && (eventRow as any).enquiry_pdf_path) {
        parsedPath = (eventRow as any).enquiry_pdf_path as string;
      }
    } catch {}

    // Fallback to URL parsing if no stored path
    if (!parsedPath) {
      const parsed = extractBucketAndPathFromStorageUrl(pdfUrl);
      if (!parsed) {
        return { success: false, error: 'Invalid PDF URL format' };
      }
      bucket = parsed.bucket;
      parsedPath = parsed.path;
    }

    // If URL parsing was used, bucket will be set; otherwise derive bucket from URL too
    if (!bucket) {
      const parsed = extractBucketAndPathFromStorageUrl(pdfUrl);
      bucket = parsed ? parsed.bucket : 'events_pdf';
    }

    // Build robust candidate paths to handle legacy or alternate layouts
    const norm = (p: string) => p.replace(/^\/+/, '');
    const candidatesSet = new Set<string>();
    const base = norm(parsedPath!);
    candidatesSet.add(base);
    // Always include the stored path first if present (already added as base)
    // Add its normalized variants below
    // If path doesn't start with 'events/', add it; if it does, also add variant without it
    if (base.startsWith('events/')) {
      candidatesSet.add(base.replace(/^events\//, ''));
    } else {
      candidatesSet.add(`events/${base}`);
    }

    // Try to get a reasonable filename. Prefer the one in the URL if it looks like a PDF.
    let filename = base.split('/').pop() || '';
    const filenameFromUrl = (() => {
      try {
        const u = new URL(pdfUrl);
        const last = decodeURIComponent(u.pathname.split('/').pop() || '');
        return last.endsWith('.pdf') ? last : '';
      } catch { return ''; }
    })();
    if (!filename.endsWith('.pdf') && filenameFromUrl) {
      filename = filenameFromUrl;
    }

    if (filename) {
      // Add candidates that use this filename under known directories
      candidatesSet.add(`events/${eventId}/enquiries/${filename}`);
      candidatesSet.add(`${eventId}/enquiries/${filename}`);
      candidatesSet.add(`enquiries/${filename}`);
      // If base looks like just the eventId, also try appending the filename directly
      if (base === eventId) {
        candidatesSet.add(`${base}/enquiries/${filename}`);
        candidatesSet.add(`${base}/${filename}`);
      }
    }

    const candidates = Array.from(candidatesSet);
    console.log('deleteEventEnquiryPDF candidates:', { bucket, candidates });

    // Try deletion sequentially so we know which path actually succeeds
    let deleted = false;
    let lastErrorMessage: string | null = null;

    for (const candidate of candidates) {
      const path = candidate.replace(/^\/+|\/+$/g, ''); // trim leading/trailing slashes
      const { data: delRes, error: delErr } = await supabase.storage
        .from(bucket)
        .remove([path]);

      // If there is a top-level error, record and continue
      if (delErr) {
        lastErrorMessage = delErr.message || String(delErr);
        continue;
      }

      // Check per-item results
      const perItem = Array.isArray(delRes) ? (delRes as any[]) : [];
      if (perItem.length === 0) {
        // Some SDK versions return empty array on success for missing objects; continue
        // We can't confirm; treat as not deleted and try next
        continue;
      }

      const thisAttemptSucceeded = perItem.some(r => !r?.error);
      if (thisAttemptSucceeded) {
        deleted = true;
        break;
      } else {
        const messages = perItem.map(r => r?.error?.message).filter(Boolean).join('; ');
        if (messages) lastErrorMessage = messages;
      }
    }

    if (!deleted) {
      console.warn('Direct deletion failed; attempting discovery via list()');
      // Fallback: discover the object location by listing likely parent folders
      const parents = new Set<string>();
      const baseDir = base.includes('/') ? base.slice(0, base.lastIndexOf('/')) : '';
      const filenameOnly = filename;
      const addParent = (p: string) => parents.add(p.replace(/^\/+|\/+$/g, ''));

      // derived parents
      addParent(baseDir);
      addParent(baseDir.replace(/^events\//, ''));
      addParent('');
      addParent('enquiries');
      addParent(`${eventId}`);
      addParent(`${eventId}/enquiries`);
      addParent(`events/${eventId}`);
      addParent(`events/${eventId}/enquiries`);

      // Try to discover by eventId pattern in likely directories
      const likelyDirs = [
        `${eventId}/enquiries`,
        `events/${eventId}/enquiries`,
        'enquiries',
        '',
      ];
      for (const dir of likelyDirs) parents.add(dir);

      for (const parent of parents) {
        try {
          const { data: listed, error: listErr } = await supabase.storage
            .from(bucket)
            .list(parent || '', { limit: 2000, sortBy: { column: 'name', order: 'asc' } });
          if (listErr) {
            lastErrorMessage = listErr.message || String(listErr);
            continue;
          }
          const files = (listed || []).filter((o: any) => o?.name);
          const match = files.find((obj: any) => obj.name === filenameOnly)
            || files.find((obj: any) => obj.name?.startsWith(`enquiry-${eventId}-`) && obj.name.endsWith('.pdf'));
          if (match) {
            const key = parent ? `${parent}/${match.name}` : match.name;
            const { data: delRes2, error: delErr2 } = await supabase.storage
              .from(bucket)
              .remove([key]);
            if (!delErr2) {
              const ok = Array.isArray(delRes2) ? (delRes2 as any[]).some(r => !r?.error) : true;
              if (ok) {
                deleted = true;
                break;
              }
            } else {
              lastErrorMessage = delErr2.message || String(delErr2);
            }
          }
        } catch (e) {
          // ignore and continue
        }
      }

      if (!deleted) {
        console.warn('Discovery did not find exact match; attempting prefix cleanup');
        // As a last resort, delete any enquiry-* files for this eventId in common directories
        const prefixParents = [
          `${eventId}/enquiries`,
          `events/${eventId}/enquiries`,
        ];
        for (const parent of prefixParents) {
          try {
            const { data: listed, error: listErr } = await supabase.storage
              .from(bucket)
              .list(parent, { limit: 2000, sortBy: { column: 'name', order: 'asc' } });
            if (listErr) {
              lastErrorMessage = listErr.message || String(listErr);
              continue;
            }
            const toDelete = (listed || [])
              .filter((o: any) => o?.name?.endsWith('.pdf'))
              .filter((o: any) => o.name?.startsWith('enquiry-'))
              .map((o: any) => `${parent}/${o.name}`);
            if (toDelete.length > 0) {
              const { data: delRes3, error: delErr3 } = await supabase.storage
                .from(bucket)
                .remove(toDelete);
              if (!delErr3) {
                const ok = Array.isArray(delRes3) ? (delRes3 as any[]).some(r => !r?.error) : true;
                if (ok) {
                  deleted = true;
                  break;
                }
              } else {
                lastErrorMessage = delErr3.message || String(delErr3);
              }
            }
          } catch (e) {
            // ignore and continue
          }
        }

        if (!deleted) {
          console.error('Storage deletion failed after discovery attempts and prefix cleanup');
          return { success: false, error: lastErrorMessage ? `Failed to delete from storage: ${lastErrorMessage}` : 'File not found or could not be deleted from storage' };
        }
      }
    }

    // After successful storage deletion, remove reference from the database
    const { error: dbError } = await supabase
      .from('events')
      .update({ enquiry_pdf: null, enquiry_pdf_path: null } as any)
      .eq('id', eventId);

    if (dbError) {
      console.error('Database update error:', dbError);
      return { success: false, error: 'File deleted, but failed to remove PDF reference from event' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete PDF error:', error);
    return { success: false, error: 'An unexpected error occurred while deleting the PDF' };
  }
};