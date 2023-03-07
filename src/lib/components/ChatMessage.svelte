<script lang="ts">
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai'
	export let type: ChatCompletionRequestMessageRoleEnum
	export let message: string
	export let name: string

	$: unquotedMessage = message.replace(/^"([\s\S]*?)"?$/, '$1')
</script>

<div class="chat {type === 'user' ? 'chat-end' : 'chat-start'} justify-end">
	<div class="chat-image avatar">
		<div class="w-10 rounded-full">
			<img
				src="https://ui-avatars.com/api/?name={name}"
				alt="{type} avatar"
			/>
		</div>
	</div>
	<div class="chat-header text-white text-opacity-70">
		{name}
	</div>
	<div class="chat-bubble {type === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
		{unquotedMessage}
	</div>
</div>
