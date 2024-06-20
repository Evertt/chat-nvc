<script lang="ts">
	const { data } = $props()

	function refreshPage() {
		location.reload()
	}
</script>

<main class="relative flex min-h-screen flex-col items-center justify-center py-10">
	<a
		href="https://vercel.com"
		class="rounded-full bg-white/30 px-6 py-2 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-lg active:shadow-sm dark:bg-white/80 dark:text-black"
	>
		Deploy your own to Vercel
	</a>
	<h1
		class="bg-gradient-to-br from-black via-[#707070] to-[#ffffff] bg-clip-text pb-8 pt-4 text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl dark:from-white"
	>
		Vercel KV
	</h1>
	<div
		class="mx-auto flex w-full max-w-xl flex-col items-center rounded-lg bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-lg dark:bg-white/10"
	>
		<div class="mb-6 text-center text-lg">
			Displayed below is the total number of page views for this demo. Refresh the page and watch it
			increase!
		</div>
		<button onclick={refreshPage} class="mb-6 font-bold underline opacity-70 hover:opacity-100">
			Refresh Page
		</button>
		<div class="space-y-4">
			<p class="text-5xl font-bold">{data.pageVisits.length} visits.</p>

			<p>Last {Math.min(10, data.pageVisits.length)} visits:</p>

			<ul class="space-y-4">
				{#each data.pageVisits.slice(-10).toReversed() as forwardedHost}
					<li class="whitespace-pre">{forwardedHost}</li>
				{/each}
			</ul>
		</div>
	</div>
	<div class="mt-6 w-full max-w-lg text-center font-light text-gray-600 dark:text-gray-300">
		Simple hello world demo of
		<a
			href="https://vercel.com/kv"
			class="font-medium underline underline-offset-4 transition-colors hover:text-black dark:hover:text-white"
		>
			Vercel KV
		</a>
		<div class="my-2 flex items-center justify-center">
			<span>Built with</span>
			<a
				href="https://kit.svelte.dev/"
				class="flex items-center font-medium underline underline-offset-4 transition-colors hover:text-black dark:hover:text-white"
			>
				<img src="svelte_logo.png" alt="svelte logo" class="mx-2 h-6" />
				<p>SvelteKit</p>
			</a>
			.
		</div>
	</div>
	<div class="flex grow flex-col">
		<a href="https://vercel.com">
			<img
				src="/vercel.svg"
				alt="Vercel Logo"
				class="my-2 text-white dark:text-white"
				width={100}
				height={24}
			/>
		</a>
		<a
			href="https://github.com/vercel/examples/tree/main/storage/kv-redis-sveltekit"
			class="bottom-20 right-20 mt-auto flex h-8 items-center space-x-2"
		>
			<img src="/github.svg" alt="GitHub Logo" class="h-6 dark:invert" />
			<p class="font-light">Source</p>
		</a>
	</div>
</main>
