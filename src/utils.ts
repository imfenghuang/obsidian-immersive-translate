export const clearStorage = async () => {
	// clear localStorage
	const prefix = 'immersiveTranslate';
	const keys = Object.keys(window.localStorage).filter((v) =>
		v.startsWith(prefix)
	);
	keys.forEach((v) => {
		delete window.localStorage[v];
	});

	// clear indexed-db
	const dbPrefix = 'immersive-translate';
	await window.indexedDB
		.databases()
		.then((dbList) => {
			dbList
				?.filter((v) => v.name?.startsWith(dbPrefix))
				?.forEach((v) => {
					v.name && window.indexedDB.deleteDatabase(v.name);
				});
		})
		.catch(() => {});

	// clear window
	const windowKey = 'mmersiveTranslate';
	const windowKeys = Object.keys(window).filter(
		(v) => v.indexOf(windowKey) !== -1
	);
	windowKeys.forEach((v) => {
		// @ts-ignore
		typeof window[v] !== 'undefined' && delete window[v];
	});
};

export const restoreTranslate = () => {
	const event = new KeyboardEvent('keydown', {
		key: 'a',
		keyCode: 65,
		which: 65,
		code: 'KeyA',
		altKey: true,
		bubbles: true,
	});
	document.dispatchEvent(event);
};

export const getArrayStr = (arr?: string[]) => {
	if (!Array.isArray(arr)) {
		return '[]';
	}
	return `[${arr.map((v) => `${JSON.stringify(v)}`)}]`;
};
