module.exports = ($scope, $timeout, $translate, user, co, notifications, dialogs) => {
	$scope.toolbar = [
		['h1', 'h2', 'h3'],
		['bold', 'italics', 'underline'],
		['justifyLeft', 'justifyCenter', 'justifyRight']
	];

	$scope.name = user.styledName;
	$scope.altEmail = user.altEmail;
	$scope.isAltEmailEditMode = false;
	$scope.isAltEmailConfirmed = false;
	$scope.altEmailConfirmCoroutine = null;

	$scope.status = '';
	$scope.settings = {};

	const translations = {
		LB_PROFILE_SAVED: '',
		LB_PROFILE_CANNOT_BE_SAVED: '',
		LB_CANNOT_CHANGE_ALT_EMAIL: '%'
	};
	$translate.bindAsObject(translations, 'LAVAMAIL.SETTINGS.PROFILE');

	$scope.$bind('user-settings', () => {
		$scope.settings = user.settings;
	});

	let updateTimeout = null;


	$scope.closeAccount = () => co(function* (){
		yield co.def(dialogs.create(
			'LavaMail/closeAccount/closeAccount',
			'CtrlCloseAccount'
		).result, 'cancelled');
	});

	$scope.changeAltEmail = () => {
		$scope.isAltEmailEditMode = true;
		$scope.isAltEmailConfirmed = false;
		$scope.altEmailConfirmCoroutine = null;
	};

	$scope.cancelAltEmail = (isFocusLost) => {
		function cancel() {
			co(function* (){
				let result = null;
				if ($scope.altEmailConfirmCoroutine) {
					result = yield co.def($scope.altEmailConfirmCoroutine, 'error');
				}
				if (result == 'error' || ($scope.isAltEmailEditMode && !$scope.isAltEmailConfirmed)) {
					$scope.altEmail = user.altEmail;
					$scope.isAltEmailEditMode = false;
				}
			});
		}

		if (isFocusLost)
			$timeout(cancel, 100);
		else
			cancel();
	};

	$scope.confirmAltEmail = () => {
		$scope.isAltEmailConfirmed = true;
		$scope.isAltEmailEditMode = false;
		$scope.altEmailConfirmCoroutine = co(function* (){
			try {
				yield user.changeAltEmail($scope.altEmail);
			} catch (err) {
				notifications.set('alt-email-change-failed', {
					text: translations.LB_CANNOT_CHANGE_ALT_EMAIL({error: err.message}),
					namespace: 'settings'
				});

				throw err;
			}
		});
	};

	$scope.$watch('settings', (o, n) => {
		if (o === n)
			return;

		if (Object.keys($scope.settings).length > 0) {
			[updateTimeout] = $timeout.schedulePromise(updateTimeout, () => co(function *(){
				try {
					yield user.update($scope.settings);

					notifications.set('profile-save-ok', {
						text: translations.LB_PROFILE_SAVED,
						type: 'info',
						timeout: 3000,
						namespace: 'settings'
					});
				} catch (err) {
					notifications.set('profile-save-fail', {
						text: translations.LB_PROFILE_CANNOT_BE_SAVED,
						namespace: 'settings'
					});
				}
			}), 1000);
		}
	}, true);
};