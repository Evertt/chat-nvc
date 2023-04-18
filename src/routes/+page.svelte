<script lang="ts">
	import { page } from "$app/stores"

	let message: string

	export let form

	$: message = form?.message
		?? $page.url.searchParams.get("message") ?? ""
</script>

{#if message}
	<p class="alert">{message}</p>
{/if}
<article>
	<header>
		<h1>Login</h1>
	</header>
	<form method="POST">
		<label for="password">Password</label>
		<input type="password" id="password" name="password" required />
		<button type="submit">Login</button>
	</form>
</article>
