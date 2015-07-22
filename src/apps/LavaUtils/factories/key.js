module.exports = ($injector, $translate, $timeout, co, crypto, utils, consts, dateFilter, cryptoKeys) => {
	const translations = {
		TP_KEY_IS_ENCRYPTED: '',
		TP_KEY_IS_DECRYPTED: '',
		LB_EXPIRED: '',
		LB_EXPIRING_SOON: ''
	};
	$translate.bindAsObject(translations, 'LAVAMAIL.SETTINGS.SECURITY');

	const statuses = {};

	function Key(key) {
		const self = this;

		const daysToMsec = 24 * 60 * 60 * 1000;
		const now = () => new Date();

		this.keyId = utils.hexify(key.primaryKey.keyid.bytes);
		this.fingerprint = key.primaryKey.fingerprint;
		this.fingerprintPretty = key.primaryKey.fingerprint.match(/.{1,4}/g).join(' ');

		this.created = new Date(Date.parse(key.primaryKey.created));
		this.expiredAt = new Date(Date.parse(key.primaryKey.created) + consts.KEY_EXPIRY_DAYS * daysToMsec);
		this.algos = key.primaryKey.algorithm.split('_')[0].toUpperCase();
		this.length = key.primaryKey.getBitSize();
		this.user = key.users[0].userId.userid;
		this.email = utils.getEmailFromAddressString(key.users[0].userId.userid);

		this.privateArmor = cryptoKeys.exportPrivateKeyByFingerprint(self.fingerprint);
		this.publicArmor = cryptoKeys.exportPublicKeyByFingerprint(self.fingerprint);

		if (!statuses[self.fingerprint])
			statuses[self.fingerprint] = {
				isCollapsed: true,
				isPublicCollapsed: true,
				isPrivateCollapsed: true
			};

		let isCollapsed = statuses[self.fingerprint].isCollapsed;
		let isPrivateCollapsed = statuses[self.fingerprint].isPrivateCollapsed;
		let isPublicCollapsed = statuses[self.fingerprint].isPublicCollapsed;

		let decodeTimeout = null;
		let decryptTime = 0;

		this.getTitle = () =>
			(self.isExpiringSoon ? `(${translations.LB_EXPIRING_SOON}) ` : '') +
			(self.isExpired ? `(${translations.LB_EXPIRED}) ` : '') +
			dateFilter(self.created);

		this.isExpired = now() > self.expiredAt;
		this.isExpiringSoon = !self.isExpired && (now() > self.expiredAt.getTime() - consts.KEY_EXPIRY_DAYS_WARNING * daysToMsec);

		this.getDecryptTime = () => decryptTime;
		this.isDecrypted = () => key && key.primaryKey.isDecrypted;
		this.isCollapsed = () => isCollapsed;
		this.switchCollapse = () => {
			isCollapsed = !isCollapsed;
			statuses[self.fingerprint].isCollapsed = isCollapsed;
		};

		this.isPrivateCollapsed = () => isPrivateCollapsed;
		this.switchPrivateCollapse = () => {
			isPrivateCollapsed = !isPrivateCollapsed;
			statuses[self.fingerprint].isPrivateCollapsed = isPrivateCollapsed;
		};

		this.isPublicCollapsed = () => isPublicCollapsed;
		this.switchPublicCollapse = () => {
			isPublicCollapsed = !isPublicCollapsed;
			statuses[self.fingerprint].isPublicCollapsed = isPublicCollapsed;
		};

		this.getEncryptionStatusTooltip = () => this.isDecrypted()
			? translations.TP_KEY_IS_DECRYPTED
			: translations.TP_KEY_IS_ENCRYPTED;

		this.decrypt = (password) => co(function *(){
			decodeTimeout = $timeout.schedule(decodeTimeout, () => {
				let r = false;
				if (key && !key.primaryKey.isDecrypted) {
					r = crypto.authenticate(key, password);
					return !!r;
				}

				decryptTime = new Date();
			}, consts.AUTO_SAVE_TIMEOUT);

			utils.def(yield decodeTimeout);

			return key.primaryKey.isDecrypted;
		});

		this.armor = () => key.armor();
	}

	return Key;
};