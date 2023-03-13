import { useQuery } from '@tanstack/react-query';

export const useGeoLocationQuery = () =>
	useQuery( [ 'geo' ], () =>
		globalThis
			.fetch( 'https://public-api.wordpress.com/geo/' )
			.then( ( response ) => response.json() )
	);
