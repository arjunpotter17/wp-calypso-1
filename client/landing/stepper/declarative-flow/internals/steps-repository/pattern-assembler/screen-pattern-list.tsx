import { useTranslate } from 'i18n-calypso';
import NavigatorHeader from './navigator-header';
import PatternSelector from './pattern-selector';
import { useSectionPatterns } from './patterns-data';
import type { Pattern } from './types';

interface Props {
	selectedPattern: Pattern | null;
	onSelect: ( selectedPattern: Pattern | null ) => void;
	onBack: () => void;
	onDoneClick: () => void;
}

const ScreenPatternList = ( { selectedPattern, onSelect, onBack, onDoneClick }: Props ) => {
	const translate = useTranslate();
	const patterns = useSectionPatterns();

	return (
		<>
			<NavigatorHeader title={ translate( 'Add patterns' ) } />
			<div className="screen-container__body">
				<PatternSelector
					patterns={ patterns }
					onSelect={ onSelect }
					onBack={ onBack }
					onDoneClick={ onDoneClick }
					selectedPattern={ selectedPattern }
				/>
			</div>
		</>
	);
};

export default ScreenPatternList;
