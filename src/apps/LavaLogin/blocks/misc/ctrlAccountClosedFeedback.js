module.exports = ($scope, $state, co, user, utils) => {
	if (!user.isAccountClosed())
		$state.go('login');

	$scope.sendFeedback = () => co(function* (){
		try {
			yield utils.sleep(1000);
		} finally {
			user.resetIsAccountClosedFlag();
			yield $state.go('login');
		}
	});
};