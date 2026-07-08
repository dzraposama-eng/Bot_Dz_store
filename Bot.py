import telebot
from telebot import types
import mercadopago
import os
from threading import Thread
from flask import Flask

# --- CONFIGURAÇÕES ---
BOT_TOKEN = '8829119917:AAHfz0KUtKzItK2IanUixZOGRMfJiZJuxrc'
MP_TOKEN = 'SEU_TOKEN_MERCADO_PAGO_AQUI'

bot = telebot.TeleBot(BOT_TOKEN)
sdk = mercadopago.SDK(MP_TOKEN)

# Banco de dados corrigido (adicionada vírgula que faltava)
users = {}
catalogo_itens = [
    {"id": 0, "nome": "Script Básico", "preco": 5.0},
    {"id": 1, "nome": "Script Intermediário", "preco": 10.0},
    {"id": 2, "nome": "Script Avançado", "preco": 20.0}, # <--- VÍRGULA AQUI
    {"id": 3, "nome": "Script Básico", "preco": 5.0},
    {"id": 4, "nome": "Script Intermediário", "preco": 10.0},
    {"id": 5, "nome": "Script Avançado", "preco": 20.0}
]

def get_user(user_id):
    if user_id not in users:
        # Adicionada a lista 'compras' para evitar erro no comando /bin
        users[user_id] = {'saldo': 0.0, 'compras': []}
    return users[user_id]

# --- FUNÇÕES AUXILIARES ---
def menu_principal(call):
    user = get_user(call.message.chat.id)
    
    markup.add(types.InlineKeyboardButton("🛒 Ver Catálogo", callback_data="cat_0"))
    markup.add(types.InlineKeyboardButton("💰 Adicionar Saldo", callback_data="add_saldo"))
    markup.add(types.InlineKeyboardButton("👤 Meu Perfil", callback_data="perfil"))
    bot.edit_message_text(f"📱 **Magic Store**\nSeu saldo: R$ {user['saldo']:.2f}", 
                          call.message.chat.id, call.message.message_id, 
                          reply_markup=markup, parse_mode="Markdown")

# --- COMANDOS ---
@bot.message_handler(commands=['start'])
def start(message):
    foto_url = "https://img.freepik.com/vetores-gratis/fundo-de-tecnologia-digital-futurista_23-2148911068.jpg" 
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("Abrir Menu", callback_data="menu_start"))
    bot.send_photo(message.chat.id, photo=foto_url, caption="Bem-vindo à Magic Store!", reply_markup=markup)

@bot.message_handler(commands=['bin'])
def mostrar_bin(message):
    user = get_user(message.chat.id)
    if not user['compras']:
        bot.send_message(message.chat.id, "Sua bin está vazia!")
    else:
        lista = "\n".join([f"✅ {item}" for item in user['compras']])
        bot.send_message(message.chat.id, f"📦 **Seus itens:**\n\n{lista}")

# --- CALLBACKS ---
@bot.callback_query_handler(func=lambda call: True)
def callback(call):
    user = get_user(call.message.chat.id)
    
    if call.data == "menu_start":
        menu_principal(call)
    
    elif call.data.startswith("cat_"):
        idx = int(call.data.split("_")[1])
        item = catalogo_itens[idx]
        markup = types.InlineKeyboardMarkup()
        row = []
        if idx > 0: row.append(types.InlineKeyboardButton("⬅️ Anterior", callback_data=f"cat_{idx-1}"))
        if idx < len(catalogo_itens) - 1: row.append(types.InlineKeyboardButton("Próximo ➡️", callback_data=f"cat_{idx+1}"))
        markup.row(*row)
        markup.add(types.InlineKeyboardButton(f"💳 Comprar (R$ {item['preco']})", callback_data=f"buy_{idx}"))
        markup.add(types.InlineKeyboardButton("🔙 Voltar", callback_data="menu_start"))
        bot.edit_message_text(f"🛍 **{item['nome']}**\nPreço: R$ {item['preco']:.2f}", call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

    elif call.data.startswith("buy_"):
        idx = int(call.data.split("_")[1])
        item = catalogo_itens[idx]
        if user['saldo'] >= item['preco']:
            user['saldo'] -= item['preco']
            user['compras'].append(item['nome'])
            bot.answer_callback_query(call.id, "Compra realizada!")
        else:
            bot.answer_callback_query(call.id, "Saldo insuficiente!")

    elif call.data == "perfil":
        bot.edit_message_text(f"Saldo: R$ {user['saldo']:.2f}", call.message.chat.id, call.message.message_id, reply_markup=types.InlineKeyboardMarkup().add(types.InlineKeyboardButton("🔙 Voltar", callback_data="menu_start")))

# --- INICIALIZAÇÃO ---
if __name__ == "__main__":
    def run_flask():
        app = Flask(__name__)
        @app.route('/')
        def home(): return "Bot online"
        app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 8080)))
    
    Thread(target=run_flask).start()
    bot.infinity_polling(skip_pending=True)
