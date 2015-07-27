module.exports = ($scope, $state, consts, co, signUp) => {
	$scope.rootDomain = consts.ROOT_DOMAIN;
	$scope.form = {
		username: '',
		email: ''
	};

	$scope.requestSecure = () => co(function *(){
		yield signUp.register($scope.form.username, $scope.form.email);

		yield $state.go('reservedUsername');
	});
};