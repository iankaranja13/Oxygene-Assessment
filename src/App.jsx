// Root component: provides staff-access state and maps URLs to screens.
// /usher and /organizer sit behind the PIN gate; / and /poll are open to everyone.
import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from './components/AppShell.jsx';
import PinGate from './components/PinGate.jsx';
import StaffAccessProvider from './components/StaffAccessProvider.jsx';
import HomePage from './features/home/HomePage.jsx';
import NotFoundPage from './features/home/NotFoundPage.jsx';
import OrganizerPage from './features/organizer/OrganizerPage.jsx';
import PollPage from './features/poll/PollPage.jsx';
import UsherPage from './features/usher/UsherPage.jsx';
import { ROUTES } from './lib/constants.js';

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
                <PinGate>
                  <UsherPage />
                </PinGate>
              }
            />
            <Route
              path={ROUTES.organizer}
              element={
                <PinGate>
                  <OrganizerPage />
                </PinGate>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StaffAccessProvider>
  );
}
