import { mkdir, copyFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Build only public site assets; credentials and collaboration docs stay outside dist.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'que-hacemos.html', 'quienes-somos.html', 'tienda.html', 'proyectos.html', 'contacto.html', 'styles.css', 'app.js', 'checkout.html', 'checkout.mjs', 'checkout.css', 'catalog.mjs']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log('Web preparada en dist/');
