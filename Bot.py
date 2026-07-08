import telebot
from telebot import types
import os
from threading import Thread
from flask import Flask

BOT_TOKEN = os.environ.get('TOKEN', '8829119917:AAGQHWCcMejBnezPR00HbSwb1g-C-NSRQDQ')
bot = telebot.TeleBot(BOT_TOKEN)

users = {}

def get_user(user_id):
    if user_id not in users:
        users[user_id] = {'saldo': 0.0, 'vip': False}
    return users[user_id]

# --- MENU INICIAL COM FOTO ---
@bot.message_handler(commands=['start'])
def start(message):
    user = get_user(message.chat.id)
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("🛒 Cc full", callback_data="catalogo"))
    markup.add(types.InlineKeyboardButton("💰 Adicionar Saldo", callback_data="add_saldo"))
    markup.add(types.InlineKeyboardButton("⭐ Área VIP", callback_data="area_vip"))
    
    try:
        # Envia a foto que está na mesma pasta no GitHub
        foto = open('foto_perfil.png', 'rb')
        bot.send_photo(message.chat.id, foto, caption=f"Bem-vindo à Riley Store!\nSeu saldo: R$ {user['saldo']:.2f}", reply_markup=markup)
        foto.close()
    except Exception as e:
        bot.send_message(message.chat.id, f"Bem-vindo! (Erro ao carregar foto: {e})", reply_markup=markup)

# --- GERENCIADOR DE BOTÕES ---
@bot.callback_query_handler(func=lambda call: True)
def callback(call):
    user = get_user(call.message.chat.id)
    bot.answer_callback_query(call.id)

    # 1. MENU PRINCIPAL (Destino do Voltar)
    if call.data == "menu_principal":
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("🛒 Cc full", callback_data="catalogo"))
        markup.add(types.InlineKeyboardButton("💰 Adicionar Saldo", callback_data="add_saldo"))
        markup.add(types.InlineKeyboardButton("⭐ Área VIP", callback_data="area_vip"))
        bot.edit_message_caption(f"Bem-vindo à Riley Store!\nSeu saldo: R$ {user['saldo']:.2f}", 
                                 call.message.chat.id, call.message.message_id, reply_markup=markup)

    # 2. CATÁLOGO
    elif call.data == "catalogo":
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("Script Básico - R$ 5", callback_data="buy_basico"))
        markup.add(types.InlineKeyboardButton("⬅️ Voltar", callback_data="menu_principal"))
        bot.edit_message_caption("Nosso Catálogo:", call.message.chat.id, call.message.message_id, reply_markup=markup)

    # 3. SALDO
    elif call.data == "add_saldo":
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("✅ Já paguei!", callback_data="verificar_pagamento"))
        markup.add(types.InlineKeyboardButton("⬅️ Voltar", callback_data="menu_principal"))
        bot.edit_message_caption("Simulação: O PIX foi gerado!", call.message.chat.id, call.message.message_id, reply_markup=markup)

    # ... (Restante das suas funções de VIP e Pagamento)

# --- SERVIDOR ---
app = Flask('')
@app.route('/')
def home(): return "Bot online!"
def run(): app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 8080)))
Thread(target=run).start()
bot.polling(none_stop=True)


