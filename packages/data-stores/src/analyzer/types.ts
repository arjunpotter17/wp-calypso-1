import * as actions from './actions';
import * as selectors from './selectors';
import type { DispatchFromMap, SelectFromMap } from '../mapped-types';

interface Color {
	name: string;
	hex: string;
}

export interface ColorsData {
	link: Color[];
	text: Color[];
	background: Color[];
}

export interface PreferredPalettes {
	preferred_palettes: {
		link: Color;
		text: Color;
		background: Color;
	}[];
}

export interface AnalyzeColorsResponse {
	url: string;
	status: string;
	colors: ColorsData & PreferredPalettes;
}

type SiteUrl = string;
export type ColorsState = {
	analyzing?: boolean;
	colors?: { [ key: SiteUrl ]: ColorsData & PreferredPalettes };
};

export interface Dispatch {
	dispatch: DispatchFromMap< typeof actions >;
}

export type AnalyzerSelect = SelectFromMap< typeof selectors >;
