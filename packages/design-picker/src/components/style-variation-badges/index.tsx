import { useMemo } from 'react';
import Badge from './badge';
import type { StyleVariation } from '../../types';
import './style.scss';

const SPACE_BAR_KEYCODE = 32;

interface BadgesProps {
	maxVariationsToShow?: number;
	variations: StyleVariation[];
	onMoreClick?: () => void;
	onClick?: ( variation: StyleVariation ) => void;
	selectedVariation?: StyleVariation;
	firstVariation?: StyleVariation;
}

const Badges: React.FC< BadgesProps > = ( {
	maxVariationsToShow = 4,
	variations = [],
	onMoreClick,
	onClick,
	selectedVariation,
	firstVariation,
} ) => {
	const variationsToShow = useMemo( () => {
		if ( firstVariation ) {
			return [
				firstVariation,
				...variations
					.filter( ( variation ) => variation.slug !== firstVariation.slug )
					.slice( 0, maxVariationsToShow - 1 ),
			];
		}

		return variations.slice( 0, maxVariationsToShow );
	}, [ variations, maxVariationsToShow, firstVariation ] );

	return (
		<>
			{ variationsToShow.map( ( variation ) => (
				<Badge
					key={ variation.slug }
					variation={ variation }
					onClick={ onClick }
					isSelected={
						( ! selectedVariation && variation.slug === 'default' ) ||
						variation.slug === selectedVariation?.slug
					}
				/>
			) ) }
			{ variations.length > variationsToShow.length && (
				<div
					className="style-variation__badge-more-wrapper"
					tabIndex={ 0 }
					role="button"
					onClick={ ( e ) => {
						if ( onMoreClick ) {
							// Prevent the event from bubbling to the the parent button.
							e.stopPropagation();
							onMoreClick();
						}
					} }
					onKeyDown={ ( e ) => {
						if ( onMoreClick && e.keyCode === SPACE_BAR_KEYCODE ) {
							// Prevent the event from bubbling to the the parent button.
							e.stopPropagation();
							onMoreClick();
						}
					} }
				>
					<span>{ `+${ variations.length - variationsToShow.length }` }</span>
				</div>
			) }
		</>
	);
};

export default Badges;
