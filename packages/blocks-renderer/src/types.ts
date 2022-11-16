export type RenderedPattern = {
	ID: number;
	title: string;
	html: string;
	styles: string[];
};

export type RenderedPatterns = {
	[ key: string ]: RenderedPattern;
};
