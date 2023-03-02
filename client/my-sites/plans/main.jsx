import { isEnabled } from '@automattic/calypso-config';
import {
	getPlan,
	getIntervalTypeForTerm,
	PLAN_FREE,
	PLAN_ECOMMERCE_TRIAL_MONTHLY,
	isFreePlan,
} from '@automattic/calypso-products';
import { is2023PricingGridActivePage } from '@automattic/calypso-products/src/plans-utilities';
import { withShoppingCart } from '@automattic/shopping-cart';
import { useDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { localize, useTranslate } from 'i18n-calypso';
import page from 'page';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import Banner from 'calypso/components/banner';
import DocumentHead from 'calypso/components/data/document-head';
import QueryContactDetailsCache from 'calypso/components/data/query-contact-details-cache';
import QueryPlans from 'calypso/components/data/query-plans';
import QuerySitePurchases from 'calypso/components/data/query-site-purchases';
import EmptyContent from 'calypso/components/empty-content';
import FormattedHeader from 'calypso/components/formatted-header';
import Main from 'calypso/components/main';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import TrackComponentView from 'calypso/lib/analytics/track-component-view';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import withTrackingTool from 'calypso/lib/analytics/with-tracking-tool';
import { getDomainRegistrations } from 'calypso/lib/cart-values/cart-items';
import { PerformanceTrackerStop } from 'calypso/lib/performance-tracking';
import { WPCOM_PLANS_UI_STORE } from 'calypso/my-sites/plan-features-2023-grid/store';
import PlansNavigation from 'calypso/my-sites/plans/navigation';
import P2PlansMain from 'calypso/my-sites/plans/p2-plans-main';
import PlansFeaturesMain from 'calypso/my-sites/plans-features-main';
import { isTreatmentPlansReorderTest } from 'calypso/state/marketing/selectors';
import { getPlanSlug } from 'calypso/state/plans/selectors';
import { getByPurchaseId } from 'calypso/state/purchases/selectors';
import { canCurrentUser } from 'calypso/state/selectors/can-current-user';
import getCurrentQueryArguments from 'calypso/state/selectors/get-current-query-arguments';
import isEligibleForWpComMonthlyPlan from 'calypso/state/selectors/is-eligible-for-wpcom-monthly-plan';
import isSiteWPForTeams from 'calypso/state/selectors/is-site-wpforteams';
import { getCurrentPlan } from 'calypso/state/sites/plans/selectors';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { getSelectedSite, getSelectedSiteId } from 'calypso/state/ui/selectors';
import CalypsoShoppingCartProvider from '../checkout/calypso-shopping-cart-provider';
import withCartKey from '../checkout/with-cart-key';
import DomainAndPlanPackageNavigation from '../domains/components/domain-and-plan-package/navigation';
import DomainUpsellDialog from './components/domain-upsell-dialog';
import PlansHeader from './components/plans-header';
import ECommerceTrialPlansPage from './ecommerce-trial';
import ModernizedLayout from './modernized-layout';

import './style.scss';

function DomainAndPlanUpsellNotice() {
	const translate = useTranslate();
	const noticeTitle = translate( 'Almost done' );
	const noticeDescription = translate( 'Upgrade today to claim your free domain name!' );
	return (
		<Banner
			title={ noticeTitle }
			description={ noticeDescription }
			icon="star"
			showIcon
			disableHref
		/>
	);
}
function DomainUpsellDescription() {
	const translate = useTranslate();
	const dispatch = useDispatch();
	const skipPlan = () => {
		recordTracksEvent( 'calypso_plans_page_domain_upsell_skip_click' );
		dispatch( WPCOM_PLANS_UI_STORE ).setShowDomainUpsellDialog( true );
	};
	return (
		<>
			<p className="plans__copy-domain-upsell">
				{ translate( 'See and compare the features available on each WordPress.com plan' ) }
			</p>
			<p>
				<button className="plans__copy-button" onClick={ skipPlan }>
					{ translate( 'Or continue with the free plan.' ) }
				</button>
			</p>
		</>
	);
}

class Plans extends Component {
	static propTypes = {
		context: PropTypes.object.isRequired,
		redirectToAddDomainFlow: PropTypes.bool,
		domainAndPlanPackage: PropTypes.string,
		intervalType: PropTypes.string,
		customerType: PropTypes.string,
		selectedFeature: PropTypes.string,
		redirectTo: PropTypes.string,
		selectedSite: PropTypes.object,
		isDomainAndPlanPackageFlow: PropTypes.bool,
		isDomainUpsell: PropTypes.bool,
		isDomainUpsellSuggested: PropTypes.bool,
	};

	static defaultProps = {
		intervalType: 'yearly',
	};

	componentDidMount() {
		this.redirectIfInvalidPlanInterval();

		if ( this.props.isDomainAndPlanPackageFlow ) {
			document.body.classList.add( 'is-domain-plan-package-flow' );
		}

		// Scroll to the top
		if ( typeof window !== 'undefined' ) {
			window.scrollTo( 0, 0 );
		}
	}

	componentWillUnmount() {
		if ( document.body.classList.contains( 'is-domain-plan-package-flow' ) ) {
			document.body.classList.remove( 'is-domain-plan-package-flow' );
		}
	}

	componentDidUpdate() {
		this.redirectIfInvalidPlanInterval();
	}

	isInvalidPlanInterval() {
		const { isSiteEligibleForMonthlyPlan, intervalType, selectedSite } = this.props;
		const isWpcomMonthly = intervalType === 'monthly';

		return selectedSite && isWpcomMonthly && ! isSiteEligibleForMonthlyPlan;
	}

	redirectIfInvalidPlanInterval() {
		const { selectedSite } = this.props;

		if ( this.isInvalidPlanInterval() ) {
			page.redirect( '/plans/yearly/' + selectedSite.slug );
		}
	}

	onSelectPlan = ( item ) => {
		const {
			selectedSite,
			context: {
				query: { discount },
			},
		} = this.props;
		const checkoutPath = `/checkout/${ selectedSite.slug }/${ item.product_slug }/`;

		page(
			discount
				? addQueryArgs( checkoutPath, {
						coupon: discount,
				  } )
				: checkoutPath
		);
	};

	renderPlaceholder = () => {
		return (
			<div>
				<DocumentHead title={ this.props.translate( 'Plans', { textOnly: true } ) } />
				<Main wideLayout>
					<div id="plans" className="plans plans__has-sidebar" />
				</Main>
			</div>
		);
	};

	renderPlansMain() {
		const { currentPlan, selectedSite, isWPForTeamsSite } = this.props;

		if ( ! this.props.plansLoaded || ! currentPlan ) {
			// Maybe we should show a loading indicator here?
			return null;
		}

		if ( isEnabled( 'p2/p2-plus' ) && isWPForTeamsSite ) {
			return (
				<P2PlansMain
					selectedPlan={ this.props.selectedPlan }
					redirectTo={ this.props.redirectTo }
					site={ selectedSite }
					withDiscount={ this.props.withDiscount }
					discountEndDate={ this.props.discountEndDate }
				/>
			);
		}

		const hideFreePlan =
			! is2023PricingGridActivePage( window ) || this.props.isDomainAndPlanPackageFlow;

		return (
			<PlansFeaturesMain
				redirectToAddDomainFlow={ this.props.redirectToAddDomainFlow }
				hidePlanTypeSelector={ this.props.domainAndPlanPackage && ! this.props.isDomainUpsell }
				hideFreePlan={ hideFreePlan }
				customerType={ this.props.customerType }
				intervalType={ this.props.intervalType }
				selectedFeature={ this.props.selectedFeature }
				selectedPlan={ this.props.selectedPlan }
				redirectTo={ this.props.redirectTo }
				withDiscount={ this.props.withDiscount }
				discountEndDate={ this.props.discountEndDate }
				site={ selectedSite }
				plansWithScroll={ false }
				showTreatmentPlansReorderTest={ this.props.showTreatmentPlansReorderTest }
				hidePlansFeatureComparison={ this.props.isDomainAndPlanPackageFlow }
			/>
		);
	}

	renderEcommerceTrialPage() {
		const { intervalType, selectedSite } = this.props;

		if ( ! selectedSite ) {
			return this.renderPlaceholder();
		}

		// Only accept monthly or yearly for the interval; otherwise let the component provide a default.
		const interval =
			intervalType === 'monthly' || intervalType === 'yearly' ? intervalType : undefined;
		return <ECommerceTrialPlansPage interval={ interval } siteSlug={ selectedSite.slug } />;
	}

	render() {
		const {
			selectedSite,
			translate,
			canAccessPlans,
			currentPlan,
			domainAndPlanPackage,
			is2023PricingGridVisible,
			isDomainAndPlanPackageFlow,
			isJetpackNotAtomic,
			isDomainUpsell,
			isDomainUpsellSuggested,
		} = this.props;

		if ( ! selectedSite || this.isInvalidPlanInterval() || ! currentPlan ) {
			return this.renderPlaceholder();
		}

		const currentPlanSlug = selectedSite?.plan?.product_slug;
		const isEcommerceTrial = currentPlanSlug === PLAN_ECOMMERCE_TRIAL_MONTHLY;
		const allDomains = isDomainAndPlanPackageFlow ? getDomainRegistrations( this.props.cart ) : [];
		const yourDomainName = allDomains.length
			? allDomains.slice( -1 )[ 0 ]?.meta
			: translate( 'your domain name' );
		const goBackLink =
			isDomainUpsell && isDomainUpsellSuggested
				? addQueryArgs( `/home/${ selectedSite.slug }` )
				: addQueryArgs( `/domains/add/${ selectedSite.slug }`, {
						domainAndPlanPackage: true,
				  } );
		return (
			<div>
				{ ! isJetpackNotAtomic && (
					<ModernizedLayout dropShadowOnHeader={ isFreePlan( currentPlanSlug ) } />
				) }
				{ selectedSite.ID && <QuerySitePurchases siteId={ selectedSite.ID } /> }
				<DocumentHead title={ translate( 'Plans', { textOnly: true } ) } />
				<PageViewTracker path="/plans/:site" title="Plans" />
				<QueryContactDetailsCache />
				<QueryPlans />
				<TrackComponentView eventName="calypso_plans_view" />
				{ isDomainUpsell && <DomainUpsellDialog domain={ selectedSite.slug } /> }
				{ canAccessPlans && (
					<div>
						{ ! isDomainAndPlanPackageFlow && <PlansHeader /> }
						{ isDomainAndPlanPackageFlow && (
							<>
								<div className="plans__header">
									<DomainAndPlanPackageNavigation goBackLink={ goBackLink } step={ 2 } />

									<FormattedHeader
										brandFont
										headerText={ translate( 'Choose the perfect plan' ) }
										align="center"
									/>

									{ isDomainUpsell && <DomainUpsellDescription /> }
									{ ! isDomainUpsell && (
										<p>
											{ translate(
												'With your annual plan, you’ll get %(domainName)s {{strong}}free for the first year{{/strong}}. You’ll also unlock advanced features that make it easy to build and grow your site.',
												{
													args: {
														domainName: yourDomainName,
													},
													components: {
														strong: <strong />,
													},
												}
											) }
										</p>
									) }
								</div>
							</>
						) }
						<div id="plans" className="plans plans__has-sidebar">
							<PlansNavigation path={ this.props.context.path } />
							<Main
								fullWidthLayout={ is2023PricingGridVisible && ! isEcommerceTrial }
								wideLayout={ ! is2023PricingGridVisible || isEcommerceTrial }
							>
								{ ! isDomainAndPlanPackageFlow && domainAndPlanPackage && (
									<DomainAndPlanUpsellNotice />
								) }
								{ isEcommerceTrial ? this.renderEcommerceTrialPage() : this.renderPlansMain() }
								<PerformanceTrackerStop />
							</Main>
						</div>
					</div>
				) }
				{ ! canAccessPlans && (
					<EmptyContent
						illustration="/calypso/images/illustrations/illustration-404.svg"
						title={ translate( 'You are not authorized to view this page' ) }
					/>
				) }
			</div>
		);
	}
}

const ConnectedPlans = connect( ( state ) => {
	const selectedSiteId = getSelectedSiteId( state );

	const currentPlan = getCurrentPlan( state, selectedSiteId );
	const currentPlanIntervalType = getIntervalTypeForTerm(
		getPlan( currentPlan?.productSlug )?.term
	);
	const is2023PricingGridVisible = is2023PricingGridActivePage( window );

	return {
		currentPlan,
		currentPlanIntervalType,
		purchase: currentPlan ? getByPurchaseId( state, currentPlan.id ) : null,
		selectedSite: getSelectedSite( state ),
		canAccessPlans: canCurrentUser( state, getSelectedSiteId( state ), 'manage_options' ),
		isWPForTeamsSite: isSiteWPForTeams( state, selectedSiteId ),
		isSiteEligibleForMonthlyPlan: isEligibleForWpComMonthlyPlan( state, selectedSiteId ),
		showTreatmentPlansReorderTest: isTreatmentPlansReorderTest( state ),
		plansLoaded: Boolean( getPlanSlug( state, getPlan( PLAN_FREE )?.getProductId() || 0 ) ),
		is2023PricingGridVisible,
		isDomainAndPlanPackageFlow: !! getCurrentQueryArguments( state )?.domainAndPlanPackage,
		isJetpackNotAtomic: isJetpackSite( state, selectedSiteId, { treatAtomicAsJetpackSite: false } ),
		isDomainUpsell:
			!! getCurrentQueryArguments( state )?.domainAndPlanPackage &&
			!! getCurrentQueryArguments( state )?.domain,
		isDomainUpsellSuggested: getCurrentQueryArguments( state )?.domain === 'true',
	};
} )( withCartKey( withShoppingCart( localize( withTrackingTool( 'HotJar' )( Plans ) ) ) ) );

export default function PlansWrapper( props ) {
	return (
		<CalypsoShoppingCartProvider>
			<ConnectedPlans { ...props } />
		</CalypsoShoppingCartProvider>
	);
}
