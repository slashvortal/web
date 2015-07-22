module.exports = () => {
	return (str) => str.replace(new RegExp('\r?\n','g'), '<br />');
};