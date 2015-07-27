module.exports = ($stateProvider, $urlRouterProvider, $locationProvider) => {
	$locationProvider.html5Mode(true);

	// small hack - both routers(login && main app) work at the same time, so we need to troubleshot this
	$urlRouterProvider.otherwise(($injector, $location) => {
		console.log('login router otherwise: window.loader.isMainApplication()', window.loader.isMainApplication(), $location);
		if (window.loader.isMainApplication())
			return undefined;
		return '/';
	});

	$stateProvider
		.state('login', {
			url: '/',
			templateUrl: 'LavaLogin/login/loginOrSignup'
		})

		.state('auth', {
			url: '/auth',
			templateUrl: 'LavaLogin/login/auth',
			controller:'CtrlAuth'
		})

		.state('secureUsername', {
			url: '/secure',
			templateUrl: 'LavaLogin/login/secureUsername',
			controller:'CtrlSecureUsername'
		})

		.state('reservedUsername', {
			url: '/reserved',
			templateUrl: 'LavaLogin/login/reservedUsername',
			controller:'CtrlReservedUsername'
		})

		.state('verify', {
			url: '/verify/{userName}/{inviteCode}',
			templateUrl: 'LavaLogin/login/verifyInvite',
			controller: 'CtrlVerifyInvite'
		})

		.state('details', {
			url: '/details',
			templateUrl: 'LavaLogin/login/userDetails',
			controller:'CtrlUserDetails'
		})

		.state('choosePasswordIntro', {
			url: '/password/intro',
			templateUrl: 'LavaLogin/login/choosePasswordIntro',
			controller:'CtrlChoosePassword'
		})

		.state('choosePassword', {
			url: '/password',
			templateUrl: 'LavaLogin/login/choosePassword',
			controller:'CtrlChoosePassword'
		})

		.state('generateKeys', {
			url: '/keys/intro',
			templateUrl: 'LavaLogin/login/generateKeys',
			controller: 'CtrlGenerateKeys'
		})

		.state('generatingKeys', {
			url: '/keys',
			templateUrl: 'LavaLogin/login/generatingKeys',
			controller: 'CtrlGeneratingKeys'
		})

		.state('backupKeys', {
			url: '/keys/backup',
			templateUrl: 'LavaLogin/login/backupKey',
			controller: 'CtrlBackupKey'
		})

		.state('closedAccountFeedback', {
			url: '/account/closed/feedback',
			templateUrl: 'LavaLogin/misc/accountClosedFeedback',
			controller: 'CtrlAccountClosedFeedback'
		});
};