module.exports = function (co, utils) {
	const self = this;

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

	self.cleanupOutboundEmail = (body) => {
		let dom = utils.getDOM(body);
		transformNodes(dom);

		console.log('cleanupOutboundEmail: ', body, 'transformed to: ', dom.innerHTML);

		return dom.innerHTML;
	};

	self.buildForwardedTemplate = (body, signature, forwardEmails) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inboxEmails/forwardedEmail', {
			body,
			signature,
			forwardEmails
		});
	});

	self.buildRepliedTemplate = (body, signature, replies) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inboxEmails/repliedEmail', {
			body,
			signature,
			replies
		});
	});

	self.buildDirectTemplate = (body, signature) => co(function *(){
		return yield utils.fetchAndCompile('LavaMail/inboxEmails/directEmail', {
			body,
			signature
		});
	});
};