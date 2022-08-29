import { isEnabled } from '@automattic/calypso-config';
import page from 'page';
import { canCurrentUserUseCustomerHome } from 'calypso/state/sites/selectors';
import getSite from 'calypso/state/sites/selectors/get-site.js';
import { getSelectedSiteSlug, getSelectedSiteId } from 'calypso/state/ui/selectors';
import { redirectToLaunchpad } from 'calypso/utils';
import CustomerHome from './main';

export default async function ( context, next ) {
	const state = await context.store.getState();
	const siteId = getSelectedSiteId( state );

	// Scroll to the top
	if ( typeof window !== 'undefined' ) {
		window.scrollTo( 0, 0 );
	}

	context.primary = <CustomerHome key={ siteId } />;

	next();
}

export function maybeRedirect( context, next ) {
	const state = context.store.getState();
	const slug = getSelectedSiteSlug( state );

	if ( ! canCurrentUserUseCustomerHome( state ) ) {
		page.redirect( `/stats/day/${ slug }` );
		return;
	}

	const siteId = getSelectedSiteId( state );
	const site = getSite( state, siteId );
	const options = site?.options;
	const shouldRedirectToLaunchpad = options?.launchpad_screen === 'full';

	if ( shouldRedirectToLaunchpad && isEnabled( 'signup/launchpad' ) ) {
		// The new stepper launchpad onboarding flow isn't registered within the "page"
		// client-side router, so page.redirect won't work. We need to use the
		// traditional window.location Web API.
		redirectToLaunchpad( slug, options?.site_intent );
	}
	next();
}
