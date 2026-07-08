import telebot
from telebot import types
import mercadopago
import os
from threading import Thread
from flask import Flask

# --- CONFIGURAÇÕES ---
BOT_TOKEN = '8829119917:AAGQHWCcMejBnezPR00HbSwb1g-C-NSRQDQ'
MP_TOKEN = 'SEU_TOKEN_MERCADO_PAGO_AQUI'

bot = telebot.TeleBot(BOT_TOKEN)
sdk = mercadopago.SDK(MP_TOKEN)

# Banco de dados simulado
users = {}
catalogo_itens = [
    {"id": 0, "nome": "Script Básico", "preco": 5.0},
    {"id": 1, "nome": "Script Intermediário", "preco": 10.0},
    {"id": 2, "nome": "Script Avançado", "preco": 20.0}
    {"id": 3, "nome": "Script Básico", "preco": 5.0},
    {"id": 4, "nome": "Script Intermediário", "preco": 10.0},
    {"id": 4, "nome": "Script Avançado", "preco": 20.0}
]

def get_user(user_id):
    if user_id not in users:
        users[user_id] = {'saldo': 0.0}
    return users[user_id]

# --- FUNÇÕES AUXILIARES ---
def menu_principal(call):
    user = get_user(call.message.chat.id)
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("🛒 Ver Catálogo", callback_data="cat_0"))
    markup.add(types.InlineKeyboardButton("💰 Adicionar Saldo", callback_data="add_saldo"))
    markup.add(types.InlineKeyboardButton("👤 Meu Perfil", callback_data="perfil"))
    bot.edit_message_text(f"📱 **Magic Store**\nSeu saldo: R$ {user['saldo']:.2f}", 
                          call.message.chat.id, call.message.message_id, 
                          reply_markup=markup, parse_mode="Markdown")

# --- COMANDOS ---
@bot.message_handler(commands=['start'])
def start(message):
    # Link da foto que você quer enviar (pode ser uma URL direta ou caminho de arquivo)
    foto_url = "https://exemplo.com/sua_imagem.jpg" 
    
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("Abrir Menu", callback_data="menu_start"))
    
    # Envia a foto com a legenda e os botões
    bot.send_photo(
        message.chat.id, 
        photo=foto_url, 
        caption="Bem-vindo à Magic Store! A loja mais completa do Telegram.", 
        reply_markup=markup
    )
@bot.message_handler(commands=['bin'])
def mostrar_bin(message):
    user = get_user(message.chat.id)
    
    if not user['compras']:
        bot.send_message(message.chat.id, "Sua bin está vazia! Você ainda não comprou nada.")
    else:
        # Formata a lista de compras
        lista_compras = "\n".join([f"✅ {item}" for item in user['compras']])
        bot.send_message(message.chat.id, f"📦 **Seus itens comprados:**\n\n{lista_compras}")


# --- CALLBACKS ---
@bot.callback_query_handler(func=lambda call: True)
def callback(call):
    user = get_user(call.message.chat.id)
    
    if call.data == "menu_start":
        menu_principal(call)

    # Paginação do Catálogo
    elif call.data.startswith("cat_"):
        idx = int(call.data.split("_")[1])
        item = catalogo_itens[idx]
        markup = types.InlineKeyboardMarkup()
        
        # Paginação
        row = []
        if idx > 0: row.append(types.InlineKeyboardButton("⬅️ Anterior", callback_data=f"cat_{idx-1}"))
        if idx < len(catalogo_itens) - 1: row.append(types.InlineKeyboardButton("Próximo ➡️", callback_data=f"cat_{idx+1}"))
        markup.row(*row)
        
        markup.add(types.InlineKeyboardButton(f"💳 Comprar (R$ {item['preco']})", callback_data=f"buy_{idx}"))
        markup.add(types.InlineKeyboardButton("🔙 Voltar ao Menu", callback_data="menu_start"))
        
        bot.edit_message_text(f"🛍 **{item['nome']}**\nPreço: R$ {item['preco']:.2f}", 
                              call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

    # Pagamento Mercado Pago
    elif call.data == "add_saldo":
        preference = sdk.preference().create({
            "items": [{"title": "Recarga Saldo", "quantity": 1, "unit_price": 20.0}]
        })
        link = preference["response"]["init_point"]
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("Pagar R$ 20,00", url=link))
        markup.add(types.InlineKeyboardButton("🔙 Voltar", callback_data="menu_start"))
        bot.edit_message_text("Clique no botão abaixo para pagar:", call.message.chat.id, call.message.message_id, reply_markup=markup)

    elif call.data == "perfil":
        bot.edit_message_text(f"Seu saldo atual: R$ {user['saldo']:.2f}", call.message.chat.id, call.message.message_id, 
                              reply_markup=types.InlineKeyboardMarkup().add(types.InlineKeyboardButton("🔙 Voltar", callback_data="menu_start")))

# --- MANTENDO O BOT VIVO ---
app = Flask(__name__)
@app.route('/')
def home(): return "Bot online"

def keep_alive():
    Thread(target=lambda: app.run(host='0.0.0.0', port=8080)).start()

if __name__ == "__main__":
    keep_alive()
    bot.polling(none_stop=True)
