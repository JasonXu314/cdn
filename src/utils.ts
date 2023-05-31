export function getExtension(path: string): string {
	const ext = path.split('.').at(-1);

	if (!ext) {
		throw new Error(`Bad path ${path}; has no extension`);
	}

	return ext;
}

export function forceInit<T>(): T {
	return undefined as T;
}

