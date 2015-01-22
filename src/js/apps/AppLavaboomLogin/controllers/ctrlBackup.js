angular.module(primaryApplicationName).controller('CtrlBackup', function($scope, $state, $window, user, cryptoKeys) {
	if (!user.isAuthenticated())
		$state.go('login');

	$scope.backup = () => {
		var keysBackup = cryptoKeys.exportKeys();
		var blob = new Blob([keysBackup], {type: "text/json;charset=utf-8"});
		saveAs(blob, cryptoKeys.getExportFilename(keysBackup));

		$window.location = '/';
	};

	$scope.skip = () => {
		$window.location = '/';
	};
});