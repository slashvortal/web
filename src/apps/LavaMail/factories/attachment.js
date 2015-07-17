module.exports = (co, user, crypto, utils, fileReader, Email, File) => {
	function Attachment(file) {
		const self = this;

		angular.extend(this, {
			id: utils.getRandomString(16),
			type: file.type,
			name: file.name,
			dateModified: new Date(file.lastModifiedDate),
			body: '',
			size: 0
		});

		this.getBodyAsBinaryString = () => utils.Uint8Array2str(self.body);

		this.read = () => co(function* (){
			self.body = new Uint8Array(yield fileReader.readAsArrayBuffer(file));
			self.size = self.body ? self.body.length : 0;
		});
	}

	Attachment.toEnvelope = (attachment, keys) => co(function *() {
		const isSecured = Email.isSecuredKeys(keys);

		return File.toEnvelope(
			{},
			utils.Uint8Array2str(attachment.body),
			isSecured ? 'attachment' : 'attachment-raw',
			keys
		);
	});

	Attachment.fromEnvelope = (envelope) => co(function *() {
		return File.fromEnvelope(envelope);
	});

	return Attachment;
};