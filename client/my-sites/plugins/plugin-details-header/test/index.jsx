/**
 * @jest-environment jsdom
 */
import config from '@automattic/calypso-config';
import { render, screen } from '@testing-library/react';
import PluginDetailsHeader from 'calypso/my-sites/plugins/plugin-details-header';

jest.mock( 'react-redux', () => ( {
	...jest.requireActual( 'react-redux' ),
	useSelector: jest.fn(),
} ) );

jest.mock( '@automattic/calypso-config', () => {
	const fn = ( key ) => {
		if ( 'magnificent_non_en_locales' === key ) {
			return [
				'es',
				'pt-br',
				'de',
				'fr',
				'he',
				'ja',
				'it',
				'nl',
				'ru',
				'tr',
				'id',
				'zh-cn',
				'zh-tw',
				'ko',
				'ar',
				'sv',
			];
		}
	};
	fn.isEnabled = jest.fn();
	return fn;
} );

const plugin = {
	name: 'Yoast SEO Premium',
	slug: 'wordpress-seo-premium',
	author_name: 'Team Yoast',
	author_profile: 'https://profiles.wordpress.org/yoast/',
};

describe( 'PluginDetailsHeader', () => {
	const mockedProps = {
		isJetpackCloud: false,
		isPlaceholder: false,
		plugin,
	};

	test.each( [ { configEnabled: true }, { configEnabled: false } ] )(
		'should render the correct author url (configEnabled: $configEnabled)',
		( { configEnabled } ) => {
			config.isEnabled.mockImplementation( () => configEnabled );
			render( <PluginDetailsHeader { ...mockedProps } /> );
			const want = /\/plugins\/.*\?s=developer:.*/;
			const have = screen.getByText( plugin.author_name ).getAttribute( 'href' );
			expect( have ).toMatch( want );
		}
	);
} );
