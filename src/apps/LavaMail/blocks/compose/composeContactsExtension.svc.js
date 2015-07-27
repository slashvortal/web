module.exports = function (co, consts, contacts, user, Contact, ContactEmail) {
	const self = this;
	let newHiddenContact = null;
	let hiddenContacts = {};

	self.getAddressesFromForm = (form) => {
		let to = form.selected.to ? form.selected.to.map(e => e.email) : [],
			cc = form.selected.cc ? form.selected.cc.map(e => e.email) : [],
			bcc = form.selected.bcc ? form.selected.bcc.map(e => e.email) : [];

		return [to, cc, bcc];
	};

	self.getKeys = (to, cc, bcc) => co(function *(){
		return yield ([...to, ...cc, ...bcc].reduce((a, e) => {
			a[e.email] = co.transform(co.def(e.loadKey(), null), e => e ? e.armor() : null);
			return a;
		}, {}));
	});

	self.createHiddenContacts = (destinationEmails) => {
		return destinationEmails
			.filter(email => !contacts.getContactByEmail(email))
			.map(email => {
				let contact = new Contact({name: '$hidden'});
				contact.hiddenEmail = hiddenContacts[email];
				return contacts.createContact(contact);
			});
	};

	self.tagClick = (select, item, model) => {
		const index = model.findIndex(c => c.email == item.email);
		if (index > -1) {
			const tag = item.getTag();
			if (tag) {
				model.splice(index, 1);
				select.search = item.getTag();
			}
		}
	};

	self.tagTransform = newTag => {
		if (!newTag)
			return null;

		const match = newTag.match(/<([^>]*)>/);
		const emailInside = match ? match[1] : null;
		const emailTemplate = emailInside ? emailInside : newTag;

		let p = emailTemplate.split('@');

		let name = '', email = '';

		if (p.length > 1)
			[name, email] = [p[0].trim(), `${p[0].trim()}@${p[1].trim()}`];
		else {
			if (!user.settings.isUnknownContactsAutoComplete)
				return null;

			[name, email] = [emailTemplate.trim(), `${emailTemplate.trim()}@${consts.ROOT_DOMAIN}`];
		}

		if (newHiddenContact) {
			if (newHiddenContact.email == email)
				return newHiddenContact;

			newHiddenContact.cancelKeyLoading();
		}

		if (hiddenContacts[email])
			return hiddenContacts[email];

		if (contacts.getContactByEmail(email))
			return null;

		newHiddenContact = new ContactEmail(null, {
			isTag: true,
			tag: newTag,
			name,
			email,
			isNew: true
		}, 'hidden');

		newHiddenContact.loadKey();

		hiddenContacts[newHiddenContact.email] = newHiddenContact;
		return newHiddenContact;
	};

	self.createPersonFilter = (form) => {
		return (text) =>
			(person) => {
				text = text.toLowerCase();

				return person &&
					(
						!form ||
						!form.selected.to.some(e => e.email == person.email)
					)
					&&
					(
						person.getDisplayName().toLowerCase().includes(text) ||
						person.name.toLowerCase().includes(text) ||
						person.email.toLowerCase().includes(text)
					);
			};
	};
};