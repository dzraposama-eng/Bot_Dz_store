import telebot
from telebot.types import ReplyKeyboardMarkup, KeyboardButton

# Cole o token que você pegou no BotFather aqui
API_TOKEN = '8829119917:AAHfz0KUtKzItK2IanUixZOGRMfJiZJuxrc'
bot = telebot.TeleBot(API_TOKEN)

# Comando /start que inicia o bot
@bot.message_handler(commands=['start'])
def send_welcome(message):
    # Criando o teclado personalizado
    markup = ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    
    # Criando os botões idênticos aos da imagem
    btn_menu = KeyboardButton('🛒 Menu')
    btn_perfil = KeyboardButton('💎 Seu Perfil')
    btn_saldo = KeyboardButton('💰 Adiciona Saldo')
    btn_afiliados = KeyboardButton('👤 Afiliados')
    btn_vip = KeyboardButton('SEJA CLIENTE VIP')
    
    # Organizando as linhas dos botões
    markup.add(btn_menu, btn_perfil)
    markup.add(btn_saldo)
    markup.add(btn_afiliados)
    markup.add(btn_vip)
    
    # Mensagem de texto que aparece acima dos botões
    texto_boas_vindas = (
        "👑 **MAGIC STORE** 👑\n\n"
        "📞 Dúvidas somente via suporte\n\n"
        "🚀 Seja profissional."
    )
    
    bot.send_message(message.chat.id, texto_boas_vindas, reply_markup=markup, parse_mode='Markdown')

# Rodar o bot continuamente
bot.polling()

