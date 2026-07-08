import telebot
from telebot import types
import datetime
import os
from threading import Thread
from flask import Flask

# --- CONFIGURAÇÕES ---
# Puxa o token direto do Render. Se não achar, usa o seu padrão como segurança.
BOT_TOKEN = os.environ.get('TOKEN', '8829119917:AAGQHWCcMejBnezPR00HbSwb1g-C-NSRQDQ')
ADMIN_ID = '8827427559'
MERCADO_PAGO_TOKEN = "TESTUSER1392255988148858685"

bot = telebot.TeleBot(BOT_TOKEN)

# --- BANCO DE DADOS SIMULADO ---
users = {} # {user_id: {'saldo': 0.0, 'vip': False, 'vip_expira': None}}

def get_user(user_id):
    if user_id not in users:
        users[user_id] = {'saldo': 0.0, 'vip': False, 'vip_expira': None}
    return users[user_id]

# --- FUNÇÕES DE MENU ---
@bot.message_handler(commands=['start'])
def start(message):
    user = get_user(message.chat.id)
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("🛒 Cc full ", callback_data="catalogo"))
    markup.add(types.InlineKeyboardButton("💰 Adicionar Saldo", callback_data="add_saldo"))
    markup.add(types.InlineKeyboardButton("⭐ Área VIP", callback_data="area_vip"))
    bot.send_message(message.chat.id, f"Bem-vindo à Riley Store!\nSeu saldo: R$ {user['saldo']:.2f}", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: True)
def callback(call):
    user = get_user(call.message.chat.id)
    bot.answer_callback_query(call.id) # Isso evita o "reloginho" no botão

    # 1. MENU PRINCIPAL
    if call.data == "menu_principal":
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("🛒 Cc full", callback_data="catalogo"))
        markup.add(types.InlineKeyboardButton("💰 Adicionar Saldo", callback_data="add_saldo"))
        markup.add(types.InlineKeyboardButton("⭐ Área VIP", callback_data="area_vip"))
        bot.edit_message_text(f"Bem-vindo à Riley Store!\nSeu saldo: R$ {user['saldo']:.2f}", 
                              call.message.chat.id, call.message.message_id, reply_markup=markup)

    # 2. CATÁLOGO
    elif call.data == "catalogo":
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("Script Básico - R$ 5", callback_data="buy_basico"))
        texto = "⭐ [VIP ONLY] Script Secreto" if user['vip'] else "🔒 [VIP ONLY] (Bloqueado)"
        markup.add(types.InlineKeyboardButton(texto, callback_data="buy_vip"))
        markup.add(types.InlineKeyboardButton("⬅️ Voltar", callback_data="menu_principal"))
        bot.edit_message_text("Nosso Catálogo:", call.message.chat.id, call.message.message_id, reply_markup=markup)

    # 3. SALDO
    elif call.data == "add_saldo":
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("✅ Já paguei!", callback_data="verificar_pagamento"))
        markup.add(types.InlineKeyboardButton("⬅️ Voltar", callback_data="menu_principal"))
        bot.edit_message_text("Simulação: O PIX foi gerado! Clique abaixo para confirmar.", 
                              call.message.chat.id, call.message.message_id, reply_markup=markup)

    elif call.data == "verificar_pagamento":
        user['saldo'] += 20.0
        bot.edit_message_text(f"Pagamento aprovado! Seu saldo agora é R$ {user['saldo']:.2f}", 
                              call.message.chat.id, call.message.message_id, 
                              reply_markup=types.InlineKeyboardMarkup().add(types.InlineKeyboardButton("🏠 Menu Inicial", callback_data="menu_principal")))

    # 4. VIP
    elif call.data == "area_vip":
        status = "ATIVO" if user['vip'] else "INATIVO"
        markup = types.InlineKeyboardMarkup()
        if not user['vip']:
            markup.add(types.InlineKeyboardButton("👑 Ativar VIP - R$ 15,00", callback_data="ativar_vip"))
        markup.add(types.InlineKeyboardButton("⬅️ Voltar", callback_data="menu_principal"))
        bot.edit_message_text(f"Status VIP: {status}\n\nAssinantes VIP acessam o Script Secreto!", 
                              call.message.chat.id, call.message.message_id, reply_markup=markup)

    elif call.data == "ativar_vip":
        if user['saldo'] >= 15.0:
            user['saldo'] -= 15.0
            user['vip'] = True
            bot.answer_callback_query(call.id, "Parabéns, você é VIP!")
            # Retorna ao menu após ativar
            callback(types.CallbackQuery(None, call.from_user, None, None, None, "menu_principal"))
        else:
            bot.answer_callback_query(call.id, "Saldo insuficiente!")




    elif call.data == "add_saldo":
        bot.send_message(call.message.chat.id, "Simulação: O PIX foi gerado! Clique abaixo para confirmar.", 
                         reply_markup=types.InlineKeyboardMarkup().add(types.InlineKeyboardButton("✅ Já paguei! Verificar", callback_data="verificar_pagamento")))

    elif call.data == "verificar_pagamento":
        user['saldo'] += 20.0
        bot.answer_callback_query(call.id, "Pagamento aprovado! R$ 20,00 adicionados.")
        bot.send_message(call.message.chat.id, "Saldo atualizado! Seu saldo agora é R$ 20.00")

    elif call.data == "area_vip":
        status = "ATIVO" if user['vip'] else "INATIVO"
        markup = types.InlineKeyboardMarkup()
        if not user['vip']:
            markup.add(types.InlineKeyboardButton("👑 Ativar VIP - R$ 15,00", callback_data="ativar_vip"))
        bot.edit_message_text(f"Status VIP: {status}\n\nAssinantes VIP acessam o Script Secreto!", call.message.chat.id, call.message.message_id, reply_markup=markup)

    elif call.data == "ativar_vip":
        if user['saldo'] >= 15.0:
            user['saldo'] -= 15.0
            user['vip'] = True
            bot.answer_callback_query(call.id, "Parabéns, você é VIP!")
            bot.send_message(call.message.chat.id, "VIP ativado com sucesso! Aproveite os benefícios.")
        else:
            bot.answer_callback_query(call.id, "Saldo insuficiente!")

    elif call.data == "buy_vip":
        if user['vip']:
            bot.send_message(call.message.chat.id, "Aqui está seu arquivo secreto: [LINK_DO_ARQUIVO]")
        else:
            bot.send_message(call.message.chat.id, "Você precisa ser VIP para acessar isso!")

# --- SERVIDOR WEB PARA MANTER O BOT VIVO NO RENDER ---
app = Flask('')

@app.route('/')
def home():
    return "Bot está vivo e online!"

def run():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

def keep_alive():
    t = Thread(target=run)
    t.start()

# --- INICIALIZAÇÃO ---
print("Bot ligado...")
keep_alive()  # Inicia o servidor web em paralelo
bot.polling(none_stop=True)  # Mantém o bot escutando mesmo com instabilidades

