// Guardian Feature Index
// Main entry point for all guardian-related components and pages

// Pages
export { default as UnifiedGuardianPortal } from './pages/UnifiedGuardianPortal';
export { default as GuardianClaimPortal } from './pages/GuardianClaimPortal';
export { default as GuardianPortal } from './pages/GuardianPortal';

// Components
export { default as GuardianDashboard } from './components/GuardianDashboard';
export { default as GuardianLogin } from './components/GuardianLogin';
export { default as GuardianRegistrationNew } from './components/GuardianRegistrationNew';
export { default as ChildManagement } from './components/ChildManagement';
export { default as GuardianLoginForm } from './components/GuardianLoginForm';
export { default as AthleteForm } from './components/AthleteForm';

// Hooks
export { useGuardianAuth, GuardianAuthProvider } from './hooks/useGuardianAuth';
export { useGuardianChildren } from './hooks/useGuardianChildren';
