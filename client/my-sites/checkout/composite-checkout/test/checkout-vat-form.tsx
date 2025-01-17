/**
 * @jest-environment jsdom
 */
import { convertResponseCartToRequestCart } from '@automattic/shopping-cart';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import useCartKey from 'calypso/my-sites/checkout/use-cart-key';
import { isMarketplaceProduct } from 'calypso/state/products-list/selectors';
import { getDomainsBySiteId, hasLoadedSiteDomains } from 'calypso/state/sites/domains/selectors';
import { getPlansBySiteId } from 'calypso/state/sites/plans/selectors/get-plans-by-site';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import {
	planWithoutDomain,
	mockSetCartEndpointWith,
	getActivePersonalPlanDataForType,
	mockCachedContactDetailsEndpoint,
	mockContactDetailsValidationEndpoint,
	getBasicCart,
	mockMatchMediaOnWindow,
	mockGetVatInfoEndpoint,
	mockSetVatInfoEndpoint,
} from './util';
import { MockCheckout } from './util/mock-checkout';
import type { CartKey } from '@automattic/shopping-cart';

jest.mock( 'calypso/state/sites/selectors' );
jest.mock( 'calypso/state/sites/domains/selectors' );
jest.mock( 'calypso/state/selectors/is-site-automated-transfer' );
jest.mock( 'calypso/state/sites/plans/selectors/get-plans-by-site' );
jest.mock( 'calypso/my-sites/checkout/use-cart-key' );
jest.mock( 'calypso/lib/analytics/utils/refresh-country-code-cookie-gdpr' );
jest.mock( 'calypso/state/products-list/selectors/is-marketplace-product' );
jest.mock( 'calypso/lib/navigate' );

describe( 'Checkout contact step VAT form', () => {
	const mainCartKey: CartKey = 'foo.com' as CartKey;
	const initialCart = getBasicCart();
	const defaultPropsForMockCheckout = {
		mainCartKey,
		initialCart,
	};

	getPlansBySiteId.mockImplementation( () => ( {
		data: getActivePersonalPlanDataForType( 'yearly' ),
	} ) );
	hasLoadedSiteDomains.mockImplementation( () => true );
	getDomainsBySiteId.mockImplementation( () => [] );
	isMarketplaceProduct.mockImplementation( () => false );
	isJetpackSite.mockImplementation( () => false );
	useCartKey.mockImplementation( () => mainCartKey );
	mockMatchMediaOnWindow();

	const mockSetCartEndpoint = mockSetCartEndpointWith( {
		currency: initialCart.currency,
		locale: initialCart.locale,
	} );

	beforeEach( () => {
		nock.cleanAll();
		nock( 'https://public-api.wordpress.com' ).persist().post( '/rest/v1.1/logstash' ).reply( 200 );
		mockGetVatInfoEndpoint( {} );
	} );

	it( 'does not render the VAT field checkbox if the selected country does not support VAT', async () => {
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), 'US' );
		expect( screen.queryByLabelText( 'Add Business Tax ID details' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the VAT field checkbox if the selected country does support VAT', async () => {
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), 'GB' );
		expect( await screen.findByLabelText( 'Add Business Tax ID details' ) ).toBeInTheDocument();
	} );

	it( 'does not render the VAT fields if the checkbox is not checked', async () => {
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), 'GB' );
		expect( await screen.findByLabelText( 'Add Business Tax ID details' ) ).not.toBeChecked();
		expect( screen.queryByLabelText( 'Business Tax ID Number' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the VAT fields if the checkbox is checked', async () => {
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), 'GB' );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		expect( await screen.findByLabelText( 'Add Business Tax ID details' ) ).toBeChecked();
		expect( await screen.findByLabelText( 'Business Tax ID Number' ) ).toBeInTheDocument();
	} );

	it( 'does not render the Northern Ireland checkbox is if the VAT checkbox is checked and the country is EU', async () => {
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), 'ES' );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		expect(
			screen.queryByLabelText( 'Is the tax ID for Northern Ireland?' )
		).not.toBeInTheDocument();
	} );

	it( 'renders the Northern Ireland checkbox is if the VAT checkbox is checked and the country is GB', async () => {
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), 'GB' );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		expect(
			await screen.findByLabelText( 'Is the tax ID for Northern Ireland?' )
		).toBeInTheDocument();
	} );

	it( 'hides the Northern Ireland checkbox is if the VAT checkbox is checked and the country is changed from GB to ES', async () => {
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), 'GB' );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		expect(
			await screen.findByLabelText( 'Is the tax ID for Northern Ireland?' )
		).toBeInTheDocument();
		await user.selectOptions( await screen.findByLabelText( 'Country' ), 'ES' );
		expect(
			screen.queryByLabelText( 'Is the tax ID for Northern Ireland?' )
		).not.toBeInTheDocument();
	} );

	it( 'renders the VAT fields and checks the box on load if the VAT endpoint returns data', async () => {
		nock.cleanAll();
		mockCachedContactDetailsEndpoint( {
			country_code: 'GB',
			postal_code: '',
		} );
		mockContactDetailsValidationEndpoint( 'tax', { success: false, messages: [ 'Invalid' ] } );
		mockGetVatInfoEndpoint( {
			id: '12345',
			name: 'Test company',
			address: '123 Main Street',
			country: 'GB',
		} );
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for checkout to load.
		await screen.findByLabelText( 'Continue with the entered contact details' );
		const countryField = await screen.findByLabelText( 'Country' );

		expect( countryField.selectedOptions[ 0 ].value ).toBe( 'GB' );
		expect( await screen.findByLabelText( 'Add Business Tax ID details' ) ).toBeChecked();
		expect( await screen.findByLabelText( 'Business Tax ID Number' ) ).toBeInTheDocument();
	} );

	it( 'renders the VAT fields pre-filled if the VAT endpoint returns data', async () => {
		nock.cleanAll();
		mockCachedContactDetailsEndpoint( {
			country_code: 'GB',
			postal_code: '',
		} );
		mockContactDetailsValidationEndpoint( 'tax', { success: false, messages: [ 'Invalid' ] } );
		mockGetVatInfoEndpoint( {
			id: '12345',
			name: 'Test company',
			address: '123 Main Street',
			country: 'GB',
		} );
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for checkout to load.
		await screen.findByLabelText( 'Continue with the entered contact details' );
		const countryField = await screen.findByLabelText( 'Country' );

		expect( countryField.selectedOptions[ 0 ].value ).toBe( 'GB' );
		expect( await screen.findByLabelText( 'Business Tax ID Number' ) ).toHaveValue( '12345' );
		expect( await screen.findByLabelText( 'Organization for tax ID' ) ).toHaveValue(
			'Test company'
		);
		expect( await screen.findByLabelText( 'Address for tax ID' ) ).toHaveValue( '123 Main Street' );
	} );

	it( 'does not allow unchecking the VAT details checkbox if the VAT fields are pre-filled', async () => {
		nock.cleanAll();
		mockCachedContactDetailsEndpoint( {
			country_code: 'GB',
			postal_code: '',
		} );
		mockContactDetailsValidationEndpoint( 'tax', { success: false, messages: [ 'Invalid' ] } );
		mockGetVatInfoEndpoint( {
			id: '12345',
			name: 'Test company',
			address: '123 Main Street',
			country: 'GB',
		} );
		const cartChanges = { products: [ planWithoutDomain ] };
		const user = userEvent.setup();
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for checkout to load.
		await screen.findByLabelText( 'Continue with the entered contact details' );
		const countryField = await screen.findByLabelText( 'Country' );

		expect( countryField.selectedOptions[ 0 ].value ).toBe( 'GB' );
		expect( await screen.findByLabelText( 'Add Business Tax ID details' ) ).toBeChecked();
		expect( await screen.findByLabelText( 'Add Business Tax ID details' ) ).toBeDisabled();

		// Try to click it anyway and make sure it does not change.
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		expect( await screen.findByLabelText( 'Add Business Tax ID details' ) ).toBeChecked();
		expect( await screen.findByLabelText( 'Business Tax ID Number' ) ).toBeInTheDocument();
	} );

	it( 'sends data to the VAT endpoint when completing the step if the box is checked', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		const mockVatEndpoint = mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for the cart to load
		await screen.findByLabelText( 'Continue with the entered contact details' );

		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );
		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( mockVatEndpoint ).toHaveBeenCalledWith( {
			id: vatId,
			name: vatName,
			country: countryCode,
			address: vatAddress,
		} );
	} );

	it( 'sends ID to the VAT endpoint without prefixed country code when completing the step', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		const mockVatEndpoint = mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for the cart to load
		await screen.findByLabelText( 'Continue with the entered contact details' );

		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		await user.type(
			await screen.findByLabelText( 'Business Tax ID Number' ),
			countryCode + vatId
		);
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );
		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( mockVatEndpoint ).toHaveBeenCalledWith( {
			id: vatId,
			name: vatName,
			country: countryCode,
			address: vatAddress,
		} );
	} );

	it( 'sends ID to the VAT endpoint without prefixed Swiss country code and hyphen when completing the step', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'CH';
		const mockVatEndpoint = mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for the cart to load
		await screen.findByLabelText( 'Continue with the entered contact details' );

		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), 'CHE-' + vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );
		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( mockVatEndpoint ).toHaveBeenCalledWith( {
			id: vatId,
			name: vatName,
			country: countryCode,
			address: vatAddress,
		} );
	} );

	it( 'sends ID to the VAT endpoint without prefixed Swiss country code when completing the step', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'CH';
		const mockVatEndpoint = mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for the cart to load
		await screen.findByLabelText( 'Continue with the entered contact details' );

		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), 'CHE' + vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );
		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( mockVatEndpoint ).toHaveBeenCalledWith( {
			id: vatId,
			name: vatName,
			country: countryCode,
			address: vatAddress,
		} );
	} );

	it( 'sends ID to the VAT endpoint without prefixed lowercase Swiss country code when completing the step', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'CH';
		const mockVatEndpoint = mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for the cart to load
		await screen.findByLabelText( 'Continue with the entered contact details' );

		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), 'che' + vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );
		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( mockVatEndpoint ).toHaveBeenCalledWith( {
			id: vatId,
			name: vatName,
			country: countryCode,
			address: vatAddress,
		} );
	} );

	it( 'when there is a cached contact country that differs from the cached VAT country, the contact country is sent to the VAT endpoint', async () => {
		nock.cleanAll();
		const cachedContactCountry = 'ES';
		mockCachedContactDetailsEndpoint( {
			country_code: cachedContactCountry,
			postal_code: '',
		} );
		mockContactDetailsValidationEndpoint( 'tax', { success: false, messages: [ 'Invalid' ] } );
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		mockGetVatInfoEndpoint( {
			id: vatId,
			name: vatName,
			address: vatAddress,
			country: countryCode,
		} );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );

		// Wait for the cart to load
		await screen.findByLabelText( 'Continue with the entered contact details' );
		const countryField = await screen.findByLabelText( 'Country' );

		// Make sure the form has the autocompleted data.
		expect( countryField.selectedOptions[ 0 ].value ).toBe( cachedContactCountry );
		expect( await screen.findByLabelText( 'Add Business Tax ID details' ) ).toBeChecked();
		expect( await screen.findByLabelText( 'Business Tax ID Number' ) ).toHaveValue( vatId );
		expect( await screen.findByLabelText( 'Organization for tax ID' ) ).toHaveValue( vatName );
		expect( await screen.findByLabelText( 'Address for tax ID' ) ).toHaveValue( vatAddress );

		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const mockVatEndpoint = mockSetVatInfoEndpoint();

		// Submit the form.
		await user.click( screen.getByText( 'Continue' ) );

		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( mockVatEndpoint ).toHaveBeenCalledWith( {
			id: vatId,
			name: vatName,
			address: vatAddress,
			country: cachedContactCountry,
		} );
	} );

	it( 'sends data to the VAT endpoint with Northern Ireland country code when completing the step if the XI box is checked', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		const mockVatEndpoint = mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		await user.click( await screen.findByLabelText( 'Is the tax ID for Northern Ireland?' ) );
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );
		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( mockVatEndpoint ).toHaveBeenCalledWith( {
			id: vatId,
			name: vatName,
			address: vatAddress,
			country: 'XI',
		} );
	} );

	it( 'does not send data to the VAT endpoint when completing the step if the box is not checked', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		const mockVatEndpoint = mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		// Check the box
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );

		// Fill in the details
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );

		// Uncheck the box
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );

		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( mockVatEndpoint ).not.toHaveBeenCalled();
	} );

	it( 'sends VAT data to the shopping-cart endpoint when completing the step if the box is checked', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		const postalCode = 'NW1 4NP';
		mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };

		const setCart = jest.fn().mockImplementation( mockSetCartEndpoint );

		render(
			<MockCheckout
				{ ...defaultPropsForMockCheckout }
				cartChanges={ cartChanges }
				setCart={ setCart }
			/>
		);
		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.type( await screen.findByLabelText( 'Postal code' ), postalCode );
		// Check the box
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );

		// Fill in the details
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );

		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( setCart ).toHaveBeenCalledWith(
			mainCartKey,
			convertResponseCartToRequestCart( {
				...initialCart,
				...cartChanges,
				tax: {
					display_taxes: true,
					location: {
						country_code: countryCode,
						postal_code: postalCode,
						subdivision_code: undefined,
						vat_id: vatId,
						organization: vatName,
						address: vatAddress,
					},
				},
			} )
		);
	} );

	it( 'does not send VAT data to the shopping-cart endpoint when completing the step if the box is not checked', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		const postalCode = 'NW1 4NP';
		mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };

		const setCart = jest.fn().mockImplementation( mockSetCartEndpoint );

		render(
			<MockCheckout
				{ ...defaultPropsForMockCheckout }
				cartChanges={ cartChanges }
				setCart={ setCart }
			/>
		);
		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.type( await screen.findByLabelText( 'Postal code' ), postalCode );
		// Check the box
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );

		// Fill in the details
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );

		// Uncheck the box
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );

		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( setCart ).toHaveBeenCalledWith(
			mainCartKey,
			convertResponseCartToRequestCart( {
				...initialCart,
				...cartChanges,
				tax: {
					display_taxes: true,
					location: { country_code: countryCode, postal_code: postalCode },
				},
			} )
		);
	} );

	it( 'does not send VAT data to the shopping-cart endpoint when completing the step if the box is checked but the country no longer supports VAT', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		const nonVatCountryCode = 'US';
		const postalCode = 'NW1 4NP';
		mockSetVatInfoEndpoint();
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };

		const setCart = jest.fn().mockImplementation( mockSetCartEndpoint );

		render(
			<MockCheckout
				{ ...defaultPropsForMockCheckout }
				cartChanges={ cartChanges }
				setCart={ setCart }
			/>
		);
		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.type( await screen.findByLabelText( 'Postal code' ), postalCode );
		// Check the box
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );

		// Fill in the details
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );

		// Change the country to one that does not support VAT
		await user.selectOptions( await screen.findByLabelText( 'Country' ), nonVatCountryCode );

		await user.click( screen.getByText( 'Continue' ) );
		expect( await screen.findByTestId( 'payment-method-step--visible' ) ).toBeInTheDocument();
		expect( setCart ).toHaveBeenCalledWith(
			mainCartKey,
			convertResponseCartToRequestCart( {
				...initialCart,
				...cartChanges,
				tax: {
					display_taxes: true,
					location: { country_code: nonVatCountryCode, postal_code: postalCode },
				},
			} )
		);
	} );

	it( 'does not complete the step if the VAT endpoint returns an error', async () => {
		const vatId = '12345';
		const vatName = 'Test company';
		const vatAddress = '123 Main Street';
		const countryCode = 'GB';
		nock( 'https://public-api.wordpress.com' ).post( '/rest/v1.1/me/vat-info' ).reply( 400 );
		mockContactDetailsValidationEndpoint( 'tax', { success: true } );
		const user = userEvent.setup();
		const cartChanges = { products: [ planWithoutDomain ] };
		render( <MockCheckout { ...defaultPropsForMockCheckout } cartChanges={ cartChanges } /> );
		await user.selectOptions( await screen.findByLabelText( 'Country' ), countryCode );
		await user.click( await screen.findByLabelText( 'Add Business Tax ID details' ) );
		await user.type( await screen.findByLabelText( 'Business Tax ID Number' ), vatId );
		await user.type( await screen.findByLabelText( 'Organization for tax ID' ), vatName );
		await user.type( await screen.findByLabelText( 'Address for tax ID' ), vatAddress );
		await user.click( screen.getByText( 'Continue' ) );
		await expect( screen.findByTestId( 'payment-method-step--visible' ) ).toNeverAppear();
	} );
} );
