import { Card, Dialog, FormInputValidation } from '@automattic/components';
import { supported } from '@github/webauthn-json';
import debugFactory from 'debug';
import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import FormButton from 'calypso/components/forms/form-button';
import FormCheckbox from 'calypso/components/forms/form-checkbox';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormLabel from 'calypso/components/forms/form-label';
import FormVerificationCodeInput from 'calypso/components/forms/form-verification-code-input';
import Notice from 'calypso/components/notice';
import { recordGoogleEvent } from 'calypso/state/analytics/actions';
import { redirectToLogout } from 'calypso/state/current-user/actions';
import { getCurrentUserId } from 'calypso/state/current-user/selectors';
import SecurityKeyForm from './security-key-form';
import TwoFactorActions from './two-factor-actions';

import './style.scss';

const debug = debugFactory( 'calypso:me:reauth-required' );

// autofocus is used for tracking purposes, not an a11y issue
/* eslint-disable jsx-a11y/no-autofocus, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/anchor-is-valid */
class ReauthRequired extends Component {
	codeRequestTimer = false;

	constructor( props ) {
		super( props );

		this.state = {
			remember2fa: false, // Should the 2fa be remembered for 30 days?
			code: '', // User's generated 2fa code
			smsRequestsAllowed: true, // Can the user request another SMS code?
			twoFactorAuthType: 'authenticator',
			isReauthRequired: props.twoStepAuthorization.isReauthRequired(),
		};
	}

	componentDidMount() {
		this.props.twoStepAuthorization.on( 'change', this.update );
	}

	componentWillUnmount() {
		clearTimeout( this.codeRequestTimer );
		this.props.twoStepAuthorization.off( 'change', this.update );
	}

	update = () => {
		this.setState( {
			isReauthRequired: this.props.twoStepAuthorization.isReauthRequired(),
		} );
	};

	getClickHandler = ( action, callback ) => () => {
		this.props.recordGoogleEvent( 'Me', 'Clicked on ' + action );

		if ( callback ) {
			callback();
		}
	};

	getCheckboxHandler = ( checkboxName ) => ( event ) => {
		const action = 'Clicked ' + checkboxName + ' checkbox';
		const value = event.target.checked ? 1 : 0;

		this.props.recordGoogleEvent( 'Me', action, 'checked', value );
	};

	getFocusHandler = ( action ) => () =>
		this.props.recordGoogleEvent( 'Me', 'Focused on ' + action );

	renderCodeMessage() {
		if ( this.props.twoStepAuthorization.isTwoStepSMSEnabled() ) {
			return this.props.translate(
				'Press the button below to request an SMS verification code. ' +
					'Once you receive our text message at your phone number ending with ' +
					'{{strong}}%(smsLastFour)s{{/strong}} , enter the code below.',
				{
					args: {
						smsLastFour: this.props.twoStepAuthorization.getSMSLastFour(),
					},
					components: {
						strong: <strong />,
					},
				}
			);
		}
		if ( this.state.twoFactorAuthType === 'sms' ) {
			return this.props.translate(
				'We just sent you a verification code to your phone number on file, please enter the code below.'
			);
		}

		return this.props.translate(
			'Please enter the verification code generated by your authenticator app.'
		);
	}

	submitForm = ( event ) => {
		event.preventDefault();
		this.setState( { validatingCode: true } );

		this.props.twoStepAuthorization.validateCode(
			{
				code: this.state.code,
				remember2fa: this.state.remember2fa,
			},
			( error, data ) => {
				this.setState( { validatingCode: false } );
				if ( error ) {
					debug( 'There was an error validating that code: ' + JSON.stringify( error ) );
				} else {
					debug( 'The code validated!' + JSON.stringify( data ) );
				}
			}
		);
	};

	sendSMSCode() {
		this.setState( { smsRequestsAllowed: false } );
		this.codeRequestTimer = setTimeout( () => {
			this.setState( { smsRequestsAllowed: true } );
		}, 60000 );

		this.props.twoStepAuthorization.sendSMSCode( ( error, data ) => {
			if ( ! error && data.sent ) {
				debug( 'SMS code successfully sent' );
			} else {
				debug( 'There was a failure sending the SMS code.' );
			}
		} );
	}

	preValidateAuthCode() {
		return this.state.code.length && this.state.code.length > 5;
	}

	loginUserWithSecurityKey = () => {
		return this.props.twoStepAuthorization.loginUserWithSecurityKey( {
			user_id: this.props.currentUserId,
		} );
	};

	renderFailedValidationMsg() {
		if ( ! this.props.twoStepAuthorization.codeValidationFailed() ) {
			return null;
		}

		return (
			<FormInputValidation
				isError
				text={ this.props.translate( 'You entered an invalid code. Please try again.' ) }
			/>
		);
	}

	renderSMSResendThrottled() {
		if ( ! this.props.twoStepAuthorization.isSMSResendThrottled() ) {
			return null;
		}

		return (
			<div className="reauth-required__send-sms-throttled">
				<Notice
					showDismiss={ false }
					text={ this.props.translate(
						'SMS codes are limited to once per minute. Please wait and try again.'
					) }
				/>
			</div>
		);
	}

	renderVerificationForm() {
		const method = this.props.twoStepAuthorization.isTwoStepSMSEnabled() ? 'sms' : 'app';
		return (
			<Card compact>
				<p>{ this.renderCodeMessage() }</p>

				<p>
					<a
						className="reauth-required__sign-out"
						onClick={ this.getClickHandler(
							'Reauth Required Log Out Link',
							this.props.redirectToLogout
						) }
					>
						{ this.props.translate( 'Not you? Log out' ) }
					</a>
				</p>

				<form onSubmit={ this.submitForm }>
					<FormFieldset>
						<FormLabel htmlFor="code">{ this.props.translate( 'Verification Code' ) }</FormLabel>
						<FormVerificationCodeInput
							autoFocus
							id="code"
							isError={ this.props.twoStepAuthorization.codeValidationFailed() }
							name="code"
							method={ method }
							onFocus={ this.getFocusHandler( 'Reauth Required Verification Code Field' ) }
							value={ this.state.code }
							onChange={ this.handleChange }
						/>

						{ this.renderFailedValidationMsg() }
					</FormFieldset>

					<FormFieldset>
						<FormLabel>
							<FormCheckbox
								id="remember2fa"
								name="remember2fa"
								onClick={ this.getCheckboxHandler( 'Remember 2fa' ) }
								checked={ this.state.remember2fa }
								onChange={ this.handleCheckedChange }
							/>
							<span>{ this.props.translate( 'Remember for 30 days.' ) }</span>
						</FormLabel>
					</FormFieldset>

					{ this.renderSMSResendThrottled() }

					<FormButton
						className="reauth-required__button"
						disabled={ this.state.validatingCode || ! this.preValidateAuthCode() }
						onClick={ this.getClickHandler( 'Submit Validation Code on Reauth Required' ) }
					>
						{ this.props.translate( 'Verify' ) }
					</FormButton>
				</form>
			</Card>
		);
	}

	renderDialog() {
		const method = this.props.twoStepAuthorization.isTwoStepSMSEnabled() ? 'sms' : 'authenticator';
		const isSecurityKeySupported =
			this.props.twoStepAuthorization.isSecurityKeyEnabled() && supported();
		const { twoFactorAuthType } = this.state;
		// This enables the SMS button on the security key form regardless if we can send SMS or not.
		// Otherwise, there's no way to go back to the verification form if smsRequestsAllowed is false.
		const shouldEnableSmsButton =
			this.state.smsRequestsAllowed || ( method === 'sms' && twoFactorAuthType === 'webauthn' );

		const hasSmsRecoveryNumber =
			!! this.props?.twoStepAuthorization?.data?.two_step_sms_last_four?.length;

		return (
			<Dialog
				autoFocus={ false }
				className="reauth-required__dialog"
				isFullScreen={ false }
				isVisible={ this.state.isReauthRequired }
			>
				{ isSecurityKeySupported && twoFactorAuthType === 'webauthn' ? (
					<SecurityKeyForm
						loginUserWithSecurityKey={ this.loginUserWithSecurityKey }
						onComplete={ this.refreshNonceOnFailure }
					/>
				) : (
					this.renderVerificationForm()
				) }
				<TwoFactorActions
					twoFactorAuthType={ twoFactorAuthType }
					onChange={ this.handleAuthSwitch }
					isSmsSupported={
						method === 'sms' || ( method === 'authenticator' && hasSmsRecoveryNumber )
					}
					isAuthenticatorSupported={ method !== 'sms' }
					isSmsAllowed={ shouldEnableSmsButton }
					isSecurityKeySupported={ isSecurityKeySupported }
				/>
			</Dialog>
		);
	}

	render() {
		return (
			<>
				{ this.renderDialog() }
				{ ! this.state.isReauthRequired && this.props.children?.() }
			</>
		);
	}

	refreshNonceOnFailure = ( error ) => {
		const errors = [].slice.call( error?.data?.errors ?? [] );
		if ( errors.some( ( e ) => e.code === 'invalid_two_step_nonce' ) ) {
			this.props.twoStepAuthorization.fetch();
		}
	};

	handleAuthSwitch = ( authType ) => {
		this.setState( { twoFactorAuthType: authType } );
		if ( authType === 'sms' ) {
			this.sendSMSCode();
		}
	};

	handleChange = ( e ) => {
		const { name, value } = e.currentTarget;
		this.setState( { [ name ]: value } );
	};

	handleCheckedChange = ( e ) => {
		const { name, checked } = e.currentTarget;
		this.setState( { [ name ]: checked } );
	};
}

ReauthRequired.propTypes = {
	currentUserId: PropTypes.number.isRequired,
};

/* eslint-enable jsx-a11y/no-autofocus, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/anchor-is-valid */

export default connect(
	( state ) => ( {
		currentUserId: getCurrentUserId( state ),
	} ),
	{
		redirectToLogout,
		recordGoogleEvent,
	}
)( localize( ReauthRequired ) );
