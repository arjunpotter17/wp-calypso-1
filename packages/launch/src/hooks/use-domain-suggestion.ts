import { useLocale } from '@automattic/i18n-utils';
import { useSelect } from '@wordpress/data';
import { DOMAIN_SUGGESTIONS_STORE } from '../stores';
import { useDomainSearch } from './';
import type { DomainSuggestions, DomainSuggestionsSelect } from '@automattic/data-stores';

export function useDomainSuggestion(): DomainSuggestions.DomainSuggestion | undefined {
	const locale = useLocale();
	const { domainSearch } = useDomainSearch();

	const suggestion = useSelect(
		( select ) => {
			if ( ! domainSearch || domainSearch.length < 2 ) {
				return;
			}
			return ( select( DOMAIN_SUGGESTIONS_STORE ) as DomainSuggestionsSelect ).getDomainSuggestions(
				domainSearch,
				{
					// Avoid `only_wordpressdotcom` — it seems to fail to find results sometimes
					include_wordpressdotcom: false,
					include_dotblogsubdomain: false,
					quantity: 1, // this will give the recommended domain only
					locale,
				}
			);
		},
		[ domainSearch, locale ]
	)?.[ 0 ];

	return suggestion;
}
