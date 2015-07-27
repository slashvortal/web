module.exports = ($interval, co, consts, inbox) => {
	function Helpers() {
		const self = this;

		let autoSaveInterval = null;
		let savedForm = null;

		self.saveAsDraft = (draftId, publicKey, form) => co(function *(){
			let meta = {
				publicKey: publicKey,
				to: form.selected.to ? form.selected.to.map(e => e.email) : [],
				cc: form.selected.cc ? form.selected.cc.map(e => e.email) : [],
				bcc: form.selected.bcc ? form.selected.bcc.map(e => e.email) : [],
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
	}

	return Helpers;
};