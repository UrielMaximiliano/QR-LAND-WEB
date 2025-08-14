/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				background: '#070711',
				primary: '#8b5cf6',
				secondary: '#06b6d4',
				accent: '#f43f5e',
				neon: '#a78bfa',
			},
			boxShadow: {
				neon: '0 0 10px rgba(167,139,250,0.7), 0 0 20px rgba(6,182,212,0.5)'
			}
		}
	},
	plugins: [],
}


