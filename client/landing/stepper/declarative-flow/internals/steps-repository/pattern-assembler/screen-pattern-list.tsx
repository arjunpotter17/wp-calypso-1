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
	const patterns = useSectionPatterns();

	return (
		<div className="screen-container__body--no-margin">
			<PatternSelector
				patterns={ patterns }
				onSelect={ onSelect }
				onBack={ onBack }
				onDoneClick={ onDoneClick }
				selectedPattern={ selectedPattern }
				showDoneButton
				showHeader
			/>
		</div>
	);
};

export default ScreenPatternList;
