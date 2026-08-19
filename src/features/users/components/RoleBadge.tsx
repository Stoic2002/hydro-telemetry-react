import Badge, { type BadgeTone } from '../../../components/atoms/Badge';
import type { UserRole } from '../../../types';

const ROLE_TONE: Record<UserRole, BadgeTone> = {
  'Super Admin': 'cyan',
  'Admin UBP': 'cyan',
  'Operator PLTA': 'amber',
  Viewer: 'slate',
};

export default function RoleBadge({ role }: { role: UserRole }) {
  return <Badge tone={ROLE_TONE[role]}>{role}</Badge>;
}
