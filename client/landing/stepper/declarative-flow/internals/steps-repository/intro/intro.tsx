import { Button } from '@automattic/components';
import { createInterpolateElement } from '@wordpress/element';
import { useI18n } from '@wordpress/react-i18n';
import type { WPElement } from '@wordpress/element';

interface Props {
	onSubmit: () => void;
	flowName: string;
}

interface IntroContent {
	[ key: string ]: {
		title: WPElement;
	};
}

const Intro: React.FC< Props > = ( { onSubmit, flowName } ) => {
	const { __ } = useI18n();

	const introContent: IntroContent = {
		newsletter: {
			title: createInterpolateElement(
				__( 'You’re 3 minutes away from<br />a launch-ready Newsletter. ' ),
				{ br: <br /> }
			),
		},
		'link-in-bio': {
			title: createInterpolateElement(
				__( 'You’re 3 minutes away from<br />a stand-out Link in Bio site.<br />Ready? ' ),
				{ br: <br /> }
			),
		},
	};

	return (
		<div className="intro__content">
			<h1 className="intro__title">
				<span>{ introContent[ flowName ].title }</span>
			</h1>
			<Button className="intro__button" primary onClick={ onSubmit }>
				{ __( 'Get started' ) }
			</Button>
		</div>
	);
};

export default Intro;
