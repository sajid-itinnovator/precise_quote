/**
 * Invoice/project status domain logic — the option lists and status→color
 * mappings in one place, so every surface (preview toolbar StatusSelect,
 * mobile More sheet, Hub project tiles) renders the same domain truth.
 */

export const STATUS_OPTIONS = ['DRAFT', 'INVOICE CREATED', 'APPROVED', 'PENDING', 'REJECTED'];

/** Project-tile pipeline: the invoice statuses plus execution stages. */
export const PROJECT_STATUS_OPTIONS = ['DRAFT', 'INVOICE CREATED', 'PENDING', 'APPROVED', 'REJECTED', 'IN PROGRESS', 'COMPLETED'];

/** Label shown for a status value ('REJECTED' displays as 'REJECT'). */
export const STATUS_LABELS = { REJECTED: 'REJECT' };

/** Text color for a status chip on a white background (Hub tiles). */
export function statusTextColor(status) {
  switch (status) {
    case 'APPROVED': case 'IN PROGRESS': case 'COMPLETED': return '#166534';
    case 'INVOICE CREATED': return '#1d4ed8';
    case 'REJECTED': case 'REJECT': return '#b91c1c';
    case 'PENDING': return '#b45309';
    case 'COMMERCIAL': return '#5b21b6';
    default: return '#374151';
  }
}

export function statusBackground(status) {
  switch (status) {
    case 'APPROVED': return '#166534';
    case 'INVOICE CREATED': return '#1d4ed8';
    case 'REJECTED': case 'REJECT': return '#991b1b';
    case 'PENDING': return '#b45309';
    default: return '#374151';
  }
}
