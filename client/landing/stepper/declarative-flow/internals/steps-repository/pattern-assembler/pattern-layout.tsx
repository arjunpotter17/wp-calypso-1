import { Button, Popover } from '@automattic/components';
import { Icon, plus } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
import { useState, useRef } from 'react';
import AsyncLoad from 'calypso/components/async-load';
import PatternActionBar from './pattern-action-bar';
import type { Pattern } from './types';

type PatternLayoutProps = {
	header?: Pattern | null;
	sections: Pattern[];
	footer?: Pattern | null;
	onAddHeader?: () => void;
	onReplaceHeader?: () => void;
	onDeleteHeader?: () => void;
	onAddSection: () => void;
	onReplaceSection: ( position: number ) => void;
	onDeleteSection: ( position: number ) => void;
	onMoveUpSection: ( position: number ) => void;
	onMoveDownSection: ( position: number ) => void;
	onAddFooter?: () => void;
	onReplaceFooter?: () => void;
	onDeleteFooter?: () => void;
};

const PatternLayout = ( {
	sections,
	onAddSection,
	onReplaceSection,
	onDeleteSection,
	onMoveUpSection,
	onMoveDownSection,
}: PatternLayoutProps ) => {
	const translate = useTranslate();
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );
	const addButtonContainerRef = useRef< HTMLDivElement | null >( null );

	return (
		<div className="pattern-layout">
			{ sections.length > 0 && (
				<AsyncLoad require="./animate-list" featureName="domMax" placeholder={ <div /> }>
					{ ( m: any ) => (
						<m.ul className="pattern-layout__list" layoutScroll>
							{ sections.map( ( { category, key }: Pattern, index ) => {
								return (
									<m.li
										key={ key }
										layout="position"
										exit={ { opacity: 0, x: -50, transition: { duration: 0.2 } } }
										className="pattern-layout__list-item"
									>
										<span className="pattern-layout__list-item-text" title={ category }>
											{ `${ index + 1 }. ${ category }` }
										</span>
										<PatternActionBar
											patternType="section"
											onReplace={ () => onReplaceSection( index ) }
											onDelete={ () => onDeleteSection( index ) }
											onMoveUp={ () => onMoveUpSection( index ) }
											onMoveDown={ () => onMoveDownSection( index ) }
											enableMoving={ true }
											disableMoveUp={ index === 0 }
											disableMoveDown={ sections?.length === index + 1 }
										/>
									</m.li>
								);
							} ) }
						</m.ul>
					) }
				</AsyncLoad>
			) }
			<div
				className="pattern-layout__add-button-container"
				ref={ addButtonContainerRef }
				onMouseEnter={ () => setIsPopoverVisible( true ) }
				onMouseLeave={ () => setIsPopoverVisible( false ) }
			>
				<Button className="pattern-layout__add-button" onClick={ () => onAddSection() }>
					<Icon icon={ plus } size={ 32 } />
				</Button>
				<Popover
					className="pattern-layout__add-button-popover"
					context={ addButtonContainerRef.current }
					isVisible={ isPopoverVisible }
					position="right"
					focusOnShow
				>
					{ translate( 'Add your next pattern' ) }
				</Popover>
			</div>
		</div>
	);
};

export default PatternLayout;
