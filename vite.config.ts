import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

const port = 5173;
const origin = `${process.env.DDEV_PRIMARY_URL}:${port}`;

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    server: {
        // Respond to all network requests
        host: "0.0.0.0",
        port: 5173,
        strictPort: true,
        // Defines the origin of the generated asset URLs during development, this must be set to the
        // Vite dev server URL and selected port. In general, `process.env.DDEV_PRIMARY_URL` will give
        // us the primary URL of the DDEV project, e.g. "https://test-vite.ddev.site". But since DDEV
        // can be configured to use another port (via `router_https_port`), the output can also be
        // "https://test-vite.ddev.site:1234". Therefore we need to strip a port number like ":1234"
        // before adding Vites port to achieve the desired output of "https://test-vite.ddev.site:5173".
        origin: `${origin.replace(/:\d+$/, "")}:5173`,

        // 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇
        // Configure CORS securely for the Vite dev server to allow requests from *.ddev.site domains,
        // supports additional hostnames (via regex). If you use another `project_tld`, adjust this.
        cors: {
            origin: /https?:\/\/([A-Za-z0-9\-\.]+)?(\.ddev\.site)(?::\d+)?$/,
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
});