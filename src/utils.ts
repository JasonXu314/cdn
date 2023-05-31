import { WithId } from 'mongodb';
import { DBFile } from './data/file.model';

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

export function match(file: WithId<DBFile>, query: string, field: 'id' | 'name' | 'type'): boolean {
	const value = file[field === 'id' ? '_id' : field].toString().toLowerCase();
	const q = query.toLowerCase();
	const vws = value.replace(/\s/g, '');
	const qws = q.replace(/\s/g, '');
	const vFrags = value.split(/s/);
	const qFrags = q.split(/s/);

	return (
		value.includes(q) ||
		q.includes(value) ||
		vws.includes(qws) ||
		qws.includes(vws) ||
		qFrags.every((f) => vFrags.some((fragment) => fragment.includes(f) || f.includes(fragment)))
	);
}

