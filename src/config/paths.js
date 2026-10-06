import path from 'node:path';

export const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');
export const VIEWS_DIR = path.join(ROOT_DIR, 'src', 'views');
export const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
