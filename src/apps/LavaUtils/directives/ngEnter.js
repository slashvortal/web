module.exports = () => function (scope, element, attrs) {
	element.bind('keydown keypress', function (event) {
		if(event.which === 13) {
			scope.$apply(function (){
				element[0].blur();
				scope.$eval(attrs.ngEnter);
			});

			event.preventDefault();
		}
	});
};