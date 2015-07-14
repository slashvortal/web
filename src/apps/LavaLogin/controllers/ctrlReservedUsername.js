module.exports = ($scope, $state, signUp) => {
	if (!signUp.reserve || !signUp.reserve.altEmail)
		$state.go('login');
	$scope.email = signUp.reserve.altEmail;
};