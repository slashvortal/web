module.exports = ($scope, $modalInstance, co, user) => {
	$scope.state = 'warning';

	$scope.cancel = () => {
		$modalInstance.dismiss('cancelled');
	};

	$scope.continueClose = () => {
		$scope.state = 'confirm';
	};

	$scope.confirm = () => co(function* (){
		yield user.deleteAccount();
		yield user.logout();
		$modalInstance.close('yes');
	});
};