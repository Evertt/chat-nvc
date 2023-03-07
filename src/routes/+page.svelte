<script lang="ts">
	import ChatWindow from '$lib/components/ChatWindow.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { SSE } from 'sse.js'

	const errorMessage = `
		Sorry, the servers of OpenAI are under heavy load.
		Please wait a few moments and then try to click the send button again.
	`

	let chatMessages: ChatCompletionRequestMessage[] = []
	let state: 'intro' | 'chat' = 'intro'
	$: if (state === 'chat') sendNewMessage('')

	const introData: IntroData = {
		request: undefined,
		names: ['']
	}

	const sendNewMessage = async (newMessage: string) => {
		let answer = ''

		if (chatMessages.at(-1)?.content === errorMessage) {
			chatMessages = chatMessages.slice(0, -1)
		}

		const newChatMessages = [
			...chatMessages,
			...(newMessage ? [{ role: 'user', content: newMessage }] : []),
		] as typeof chatMessages

		chatMessages = [
			...newChatMessages,
			{ role: 'assistant', content: 'thinking...' },
		]

		const eventSource = new SSE('/api/chat', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ introData, messages: newChatMessages })
		})

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', (e) => {
			try {
				if (e.data === '[DONE]') return

				const completionResponse = JSON.parse(e.data)
				const [{ delta }] = completionResponse.choices

				if (delta.content) {
					answer += delta.content
					chatMessages = [
						...newChatMessages,
						{ role: 'assistant', content: answer }
					]
				}
			} catch (err) {
				handleError(err)
			}
		})

		eventSource.stream()
	}

	function handleError<T>(err: T) {
		chatMessages = [
			...chatMessages.slice(0, -1),
			{ role: 'assistant', content: errorMessage }
		]
		console.error(err)
	}
</script>

<div class="flex flex-col pt-4 w-full px-8 items-center gap-2">
	<div>
		<h1 class="text-2xl font-bold w-full text-center">ChatNVC</h1>
	</div>

	{#if state === 'intro'}
		<div class="flex flex-col gap-2">
			<p class="text-center">Hi, I'm ChatNVC. I'm here to help.</p>

			{#if introData.request === undefined}
				<p class="text-center">What do you need?</p>
				<div class="flex flex-col gap-2">
					<button
						class="btn btn-accent"
						on:click={() => {
							introData.request = 'empathy'
							introData.names = ['']
						}}
					>
						I need empathy
					</button>
					<button
						class="btn btn-accent"
						on:click={() => {
							introData.request = 'mediation'
							introData.names = ['', '']
						}}
					>
						I need mediation
					</button>
				</div>
			{:else}
				<p class="text-center">
					{introData.request === 'empathy' ? "What's your name?" : 'What are your names?'}
				</p>

				<form
					class="flex flex-col gap-2"
					on:submit|preventDefault={() => state = 'chat'}
				>
					{#each introData.names as name, i}
						<input
							class="input input-bordered"
							type="text"
							bind:value={introData.names[i]}
							autocorrect="off"
							spellcheck="false"
							autocomplete="off"
							list="autocompleteOff"
							aria-autocomplete="none"
						/>
					{/each}
					<button class="input btn btn-accent" type="submit">
						Continue
					</button>
				</form>
			{/if}
		</div>
	{:else}
		<ChatWindow
			userName={introData.names[0]}
			bind:chatMessages={chatMessages}
			on:new-message={
				e => sendNewMessage(e.detail)
			}
		/>
	{/if}
</div>
