import { useMemo } from 'react';

interface Props {
	hasJetpackSiteSlug: boolean;
	isAkismetSitelessCheckout: boolean;
	isJetpackCheckout: boolean;
	isJetpackNotAtomic: boolean;
	isLoggedOutCart?: boolean;
	isUserComingFromLoginForm?: boolean;
}

export default function useCheckoutFlowTrackKey( {
	hasJetpackSiteSlug,
	isAkismetSitelessCheckout,
	isJetpackCheckout, // this flag is used for both "siteless checkout" and "site-only(userless) checkout"
	isJetpackNotAtomic,
	isLoggedOutCart,
	isUserComingFromLoginForm,
}: Props ): string {
	return useMemo( () => {
		const isSitelessJetpackCheckout = isJetpackCheckout && ! hasJetpackSiteSlug;

		if ( isJetpackCheckout ) {
			if ( isUserComingFromLoginForm ) {
				// this allows us to track the flow: Checkout --> Login --> Checkout
				return isSitelessJetpackCheckout
					? 'jetpack_siteless_checkout_coming_from_login'
					: 'jetpack_site_only_checkout_coming_from_login';
			}
			return isSitelessJetpackCheckout ? 'jetpack_siteless_checkout' : 'jetpack_site_only_checkout';
		}

		if ( isAkismetSitelessCheckout ) {
			// TODO: do we need to handle checking out with a site slug but without a logged in user?
			return 'akismet_siteless_checkout';
		}

		if ( isLoggedOutCart ) {
			return 'wpcom_registrationless';
		}
		return isJetpackNotAtomic ? 'jetpack_checkout' : 'wpcom_checkout';
	}, [
		hasJetpackSiteSlug,
		isJetpackCheckout,
		isJetpackNotAtomic,
		isLoggedOutCart,
		isUserComingFromLoginForm,
	] );
}
