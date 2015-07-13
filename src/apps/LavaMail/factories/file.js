module.exports = (co, utils, crypto, user) => {
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

	File.toEnvelope = (meta, body) => co(function *(){
		let key = user.key.armor();

		let [metaEncoded, bodyEncoded] = yield [
			crypto.encodeWithKeys(JSON.stringify(meta), [key]),
			crypto.encodeWithKeys(body, [key])
		];

		metaEncoded = btoa(crypto.messageToBinary(metaEncoded.pgpData));
		bodyEncoded = btoa(crypto.messageToBinary(bodyEncoded.pgpData));

		return {
			name: 'draft',
			meta: {meta: metaEncoded},
			body: bodyEncoded,
			tags: ['draft']
		};
	});

	File.fromEnvelope = (envelope) => co(function *() {
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

		let r = new File(envelope);

		console.log('file created', r);

		return r;
	});
	
	return File;
};