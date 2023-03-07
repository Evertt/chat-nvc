<div class="h-[500px] w-full bg-gray-900 rounded-md p-4 overflow-y-auto flex flex-col gap-4">
  <div class="flex flex-col gap-2">
    {#each chatMessages as message}
      <ChatMessage
        type={message.role}
        message={message.content}
        name={message.role === 'user' ? userName : 'ChatNVC'}
      />
    {/each}
  </div>
  <div class="" bind:this={scrollToDiv} />
</div>
<form
  class="flex w-full rounded-md gap-4 bg-gray-900 p-4"
  on:submit|preventDefault={() => handleSubmit()}
>
  <input type="text" class="input input-bordered w-full" bind:value={query} />
  <button type="submit" class="btn btn-accent"> Send </button>
</form>

<script lang="ts">
	import ChatMessage from './ChatMessage.svelte'
  import { createEventDispatcher } from 'svelte'
	import type { ChatCompletionRequestMessage } from 'openai'

  const dispatch = createEventDispatcher<{
    'new-message': string
  }>()

	let query: string = ''
	let scrollToDiv: HTMLDivElement
	export let chatMessages: ChatCompletionRequestMessage[]
  export let userName = 'Me'

	function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}

  $: chatMessages && scrollToBottom()

	const handleSubmit = async () => {
    dispatch('new-message', query)
    scrollToBottom()
    query = ''
	}
</script>