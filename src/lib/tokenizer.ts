import { oneLine } from 'common-tags'
import type {
	CreateChatCompletionRequestMessage,
	CompletionCreateParams
} from 'openai/resources/chat'
import tiktoken, { type TiktokenModel } from 'tiktoken'

// This type allows arbitrary strings.
type OpenAIChatModel = CompletionCreateParams['model']
// Which I don't want, so that's what this Extract is for.
type GPTModel = Extract<OpenAIChatModel, TiktokenModel>

type ChatMessage = CreateChatCompletionRequestMessage // & { tokens: number }
type Input = string | ChatMessage | ChatMessage[]

const specialTokens = {
	'<|im_start|>': 100264,
	'<|im_end|>': 100265,
	'<|im_sep|>': 100266
} as const

const getTokenizer = (model: GPTModel) => tiktoken.encoding_for_model(model, specialTokens)

let tokenizer: tiktoken.Tiktoken | undefined = undefined

export const countTokens = (input?: Input, model: GPTModel = 'gpt-4'): number => {
	if (!input) return 0

	tokenizer ??= getTokenizer(model)

	if (typeof input === 'string') return tokenizer.encode(input, Object.keys(specialTokens)).length

	const isGpt3 = model.startsWith('gpt-3')

	const msgSep = isGpt3 ? '\n' : ''
	const roleSep = isGpt3 ? '\n' : '<|im_sep|>'

	if (Array.isArray(input)) {
		const msgSepsTokens = input.length * msgSep.length
		const lastMsg = `<|im_start|>assistant${roleSep}`
		const lastTokens = countTokens(lastMsg)

		const tokenCount = input.reduce(
			(count, message) => count + countTokens(message),
			msgSepsTokens + lastTokens
		)

		tokenizer.free()
		tokenizer = undefined

		return tokenCount
	}

	const { name, role, content } = input

	const msgString = oneLine`
		<|im_start|>${name || role}${roleSep}${content}<|im_end|>
	`

	return countTokens(msgString)
}
