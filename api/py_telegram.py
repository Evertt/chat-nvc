#!/usr/bin/env python3
import os
import logging
from queue import Queue
from sanic import Sanic, Request
from sanic.response import json
from telegram import Update, Bot
from telegram.ext import ApplicationBuilder, Updater, CommandHandler, CallbackContext

APP_NAME = "ChatNVCBot"
AUDIOS_DIR = "audios"
OPENAI_TOKEN = os.getenv("OPENAI_KEY")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_KEY")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(APP_NAME)

app = Sanic(APP_NAME)
# telegramApp = ApplicationBuilder().token(TELEGRAM_TOKEN).base_url('http://0.0.0.0:9000').build()
telegramApp = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
telegramBot: Bot = telegramApp.bot

@app.route('/', methods=['POST'])
async def webhook(request: Request):
    update = Update.de_json(request.json, telegramBot)
    await telegramApp.process_update(update)
    return json({'ok': 'POST request processed'})

def start(update: Update, context: CallbackContext) -> None:
    update.message.reply_text("Hello! I'm a bot that's using Sanic and python-telegram-bot!")

telegramApp.add_handler(CommandHandler('start', start))
# telegramApp.initialize()

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8000, dev=True, debug=True)




# #!/usr/bin/env python3
# import os
# import logging
# import openai
# import uuid
# import pydub
# import telegram
# import gtts
# from queue import Queue
# from fastapi import FastAPI, Request
# from telegram.ext import ApplicationBuilder, Updater, CommandHandler, MessageHandler, filters
# # from http.server import BaseHTTPRequestHandler

# app = FastAPI()
# update_queue = Queue()
# bot = telegram.Bot(token=TELEGRAM_TOKEN)
# # updater = Updater(bot=bot, update_queue=update_queue)
# app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

# logging.basicConfig(
#     format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
# )
# logger = logging.getLogger(__name__)

# def create_dir_if_not_exists(dir):
#     if (not os.path.exists(dir)):
#         os.mkdir(dir)


# def generate_unique_name():
#     uuid_value = uuid.uuid4()
#     return f"{str(uuid_value)}"


# def convert_text_to_speech(text, language_code='en'):
#     output_filepath = os.path.join(AUDIOS_DIR, f"{generate_unique_name()}.mp3")
#     tts = gtts.gTTS(text=text, lang=language_code)
#     tts.save(output_filepath)
#     return output_filepath


# def convert_speech_to_text(audio_filepath: str):
#     with open(audio_filepath, "rb") as audio:
#         transcript = openai.Audio.transcribe("whisper-1", audio)
#         return transcript["text"]


# async def download_voice_as_ogg(voice: telegram.Voice | None):
#     voice_file = await voice.get_file()
#     ogg_filepath = os.path.join(AUDIOS_DIR, f"{generate_unique_name()}.ogg")
#     await voice_file.download_to_drive(ogg_filepath)
#     return ogg_filepath


# def convert_ogg_to_mp3(ogg_filepath: str):
#     mp3_filepath = os.path.join(AUDIOS_DIR, f"{generate_unique_name()}.mp3")
#     audio = pydub.AudioSegment.from_file(ogg_filepath, format="ogg")
#     audio.export(mp3_filepath, format="mp3")
#     return mp3_filepath


# def generate_response(text: str):
#     response = openai.ChatCompletion.create(
#         model="gpt-3.5-turbo",
#         messages=[
#             {"role": "user", "content": text}
#         ]
#     )
#     answer = response["choices"][0]["message"]["content"]
#     return answer


# async def help_command(update: telegram.Update,
#                        context: telegram.ext.ContextTypes.DEFAULT_TYPE) -> None:
#     user = update.effective_user
#     help_message = f"Hello {user.first_name}, how are you?\n"
#     help_message += "I'm ChatNVC, here to serve. \U0001F916" # robot face emoji

#     await update.message.reply_html(
#         text=help_message,
#         reply_markup=telegram.ForceReply(selective=True),
#     )


# async def read_command(update: telegram.Update,
#                        context: telegram.ext.ContextTypes.DEFAULT_TYPE) -> None:
#     text = " ".join(context.args)
#     if len(text) <= 0:
#         no_text_message = "Informe o texto após o comando! \U0001F620"
#         return await update.message.reply_text(text=no_text_message)
#     audio_path = convert_text_to_speech(text)
#     await update.message.reply_audio(audio=audio_path)
#     os.remove(audio_path)


# async def handle_text(update: telegram.Update,
#                       context: telegram.ext.ContextTypes.DEFAULT_TYPE) -> None:
#     text = update.message.text
#     answer = generate_response(text)
#     await update.message.reply_text(answer)


# async def handle_voice(update: telegram.Update,
#                        context: telegram.ext.ContextTypes.DEFAULT_TYPE) -> None:
#     ogg_filepath = await download_voice_as_ogg(update.message.voice)
#     mp3_filepath = convert_ogg_to_mp3(ogg_filepath)
#     transcripted_text = convert_speech_to_text(mp3_filepath)
#     answer = generate_response(transcripted_text)
#     answer_audio_path = convert_text_to_speech(answer)
#     await update.message.reply_audio(audio=answer_audio_path)
#     os.remove(ogg_filepath)
#     os.remove(mp3_filepath)
#     os.remove(answer_audio_path)


# app.add_handler(CommandHandler("start", help_command))
# app.add_handler(CommandHandler("read", read_command))
# app.add_handler(CommandHandler("help", help_command))
# app.add_handler(MessageHandler(
#     filters.TEXT & ~filters.COMMAND, handle_text))
# app.add_handler(MessageHandler(
#     filters.VOICE, handle_voice))

# app.process_update()


# @app.post('/')
# async def vercel_webhook(request: Request):
#     update = telegram.Update.de_json(await request.json(), bot)
#     update_queue.put(update)
#     return
