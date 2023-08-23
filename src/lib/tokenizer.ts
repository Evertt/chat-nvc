import GPT3TokenizerImport from 'gpt3-tokenizer'
import type {
	CreateChatCompletionRequestMessage,
	CompletionCreateParams
} from 'openai/resources/chat'

// I know this looks weird,
// but this gets differently imported
// in different environments...
const GPT3Tokenizer: typeof GPT3TokenizerImport =
	typeof GPT3TokenizerImport === 'function'
		? GPT3TokenizerImport
		: (GPT3TokenizerImport as any).default

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

type GPTModel = CompletionCreateParams['model']
type ChatMessage = CreateChatCompletionRequestMessage
type Input = ChatMessage | ChatMessage[]

export const countTokens = (input?: Input, model: GPTModel = 'gpt-4'): number => {
	if (!input) return 0

	const isGpt3 = model.startsWith('gpt-3')

	const msgSep = isGpt3 ? '\n' : ''

	if (Array.isArray(input)) {
		const msgSepsTokens = input.length * msgSep.length

		const tokenCount = input.reduce(
			(count, message) => count + countTokens(message),
			msgSepsTokens + 3
		)

		return tokenCount
	}

	const { name, role, content } = input

	if (!content) return 0

	const tokens = tokenizer.encode((name || role) + content)

	return tokens.text.length + 3
}
