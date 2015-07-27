module.exports = ($scope, $state, $stateParams, co, user, signUp) => {
	const userName = $stateParams.userName;
	const inviteCode = $stateParams.inviteCode;

	$scope.isVerifying = true;
	$scope.isError = false;

	co(function *(){
		yield signUp.verifyInvite(userName, inviteCode, true);
		yield $state.go('details');
	});
};