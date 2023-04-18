// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			isAuthenticated: boolean
		}
		// interface PageData {}
		// interface Platform {}
	}

	interface IntroData {
		request?: 'empathy' | 'mediation'
		names: [string] | [string, string]
		// readonly startingMessage: string
	}
}

export {}
