import Main from 'calypso/components/main';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';

const ECommerceTrialExpired = (): JSX.Element => {
	return (
		<Main wideLayout>
			<PageViewTracker
				path="/plans/my-plan/trial-expired/:site"
				title="Plans > Ecommerce Trial Expired"
			/>
			<div className="ecommerce-trial-expired__content">
				<div className="ecommerce-trial-expired__header">
					<h1 className="ecommerce-trial-expired__title">Your free trial has ended</h1>
					<div className="ecommerce-trial-expired__subtitle">
						Don’t lose all that hard work! Upgrade to a paid plan to continue working on your store.
						Unlock more features, launch and start selling, and make your business venture a
						reality.
					</div>
				</div>
			</div>
		</Main>
	);
};

export default ECommerceTrialExpired;
