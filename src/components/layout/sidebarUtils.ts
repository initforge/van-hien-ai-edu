/**
 * Shared sidebar utilities — used by StudentSidebar, TeacherSidebar, AdminSidebar.
 */
import { useAuth } from '../../contexts/AuthContext';
export { useAuth };

/** Returns true when current pathname matches the nav item (exact or starts-with for sub-routes). */
export function isActiveNav(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}
