export function getUserManagementPath(pltaId: string): string {
  return `/dashboard/plta/${encodeURIComponent(pltaId)}/user-management`;
}

export function getCreateUserPath(pltaId: string): string {
  return `${getUserManagementPath(pltaId)}/new`;
}

export function getEditUserPath(
  pltaId: string,
  userId: string,
  username: string,
): string {
  const searchParams = new URLSearchParams({ username });
  return `${getUserManagementPath(pltaId)}/${encodeURIComponent(userId)}/edit?${searchParams}`;
}
