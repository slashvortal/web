angular.module(primaryApplicationName).service('fileReader', function ($q, $log) {
	var onLoad = function(reader, deferred, scope) {
		return function () {
			scope.$apply(function () {
				deferred.resolve(reader.result);
			});
		};
	};

	var onError = function (reader, deferred, scope) {
		return function () {
			scope.$apply(function () {
				deferred.reject(reader.result);
			});
		};
	};

	var onProgress = function(reader, scope) {
		return function (event) {
			scope.$broadcast("fileProgress",
				{
					total: event.total,
					loaded: event.loaded
				});
		};
	};

	var getReader = function(deferred, scope) {
		var reader = new FileReader();
		reader.onload = onLoad(reader, deferred, scope);
		reader.onerror = onError(reader, deferred, scope);
		reader.onprogress = onProgress(reader, scope);
		return reader;
	};

	this.readAsDataURL = function (file, scope) {
		var deferred = $q.defer();

		var reader = getReader(deferred, scope);
		reader.readAsDataURL(file);

		return deferred.promise;
	};

	this.readAsText = function (file, scope) {
		var deferred = $q.defer();

		var reader = getReader(deferred, scope);
		reader.readAsText(file);

		return deferred.promise;
	};
});