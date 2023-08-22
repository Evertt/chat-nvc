<script lang="ts">
	import type { CreateChatCompletionRequestMessage } from 'openai/resources/chat'
	import ChatMessage from './ChatMessage.svelte'
	import { createEventDispatcher } from 'svelte'

	const dispatch = createEventDispatcher<{
		'new-message': {
			content: string
			name: string
		}
	}>()

	let form: HTMLFormElement
	let scrollToDiv: HTMLDivElement
	export let chatMessages: CreateChatCompletionRequestMessage[]
	export let names: string[]
	export let loading: boolean
	export let error: boolean

	function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}

	$: chatMessages && scrollToBottom()

	const handleSubmit = async () => {
		const inputElement = names
			.map((name) => form.elements.namedItem(name) as HTMLInputElement)
			.find((element) => element.value !== '')

		if (!inputElement) throw Error('No message was written')

		const name = inputElement.id
		const content = inputElement.value

		dispatch('new-message', { content, name })
		scrollToBottom()
		inputElement.value = ''
	}
</script>

<div class="h-[500px] w-full bg-gray-900 rounded-md p-4 overflow-y-auto flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		{#each chatMessages as message}
			<ChatMessage
				type={message.role}
				message={message.content || ''}
				name={message.role === 'user' ? message.name || '' : 'ChatNVC'}
			/>
		{/each}
	</div>
	<div bind:this={scrollToDiv} />
</div>
<form
	bind:this={form}
	class="flex w-full rounded-md gap-4 bg-gray-900 p-4"
	on:submit|preventDefault={() => handleSubmit()}
>
	{#if !error}
		<div class="w-full">
			{#each names as name, i}
				{#if names.length > 1}
					<label for={name} class="text-white">{name}:</label>
				{/if}

				<input
					id={name}
					type="text"
					autofocus={i === 0}
					class="input input-bordered w-full"
					placeholder={loading ? 'ChatNVC is processing your message...' : 'Type your message...'}
				/>
			{/each}
		</div>
	{/if}
	<button
		type="submit"
		class="btn btn-accent disabled:text-white min-w-[100px] flex-grow self-end"
		disabled={loading}
	>
		{error ? 'Try again' : loading ? 'Loading' : 'Send'}
	</button>
</form>
