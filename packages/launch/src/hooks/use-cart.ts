import { useLocale } from '@automattic/i18n-utils';
import { useSelect, useDispatch } from '@wordpress/data';
import { useContext, useState } from 'react';
import LaunchContext from '../context';
import { useSiteDomains, useHasEcommercePlan } from '../hooks';
import { LAUNCH_STORE, SITE_STORE, PLANS_STORE } from '../stores';
import { getDomainProduct, getPlanProductForFlow } from '../utils';
import type { LaunchSelect, PlansSelect } from '@automattic/data-stores';

type LaunchCart = {
	goToCheckout: () => Promise< void >; // used in gutenboarding-launch
	goToCheckoutAndLaunch: () => Promise< void >; // used in focused-launch integrated with Editor Checkout modal
	isCartUpdating: boolean;
};

export function useCart(): LaunchCart {
	const { siteId, flow, openCheckout, isInIframe } = useContext( LaunchContext );

	const locale = useLocale();

	const { planProductId, domain } = useSelect(
		( select ) => ( {
			planProductId: ( select( LAUNCH_STORE ) as LaunchSelect ).getSelectedPlanProductId(),
			domain: ( select( LAUNCH_STORE ) as LaunchSelect ).getSelectedDomain(),
		} ),
		[]
	);

	const { planProduct, isEcommercePlan } = useSelect(
		( select ) => {
			const plansStore: PlansSelect = select( PLANS_STORE );
			const plan = plansStore.getPlanByProductId( planProductId as number, locale );
			return {
				planProduct: plansStore.getPlanProductById( planProductId as number ),
				isEcommercePlan: plansStore.isPlanEcommerce( plan?.periodAgnosticSlug ),
			};
		},
		[ planProductId, locale ]
	);

	const { siteSubdomain } = useSiteDomains();

	const { getCart, setCart, launchSite } = useDispatch( SITE_STORE );

	const onSuccess = () => launchSite( siteId );

	const [ isCartUpdating, setIsCartUpdating ] = useState( false );

	const hasEcommercePlan = useHasEcommercePlan();

	const addProductsToCart = async () => {
		if ( isCartUpdating ) {
			return;
		}

		setIsCartUpdating( true );

		// @TODO: setting the cart with Launch products can be extracted to an action creator on the Launch store
		const domainProductForFlow = domain && getDomainProduct( domain, flow );
		const planProductForFlow = planProduct && getPlanProductForFlow( planProduct, flow );
		const cart = await getCart( siteId );
		await setCart( siteId, {
			...cart,
			// replace any existing products from cart
			products: [ planProductForFlow, domainProductForFlow ],
		} );

		setIsCartUpdating( false );
	};

	const goToCheckout = async () => {
		await addProductsToCart();
		openCheckout( siteSubdomain?.domain, isEcommercePlan, onSuccess );
	};

	const goToCheckoutAndLaunch = async () => {
		if ( ! isInIframe || hasEcommercePlan ) {
			// We launch the site first and then open Checkout in these cases:
			// - Focused Launch is loaded outside Calypso iframe (in wp-admin)
			// - eCommerce plan is selected so Checkout will handle thank-you redirect after purchase
			await launchSite( siteId );
		}
		goToCheckout();
	};

	return {
		goToCheckout,
		goToCheckoutAndLaunch,
		isCartUpdating,
	};
}
