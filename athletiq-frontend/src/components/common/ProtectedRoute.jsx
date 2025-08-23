import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProtectedRoute component that handles authentication and authorization
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string|string[]} [props.roles] - Required role(s) to access the route (alias for requiredRole)
 * @param {string|string[]} [props.requiredRole] - Legacy prop, use 'roles' instead
 * @param {boolean} [props.requireAll] - If true, user must have all specified roles (alias for requireAllRoles)
 * @param {boolean} [props.requireAllRoles] - Legacy prop, use 'requireAll' instead
 * @param {string} [props.redirectTo='/login'] - Path to redirect if not authenticated/authorized
 * @returns {JSX.Element} Protected route component
 */
const ProtectedRoute = ({
  children,
  roles,
  requiredRole,
  requireAll,
  requireAllRoles = false,
  redirectTo = '/login',
  ...rest
}) => {
  const { isAuthenticated, loading, hasRole, hasAnyRole, hasAllRoles } = useAuth();
  const location = useLocation();
  
  // Support both roles and requiredRole props for backward compatibility
  const requiredRoles = roles || requiredRole;
  const requiresAll = typeof requireAll !== 'undefined' ? requireAll : requireAllRoles;

  // Show loading spinner while checking auth state
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check if user has required role(s)
  let isAuthorized = true;
  if (requiredRoles) {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    isAuthorized = requiresAll 
      ? hasAllRoles(rolesArray)
      : hasAnyRole(rolesArray);
  }

  // Redirect to unauthorized page if user doesn't have required role(s)
  if (!isAuthorized) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If authenticated and authorized, render the children
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  requireAllRoles: PropTypes.bool,
  redirectTo: PropTypes.string,
};

export default ProtectedRoute;
