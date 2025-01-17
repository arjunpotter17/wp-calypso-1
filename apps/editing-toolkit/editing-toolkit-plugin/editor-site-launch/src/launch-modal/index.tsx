import { useLocale } from '@automattic/i18n-utils';
import { LaunchContext, useOnLaunch } from '@automattic/launch';
import { Modal, Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, wordpress, close } from '@wordpress/icons';
import classnames from 'classnames';
import * as React from 'react';
import Launch from '../launch';
import LaunchProgress from '../launch-progress';
import LaunchSidebar from '../launch-sidebar';
import { LAUNCH_STORE, SITE_STORE, PLANS_STORE } from '../stores';
import type { LaunchSelect, PlansSelect } from '@automattic/data-stores';

import './styles.scss';

interface Props {
	onClose: () => void;
	isLaunchImmediately?: boolean;
}

const LaunchModal: React.FunctionComponent< Props > = ( { onClose, isLaunchImmediately } ) => {
	const { siteId } = React.useContext( LaunchContext );

	const { step: currentStep, isSidebarFullscreen } = useSelect(
		( select ) => ( select( LAUNCH_STORE ) as LaunchSelect ).getState(),
		[]
	);
	const [ isLaunching, setIsLaunching ] = React.useState( false );
	const [ isImmediateLaunchStarted, setIsImmediateLaunchStarted ] = React.useState( false );

	const { launchSite } = useDispatch( SITE_STORE );
	const { savePost } = useDispatch( 'core/editor' );

	const locale = useLocale();
	const { setPlanProductId } = useDispatch( LAUNCH_STORE );
	const defaultFreePlan = useSelect(
		( select ) => ( select( PLANS_STORE ) as PlansSelect ).getDefaultFreePlan( locale ),
		[ locale ]
	);

	const handleLaunch = React.useCallback( () => {
		launchSite( siteId );
		setIsLaunching( true );
	}, [ launchSite, setIsLaunching, siteId ] );

	// When isLaunchImmediately: Show the "Hooray! Launching your site..." screen as soon as possible.
	React.useEffect( () => {
		if ( isLaunchImmediately && ! isLaunching ) {
			setIsLaunching( true );
		}
	}, [ isLaunching, isLaunchImmediately ] );

	// When isLaunchImmediately: Begin the launch process after the free plan has loaded
	// and if we haven't already started it (isImmediateLaunchStarted).
	React.useEffect( () => {
		const asyncSavePost = async () => {
			await savePost();
		};
		if ( isLaunchImmediately && ! isImmediateLaunchStarted && defaultFreePlan?.productIds[ 0 ] ) {
			setPlanProductId( defaultFreePlan?.productIds[ 0 ] );
			setIsImmediateLaunchStarted( true );
			asyncSavePost();
			handleLaunch();
		}
	}, [
		isLaunchImmediately,
		isImmediateLaunchStarted,
		handleLaunch,
		savePost,
		defaultFreePlan,
		setPlanProductId,
	] );

	// handle redirects to checkout / my home after launch
	useOnLaunch();

	return (
		<Modal
			open={ true }
			className={ classnames(
				'nux-launch-modal',
				`step-${ currentStep }`,
				isSidebarFullscreen ? 'is-sidebar-fullscreen' : ''
			) }
			overlayClassName="nux-launch-modal-overlay"
			bodyOpenClassName="has-nux-launch-modal"
			onRequestClose={ onClose }
			title=""
		>
			{ isLaunching ? (
				<div className="nux-launch-modal-body__launching">
					{ __( 'Hooray! Your site will be ready shortly.', 'full-site-editing' ) }
				</div>
			) : (
				<>
					<div className="nux-launch-modal-body">
						<div className="nux-launch-modal-header">
							<div className="nux-launch-modal-header__wp-logo">
								<Icon icon={ wordpress } size={ 36 } />
							</div>
							<LaunchProgress />
						</div>
						<Launch onSubmit={ handleLaunch } />
					</div>
					<div className="nux-launch-modal-aside">
						<LaunchSidebar />
					</div>
					<Button
						isLink
						className="nux-launch-modal__close-button"
						onClick={ onClose }
						aria-label={ __( 'Close dialog', 'full-site-editing' ) }
						disabled={ ! onClose }
					>
						<span>
							<Icon icon={ close } size={ 24 } />
						</span>
					</Button>
				</>
			) }
		</Modal>
	);
};

export default LaunchModal;
