module.exports = function ($interval, co, consts, inbox, composeContactsExtension) {
	const self = this;

	let autoSaveInterval = null;
	let savedForm = null;

	self.saveAsDraft = (draftId, publicKey, form) => co(function *(){
		let [to, cc, bcc] = composeContactsExtension.getAddressesFromForm(form);

		let meta = {
			to,
			cc,
			bcc,
			publicKey: publicKey,
			subject: form.subject
		};

		if (draftId) {
			yield inbox.updateDraft(draftId, meta, form.body);
		} else {
			draftId = yield inbox.createDraft(meta, form.body);
		}
	});

	self.setupAutoSave = (isExistingDraft, isChanged, draftId, publicKey, form) => {
		savedForm = form;
		if (autoSaveInterval)
			return;

		autoSaveInterval = $interval(() => {
			if (isExistingDraft || isChanged())
				self.saveAsDraft(draftId, publicKey, savedForm);
		}, consts.COMPOSE_AUTO_SAVE_INTERVAL);
	};

	self.cancelAutoSave = () => {
		$interval.cancel(autoSaveInterval);
	};
};