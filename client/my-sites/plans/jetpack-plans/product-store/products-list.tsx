import { useTranslate } from 'i18n-calypso';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { FeaturedItemCard } from './featured-item-card';
import { HeroImage } from './hero-image';
import { useCreateCheckout } from './hooks/use-create-checkout';
import { useProductsToDisplay } from './hooks/use-products-to-display';
import { MostPopular } from './most-popular';
import type { ProductsListProps } from './types';

export const ProductsList: React.FC< ProductsListProps > = ( {
	createCheckoutURL,
	duration,
	onClickPurchase,
	siteId,
} ) => {
	const [ popularItems, otherItems ] = useProductsToDisplay( { duration, siteId } );
	const translate = useTranslate();

	const { getCheckoutURL, getOnClickPurchase, isOwned } = useCreateCheckout( {
		createCheckoutURL,
		onClickPurchase,
		duration,
		siteId,
	} );

	const mostPopularItems = popularItems.map( ( item ) => {
		return (
			<FeaturedItemCard
				key={ item.productSlug }
				hero={ <HeroImage item={ item } /> }
				isOwned={ isOwned( item ) }
				item={ item }
				siteId={ siteId }
				onClickMore={ () => {
					recordTracksEvent( 'calypso_product_more_about_product_click', {
						product: item.productSlug,
					} );
					// TODO: Open modal
				} }
				onClickPurchase={ getOnClickPurchase( item ) }
				checkoutURL={ getCheckoutURL( item ) }
			/>
		);
	} );

	return (
		<div className="jetpack-product-store__products-list">
			<MostPopular heading={ translate( 'Most popular products' ) } items={ mostPopularItems } />

			<div className="jetpack-product-store__products-list-all">
				<h3>{ translate( 'All products' ) }</h3>
				<ul>
					{ otherItems.map( ( item ) => {
						// TODO relace this with product card
						return <li key={ item.productSlug }>{ item.displayName }</li>;
					} ) }
				</ul>
			</div>
		</div>
	);
};
