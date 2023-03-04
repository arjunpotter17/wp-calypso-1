import { StepContainer } from '@automattic/onboarding';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { useTranslate } from 'i18n-calypso';
import { useDispatch, useSelector } from 'react-redux';
import { NEWSLETTER_FLOW } from 'calypso/../packages/onboarding/src';
import DocumentHead from 'calypso/components/data/document-head';
import FormattedHeader from 'calypso/components/formatted-header';
import { NavigationControls } from 'calypso/landing/stepper/declarative-flow/internals/types';
import { useRecordSignupComplete } from 'calypso/landing/stepper/hooks/use-record-signup-complete';
import { useSite } from 'calypso/landing/stepper/hooks/use-site';
import { useSiteSlugParam } from 'calypso/landing/stepper/hooks/use-site-slug-param';
import { SITE_STORE } from 'calypso/landing/stepper/stores';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { isUserLoggedIn } from 'calypso/state/current-user/selectors';
import { requestSettings as membershipsRequestSettings } from 'calypso/state/memberships/settings/actions';
import { successNotice } from 'calypso/state/notices/actions';
import { useQuery } from '../../../../hooks/use-query';
import StepContent from './step-content';
import type { Step } from '../../types';
import './style.scss';

type LaunchpadProps = {
	navigation: NavigationControls;
	flow: string | null;
};

const Launchpad: Step = ( { navigation, flow }: LaunchpadProps ) => {
	const translate = useTranslate();
	const almostReadyToLaunchText = translate( 'Almost ready to launch' );
	const siteSlug = useSiteSlugParam();
	const verifiedParam = useQuery().get( 'verified' );
	const site = useSite();
	const launchpadScreenOption = site?.options?.launchpad_screen;
	const recordSignupComplete = useRecordSignupComplete( flow );
	const dispatch = useDispatch();
	const isLoggedIn = useSelector( isUserLoggedIn );

	const fetchingSiteError = useSelect( ( select ) => select( SITE_STORE ).getFetchingSiteError() );

	if ( ! isLoggedIn ) {
		window.location.replace( `/home/${ siteSlug }` );
	}

	if ( ! siteSlug || fetchingSiteError?.error ) {
		window.location.replace( '/home' );
	}

	useEffect( () => {
		if ( verifiedParam ) {
			const message = translate( 'Email confirmed!' );
			dispatch(
				successNotice( message, {
					duration: 10000,
				} )
			);
		}
	}, [ verifiedParam, translate, dispatch ] );

	useEffect( () => {
		// launchpadScreenOption changes from undefined to either 'off' or 'full'
		// we need to check if it's defined to avoid recording the same action twice
		if ( launchpadScreenOption !== undefined ) {
			// The screen option returns false for sites that have never set the option
			if (
				( 'videopress' !== flow && launchpadScreenOption === false ) ||
				launchpadScreenOption === 'off'
			) {
				window.location.replace( `/home/${ siteSlug }` );
				recordTracksEvent( 'calypso_launchpad_redirect_to_home', { flow: flow } );
			} else {
				recordTracksEvent( 'calypso_launchpad_loaded', { flow: flow } );
			}
		}
	}, [ launchpadScreenOption, siteSlug, flow ] );

	useEffect( () => {
		if ( siteSlug && site && localStorage.getItem( 'launchpad_siteSlug' ) !== siteSlug ) {
			recordSignupComplete();
			localStorage.setItem( 'launchpad_siteSlug', siteSlug );
		}
	}, [ recordSignupComplete, siteSlug, site ] );

	// If the user is in the newsletter flow, we need to fetch the memberships
	// settings for the stripe connect url.
	useEffect( () => {
		const stripeConnected =
			site?.options?.launchpad_checklist_tasks_statuses?.stripe_connected || false;
		if ( stripeConnected === false && site?.ID && flow === NEWSLETTER_FLOW ) {
			dispatch( membershipsRequestSettings( site?.ID ) );
		}
	}, [ site, flow, dispatch ] );

	return (
		<>
			<DocumentHead title={ almostReadyToLaunchText } />
			<StepContainer
				stepName="launchpad"
				goNext={ navigation.goNext }
				isWideLayout={ true }
				skipLabelText={ translate( 'Skip to dashboard' ) }
				skipButtonAlign="bottom"
				hideBack={ true }
				stepContent={
					<StepContent
						siteSlug={ siteSlug }
						submit={ navigation.submit }
						goNext={ navigation.goNext }
						goToStep={ navigation.goToStep }
						flow={ flow }
					/>
				}
				formattedHeader={
					<FormattedHeader id="launchpad-header" headerText={ <>{ almostReadyToLaunchText }</> } />
				}
				recordTracksEvent={ recordTracksEvent }
			/>
		</>
	);
};

export default Launchpad;
