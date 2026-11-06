// Root component: provides staff-access state and maps URLs to screens.
//   /, /poll       open to everyone
//   /usher         usher or organizer PIN
//   /organizer     organizer PIN only
// The two staff screens are lazy-loaded: their code, and the guest list they import,
// download only after a staff member opens them. Attendees on /poll never receive
// guest names or codes.
import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from './components/AppShell.jsx';
import EmptyState from './components/EmptyState.jsx';
import PinGate from './components/PinGate.jsx';
import ScreenErrorBoundary from './components/ScreenErrorBoundary.jsx';
import StaffAccessProvider from './components/StaffAccessProvider.jsx';
import HomePage from './features/home/HomePage.jsx';
import NotFoundPage from './features/home/NotFoundPage.jsx';
import PollPage from './features/poll/PollPage.jsx';
import { ROUTES } from './lib/constants.js';
import { ROUTE_ROLES } from './lib/staffAccess.js';

const UsherPage = lazy(() => import('./features/usher/UsherPage.jsx'));
const OrganizerPage = lazy(() => import('./features/organizer/OrganizerPage.jsx'));

/** A staff screen: PIN check first, then download and show the screen. */
function StaffScreen({ route, children }) {
  return (
    <PinGate requiredRole={ROUTE_ROLES[route]}>
      <ScreenErrorBoundary>
        <Suspense fallback={<EmptyState title="Loading…" headingLevel={1} />}>{children}</Suspense>
      </ScreenErrorBoundary>
    </PinGate>
  );
}

export default function App() {
  return (
    <StaffAccessProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path={ROUTES.home} element={<HomePage />} />
            <Route path={ROUTES.poll} element={<PollPage />} />
            <Route
              path={ROUTES.usher}
              element={
                <StaffScreen route={ROUTES.usher}>
                  <UsherPage />
                </StaffScreen>
              }
            />
            <Route
              path={ROUTES.organizer}
              element={
                <StaffScreen route={ROUTES.organizer}>
                  <OrganizerPage />
                </StaffScreen>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StaffAccessProvider>
  );
}
