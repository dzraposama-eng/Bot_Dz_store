import telebot
from telebot import types
import os
from threading import Thread
from flask import Flask

BOT_TOKEN = os.environ.get('TOKEN', 'SEU_TOKEN_AQUI')
bot = telebot.TeleBot(BOT_TOKEN)

# Banco de dados simples
users = {}

def get_menu_fixo():
    # Cria o menu fixo inferior (como na sua imagem)
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
    markup.add(types.KeyboardButton("🛒 Menu"), types.KeyboardButton("💎 Seu Perfil"))
    markup.add(types.KeyboardButton("💰 Adiciona Saldo"))
    markup.add(types.KeyboardButton("👤 Afiliados"), types.KeyboardButton("👑 SEJA CLIENTE VIP"))
    return markup

@bot.message_handler(commands=['start'])
def start(message):
    texto_boas_vindas = """
⚡ Recargas automáticas via PIX

🚨 TERMOS IMPORTANTES:
⚠️ Sem reembolso de saldo
⚠️ Sistema antifraude ativo
⚠️ Uso indevido = BAN + perda de saldo
⚠️ Garantimos apenas LIVE
⚠️ Trocas somente via bot em até 5 minutos

👑 Seja profissional.
🚀 Seja Riley Store.
    """
    bot.send_message(message.chat.id, texto_boas_vindas, reply_markup=get_menu_fixo())

@bot.message_handler(func=lambda message: True)
def responder_mensagens(message):
    user_id = message.chat.id
    if user_id not in users: users[user_id] = {'saldo': 0.0, 'vip': False}

    if message.text == "🛒 Menu":
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("Cc Full", callback_data="cc_full"))
        bot.send_message(message.chat.id, "Escolha um produto:", reply_markup=markup)
    
    elif message.text == "💎 Seu Perfil":
        bot.send_message(message.chat.id, f"Seu Saldo: R$ {users[user_id]['saldo']:.2f}\nVIP: {'Sim' if users[user_id]['vip'] else 'Não'}")

    elif message.text == "💰 Adiciona Saldo":
        bot.send_message(message.chat.id, "Envie o comprovante PIX para o suporte.")

# --- SERVIDOR WEB (Manter Vivo) ---
app = Flask('')
@app.route('/')
def home(): return "Bot online!"
def run(): app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 8080)))
Thread(target=run).start()
bot.polling(none_stop=True)

