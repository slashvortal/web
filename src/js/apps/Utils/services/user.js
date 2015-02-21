var Buffer = require('buffer/').Buffer;

module.exports = /*@ngInject*/function($q, $rootScope, $state, $timeout, $window, $translate, consts, LavaboomAPI, co, crypto, cryptoKeys, loader) {
	var self = this;

	var translations = {};
	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_BYE = $translate.instant('LOADER.LB_BYE');
	});

	this.name = '';
	this.email = '';
	this.nameEmail = '';

	// information about user from API
	this.settings = {};

	// primary key
	this.key = null;

	var token = null;
	var isAuthenticated = false;

	var setupUserBasicInformation = (username) => {
		username = self.transformUserName(username);

		self.name = username;
		self.email = `${username}@${consts.ROOT_DOMAIN}`;
		self.nameEmail = `${self.name} <${self.email}>`;

		return username;
	};

	var restoreAuth = () => {
		token = sessionStorage.lavaboomToken ? sessionStorage.lavaboomToken : localStorage.lavaboomToken;

		if (token)
			LavaboomAPI.setAuthToken(token);
	};

	var persistAuth = (isRemember = true) => {
		var storage = isRemember ? localStorage : sessionStorage;
		storage.lavaboomToken = token;
	};

	this.transformUserName = (username) => username.split('.').join('').toLowerCase();

	this.calculateHash = (password) => (new Buffer(openpgp.crypto.hash.sha256(password), 'binary')).toString('hex');

	this.isAuthenticated = () => token && isAuthenticated;

	this.syncKeys = () => co(function *(){
		var res = yield LavaboomAPI.keys.list(self.name);

		var keysByFingerprint = res.body.keys ? res.body.keys.reduce((a, k) => {
			a[k.id] = k;
			return a;
		}, {}) : {};

		var publicKeys = crypto.getAvailablePublicKeysForSourceEmails();

		var keysCreationPromises = [];

		Object.keys(publicKeys).forEach(email => {
			var keysForEmail = publicKeys[email];
			keysForEmail.forEach(key => {
				if (!keysByFingerprint[key.primaryKey.fingerprint]) {
					console.log(`Importing key with fingerprint '${key.primaryKey.fingerprint}' to the server...`);

					keysCreationPromises.push(LavaboomAPI.keys.create(key.armor()));
				} else
					console.log(`Key with fingerprint '${key.primaryKey.fingerprint}' already imported...`);
			});
		});

		yield keysCreationPromises;
	});

	this.authenticate = () => co(function * () {
		restoreAuth();

		var res = yield LavaboomAPI.accounts.get('me');

		self.settings = res.body.user.settings ? res.body.user.settings : {};
		$rootScope.$broadcast('user-settings');

		setupUserBasicInformation(res.body.user.name);

		if (!isAuthenticated) {
			isAuthenticated = true;
			$rootScope.$broadcast('user-authenticated');
		}
	});

	this.gatherUserInformation = () => co(function * () {
		yield self.authenticate();
		yield self.syncKeys();

		var res = yield LavaboomAPI.keys.get(self.email);
		self.key = res.body.key;

		if (!isAuthenticated) {
			isAuthenticated = true;
			$rootScope.$broadcast('user-authenticated');
		}

		return res.body;
	});

	this.update = (settings) => {
		angular.extend(self.settings, settings);
		return LavaboomAPI.accounts.update('me', {
			settings: self.settings
		});
	};

	this.updateKey = (fingerprint) => co(function * () {
		return yield LavaboomAPI.accounts.update('me', {
			public_key: fingerprint
		});
	});

	this.signIn = (username, password, isRemember, isPrivateComputer) => {
		username = setupUserBasicInformation(username.split('@')[0].trim());

		crypto.initialize({
			isRememberPasswords: isRemember
		});

		return co(function * (){
			try {
				restoreAuth();

				var res = yield LavaboomAPI.tokens.create({
					type: 'auth',
					username: username,
					password: self.calculateHash(password)
				});

				token = res.body.token.id;
				LavaboomAPI.setAuthToken(token);
				persistAuth(isRemember);
				isAuthenticated = true;

				res = yield LavaboomAPI.keys.list(self.name);
				if (!res.body.keys || res.body.keys.length < 1) {
					yield $state.go('generateKeys');
					return;
				}

				// what, why?
				try {
					res = yield LavaboomAPI.keys.get(self.email);
				} catch (err) {
					yield $state.go('generateKeys');
					return;
				}

				self.key = res.body.key;

				crypto.options.isPrivateComputer = isPrivateComputer;
				crypto.authenticateDefault(password);

				$rootScope.$broadcast('user-authenticated');
			} catch (err) {
				$rootScope.$broadcast('user-authentication-error', err);
				throw err;
			}
		});
	};

	this.logout = () => {
		$rootScope.$broadcast('logout');

		if (localStorage.lavaboomToken)
			delete localStorage.lavaboomToken;
		if (sessionStorage.lavaboomToken)
			delete sessionStorage.lavaboomToken;

		LavaboomAPI.setAuthToken('');
		isAuthenticated = false;
		token = '';

		loader.resetProgress();
		loader.showLoader(true);
		loader.loadLoginApplication({lbDone: translations.LB_BYE});
	};
};