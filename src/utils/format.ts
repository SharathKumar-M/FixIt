/**
 * Formatting and Helper Utilities
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a human-friendly role name.
 */
export function formatRoleName(role?: string, dept?: string): string {
  if (!role) return 'Campus Member';
  if (role === 'office_staff') {
    return dept ? `Staff • ${dept}` : 'Office Staff';
  }
  if (role === 'admin') return 'System Administrator';
  if (role === 'faculty') return 'Faculty Member';
  if (role === 'student') return 'Student';
  return role;
}
