<script lang="ts">
	import "@picocss/pico"
	import "../app.css"

	export let data
</script>

<main class="container">
	<nav>
		<ul>
			<li><strong><a href="/">My App</a></strong></li>
		</ul>
		<form action="/logout" method="POST">
			<ul>
				{#if data.isAuthenticated}
					<li>
						<button type="submit">Logout</button>
					</li>
				{/if}
			</ul>
		</form>
	</nav>

	<slot />
</main>