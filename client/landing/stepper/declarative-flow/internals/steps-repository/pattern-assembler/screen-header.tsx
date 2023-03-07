import { useTranslate } from 'i18n-calypso';
import NavigatorHeader from './navigator-header';
import PatternSelector from './pattern-selector';
import { useHeaderPatterns } from './patterns-data';
import type { Pattern } from './types';

interface Props {
	selectedPattern: Pattern | null;
	onSelect: ( selectedPattern: Pattern | null ) => void;
	onBack: () => void;
	onDoneClick: () => void;
}

const ScreenHeader = ( { selectedPattern, onSelect, onBack, onDoneClick }: Props ) => {
	const translate = useTranslate();
	const patterns = useHeaderPatterns();

	return (
		<>
			<NavigatorHeader
				title={ translate( 'Choose a header' ) }
				description={ translate(
					'Your header will be added to all pages and is usually where your site navigation lives.'
				) }
			/>
			<div className="screen-container__body--no-margin">
				<PatternSelector
					patterns={ patterns }
					onSelect={ onSelect }
					onBack={ onBack }
					onDoneClick={ onDoneClick }
					selectedPattern={ selectedPattern }
					emptyPatternText={ translate( 'No Header' ) }
					showDoneButton
				/>
			</div>
		</>
	);
};

export default ScreenHeader;
