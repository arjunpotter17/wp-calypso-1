import LanguagePicker, { createLanguageGroups } from '@automattic/language-picker';
import languages from '@automattic/languages';
import { ActionButtons, BackButton } from '@automattic/onboarding';
import { useSelect } from '@wordpress/data';
import { useI18n } from '@wordpress/react-i18n';
import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { ChangeLocaleContextConsumer } from '../../components/locale-context';
import useLastLocation from '../../hooks/use-last-location';
import { Step, usePath } from '../../path';
import { I18N_STORE } from '../../stores/i18n';
import { USER_STORE } from '../../stores/user';
import type { StepNameType } from '../../path';
import type { I18nSelect, UserSelect } from '@automattic/data-stores';

import './style.scss';

const LOCALIZED_LANGUAGE_NAMES_FALLBACK_LOCALE = 'en';

interface Props {
	previousStep?: StepNameType;
}

const LanguageStep: React.FunctionComponent< Props > = ( { previousStep } ) => {
	const { __ } = useI18n();

	const currentUser = useSelect(
		( select ) => ( select( USER_STORE ) as UserSelect ).getCurrentUser(),
		[]
	);

	const localizedLanguageNames = useSelect(
		( select ) =>
			( select( I18N_STORE ) as I18nSelect ).getLocalizedLanguageNames(
				currentUser?.language ?? LOCALIZED_LANGUAGE_NAMES_FALLBACK_LOCALE
			),
		[ currentUser?.language ]
	);

	// keep a static reference to the previous step
	const staticPreviousStep = React.useRef( previousStep );

	const history = useHistory();
	const makePath = usePath();
	const { goLastLocation } = useLastLocation();

	const goBack = ( lang = '' ) => {
		staticPreviousStep.current
			? history.push( makePath( Step[ staticPreviousStep.current ], lang ) )
			: goLastLocation();
	};

	return (
		<ChangeLocaleContextConsumer>
			{ ( changeLocale ) => (
				<div className="gutenboarding-page language">
					<LanguagePicker
						headingTitle={ __( 'Select your site language' ) }
						headingButtons={
							<ActionButtons>
								<BackButton onClick={ () => goBack() } />
							</ActionButtons>
						}
						languageGroups={ createLanguageGroups( __ ) }
						languages={ languages }
						onSelectLanguage={ ( language ) => {
							changeLocale( language.langSlug );
							goBack( language.langSlug );
						} }
						localizedLanguageNames={ localizedLanguageNames }
					/>
				</div>
			) }
		</ChangeLocaleContextConsumer>
	);
};

export default LanguageStep;
