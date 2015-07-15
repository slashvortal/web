module.exports = (co, utils, crypto, user, Email) => {
	function File(opt) {
		const self = this;

		this.id = opt.id;
		this.name = opt.name;
		this.tags = opt.tags;

		this.body = opt.body;
		this.meta = opt.meta;

		self.created = opt.date_created;
		self.modified = opt.date_modified;
	}

	File.toEnvelope = (meta, body, name, keys) => co(function *(){
		if (name == 'attachment-raw')
			return {
				name,
				meta: {meta: btoa(JSON.stringify(meta))},
				body: btoa(btoa(body)),
				tags: [name]
			};

		if (!keys)
			keys = {};

		const isSecured = Email.isSecuredKeys(keys);

		if (isSecured)
			keys[user.email] = user.key.armor();

		keys = Email.keysMapToList(keys);

		let [metaEncoded, bodyEncoded] = yield [
			crypto.encodeWithKeys(JSON.stringify(meta), keys),
			crypto.encodeWithKeys(body, keys)
		];

		metaEncoded = btoa(crypto.messageToBinary(metaEncoded.pgpData));
		bodyEncoded = btoa(crypto.messageToBinary(bodyEncoded.pgpData));

		return {
			name,
			meta: {meta: metaEncoded},
			body: bodyEncoded,
			tags: [name]
		};
	});

	File.fromEnvelope = (envelope) => co(function *() {
		if (name == 'attachment-raw') {
			envelope.body = {
				data: atob(envelope.body),
				state: 'ok'
			};
			envelope.meta = JSON.parse(atob(envelope.meta));
		}
		else
		{
			try {
				let [body, meta] = yield [crypto.decodeRaw(envelope.body, true), crypto.decodeRaw(envelope.meta.meta, true)];

				envelope.body = {
					data: body,
					state: 'ok'
				};
				envelope.meta = JSON.parse(meta);
			} catch (err) {
				envelope.body = {
					data: '',
					state: err.message
				};
				envelope.meta = {};
			}
		}

		let r = new File(envelope);

		console.log('file created', r);

		return r;
	});
	
	return File;
};