import { useLocale } from '@automattic/i18n-utils';
import { useSelect } from '@wordpress/data';
import { LAUNCH_STORE, PLANS_STORE } from '../stores';
import type { LaunchSelect, PlansSelect } from '@automattic/data-stores';

export function useHasEcommercePlan(): boolean {
	const locale = useLocale();

	const planProductId = useSelect(
		( select ) => ( select( LAUNCH_STORE ) as LaunchSelect ).getSelectedPlanProductId(),
		[]
	);

	const isEcommercePlan = useSelect(
		( select ) => {
			const plansStore: PlansSelect = select( PLANS_STORE );
			const plan = plansStore.getPlanByProductId( planProductId, locale );
			return plansStore.isPlanEcommerce( plan?.periodAgnosticSlug );
		},
		[ planProductId, locale ]
	);

	return isEcommercePlan;
}
