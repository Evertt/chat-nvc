<script lang="ts">
	import ChatWindow from '$lib/components/ChatWindow.svelte'
	import IntroDataForm from '$lib/components/IntroDataForm.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { SSE } from 'sse.js'

	const errorMessage = `
		Sorry, the servers of OpenAI are under heavy load.
		Please wait a few moments and then click the button below to try again.
	`
	let error = false
	let loading = false
	let chatMessages: ChatCompletionRequestMessage[] = []
	let state: 'intro' | 'chat' = 'intro'

	const introData: IntroData & { readonly startingMessage: string } = {
		request: undefined,
		names: [''],
		get startingMessage() {
			return ({
				empathy: `
					Hi ${this.names[0]}, what would you like empathy for today?
				`,
				mediation: `
					Hello ${this.names[0]} and ${this.names[1]}, thank you for reaching out.
					Can one of you start by explaining what the conflict is about?
					Also, please make it clear who is currently writing.
				`,
			})[this.request!].replace(/^\n +|(\n) +/g, '$1')
		}
	}

	$: if (state === 'chat') chatMessages = [
		{ role: 'assistant', content: introData.startingMessage }
	]

	const sendNewMessage = async (newMessage: string) => {
		error = false
		loading = true
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

		const eventSource = new SSE('/sk-api/chat', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ introData, messages: newChatMessages })
		})

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', (e) => {
			try {
				if (e.data === '[DONE]') return void (loading = false)

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
		error = true
		loading = false
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

			<IntroDataForm on:submit={e => {
				Object.assign(introData, e.detail)
				state = 'chat'
			}} />
		</div>
	{:else}
		<ChatWindow
			loading={loading}
			error={error}
			userName={introData.names[0]}
			bind:chatMessages={chatMessages}
			on:new-message={
				e => sendNewMessage(e.detail)
			}
		/>
	{/if}
</div>
