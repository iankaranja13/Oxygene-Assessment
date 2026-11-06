// Shown for any unknown URL, with a way back instead of a blank screen.
import { LinkButton } from '../../components/Button.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { ROUTES } from '../../lib/constants.js';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Page not found"
        description="That link doesn't lead anywhere in LaunchPad."
      />
      <LinkButton to={ROUTES.home}>Go to the home screen</LinkButton>
    </>
  );
}
