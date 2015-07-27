module.exports = function ($rootScope, $templateCache, $compile, co, utils, consts, contacts, crypto, user, Contact, ContactEmail) {
	const self = this;
	let newHiddenContact = null;
	let hiddenContacts = {};

	const transformNodes = (dom, level = 0) => {
		for(let node of dom.childNodes) {
			if (node.getAttribute) {
				let classAttr = node.getAttribute('class');
				if (classAttr && classAttr.length > 1) {
					let classes = classAttr.match(/\S+/g).filter(c => !c.startsWith('ng-'));
					node.setAttribute('class', classes.join(' '));
				}
			}

			if (node.childNodes && node.childNodes.length > 0)
				transformNodes(node, level + 1);
		}
	};

	this.createHiddenContacts = (destinationEmails) => {
		return destinationEmails
			.filter(email => !contacts.getContactByEmail(email))
			.map(email => {
				let contact = new Contact({name: '$hidden'});
				contact.hiddenEmail = hiddenContacts[email];
				return contacts.createContact(contact);
			});
	};

	this.tagClick = (select, item, model) => {
		const index = model.findIndex(c => c.email == item.email);
		if (index > -1) {
			const tag = item.getTag();
			if (tag) {
				model.splice(index, 1);
				select.search = item.getTag();
			}
		}
	};

	this.tagTransform = newTag => {
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

	this.createPersonFilter = (form) => {
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

	this.cleanupOutboundEmail = (body) => {
		let dom = utils.getDOM(body);
		transformNodes(dom);

		console.log('cleanupOutboundEmail: ', body, 'transformed to: ', dom.innerHTML);

		return dom.innerHTML;
	};

	this.getKeys = (to, cc, bcc) => co(function *(){
		return yield ([...to, ...cc, ...bcc].reduce((a, e) => {
			a[e.email] = co.transform(co.def(e.loadKey(), null), e => e ? e.armor() : null);
			return a;
		}, {}));
	});

	this.buildForwardedTemplate = (body, signature, forwardEmails) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inboxEmails/forwardedEmail', {
			body,
			signature,
			forwardEmails
		});
	});

	this.buildRepliedTemplate = (body, signature, replies) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inboxEmails/repliedEmail', {
			body,
			signature,
			replies
		});
	});

	this.buildDirectTemplate = (body, signature) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inboxEmails/directEmail', {
			body,
			signature
		});
	});
};