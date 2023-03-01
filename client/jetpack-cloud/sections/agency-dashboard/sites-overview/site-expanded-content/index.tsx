import classNames from 'classnames';
import BackupStorage from './backup-storage';
import InsightsStats from './insights-stats';
import type { Site } from '../types';

import './style.scss';

interface Props {
	site: Site;
	columns?: string[];
	isSmallScreen?: boolean;
}

const defaultColumns = [ 'stats', 'backup' ];

export default function SiteExpandedContent( {
	site,
	columns = defaultColumns,
	isSmallScreen = false,
}: Props ) {
	const stats = site.site_stats;

	return (
		<div
			className={ classNames( 'site-expanded-content', {
				'is-small-screen': isSmallScreen,
			} ) }
		>
			{ columns.includes( 'stats' ) && stats && <InsightsStats stats={ stats } /> }
			{ columns.includes( 'backup' ) && stats && <BackupStorage site={ site } /> }
		</div>
	);
}
