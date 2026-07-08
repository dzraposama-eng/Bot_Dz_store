import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

# 1. COLE O SEU TOKEN DO BOTFATHER AQUI DENTRO DAS ASPAS:
TOKEN = "8829119917:AAHfz0KUtKzItK2IanUixZOGRMfJiZJuxrc"
bot = telebot.TeleBot(TOKEN)

# 2. SEU BANCO DE DADOS DE FRASES
frases = {
    "1": {
        "amostra": "O sucesso não é o fim, o fracasso não é fatal: o que conta é...",
        "completa": "O sucesso não é o fim, o fracasso não é fatal: o que conta é a coragem para continuar. – Winston Churchill",
        "preco": "R$ 2,00"
    },
    "2": {
        "amostra": "A única maneira de fazer um excelente trabalho é...",
        "completa": "A única maneira de fazer um excelente trabalho é amar o que você faz. – Steve Jobs",
        "preco": "R$ 3,00"
    },
    "3": {
        "amostra": "Não espere por oportunidades, você deve...",
        "completa": "Não espere por oportunidades, você deve criá-las. – Autor Desconhecido",
        "preco": "R$ 1,50"
    }
}

# Função para criar o menu de uma frase específica com botões de navegação
def gerar_menu_frase(id_atual, user_id):
    dados = frases[id_atual]
    
    texto = (
        f"👤 **Seu ID de Usuário:** `{user_id}`\n"
        f"---------------------------------------\n"
        f"🆔 **Frase ID Único: #{id_atual}**\n"
        f"📝 **Spoiler:** \"{dados['amostra']}\"\n\n"
        f"💰 **Valor:** {dados['preco']}"
    )
    
    markup = InlineKeyboardMarkup()
    
    # Linha 1: Botão de Compra
    botao_comprar = InlineKeyboardButton("🔓 Liberar Frase Completa", callback_data=f"comprar_{id_atual}")
    markup.row(botao_comprar)
    
    # Linha 2: Botões Próximo e Anterior
    botoes_navegacao = []
    
    id_anterior = str(int(id_atual) - 1)
    if id_anterior in frases:
        botoes_navegacao.append(InlineKeyboardButton("⬅️ Anterior", callback_data=f"ir_{id_anterior}"))
        
    id_proximo = str(int(id_atual) + 1)
    if id_proximo in frases:
        botoes_navegacao.append(InlineKeyboardButton("Próximo ➡️", callback_data=f"ir_{id_proximo}"))
        
    markup.row(*botoes_navegacao)
    
    return texto, markup

# Comando /start
@bot.message_handler(commands=['start', 'ver'])
def iniciar_catalogo(message):
    # Pega o ID único do usuário do Telegram
    user_id = message.from_user.id
    
    texto, markup = gerar_menu_frase("1", user_id)
    bot.send_message(message.chat.id, texto, reply_markup=markup, parse_mode="Markdown")

# Controla a navegação (Botões Anterior e Próximo)
@bot.callback_query_handler(func=lambda call: call.data.startswith("ir_"))
def navegar_frases(call):
    user_id = call.from_user.id
    id_destino = call.data.split("_")[1]
    texto, markup = gerar_menu_frase(id_destino, user_id)
    
    bot.edit_message_text(texto, call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# Controla o clique no botão "Comprar"
@bot.callback_query_handler(func=lambda call: call.data.startswith("comprar_"))
def processar_compra(call):
    user_id = call.from_user.id
    id_frase = call.data.split("_")[1]
    frase_escolhida = frases[id_frase]
    
    texto_pix = (
        f"👤 **Cliente ID:** `{user_id}`\n"
        f"⚡ **PIX GERADO PARA A FRASE #{id_frase}** ⚡\n\n"
        f"🔑 Chave Aleatória: `123e4567-e89b-12d3-a456-426614174000`\n"
        f"💵 Valor: {frase_escolhida['preco']}\n\n"
        "Simule o pagamento e clique abaixo para liberar."
    )
    
    markup = InlineKeyboardMarkup()
    botao_confirmar = InlineKeyboardButton("Confirmar Pagamento 💸", callback_data=f"pago_{id_frase}")
    botao_voltar = InlineKeyboardButton("🔙 Voltar ao Catálogo", callback_data=f"ir_{id_frase}")
    markup.row(botao_confirmar)
    markup.row(botao_voltar)
    
    bot.edit_message_text(texto_pix, call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# Controla a entrega da frase pós-pagamento
@bot.callback_query_handler(func=lambda call: call.data.startswith("pago_"))
def entregar_frase(call):
    user_id = call.from_user.id
    id_frase = call.data.split("_")[1]
    frase_completa = frases[id_frase]["completa"]
    
    texto_entrega = (
        f"✅ **Pagamento Confirmado!** 🎉\n"
        f"👤 **Cliente ID:** `{user_id}`\n\n"
        f"Aqui está a sua frase completa (ID #{id_frase}):\n\n"
        f"_*\"{frase_completa}\"*_"
    )
    
    markup = InlineKeyboardMarkup()
    botao_Voltar = InlineKeyboardButton("📱 Ver outras frases", callback_data="ir_1")
    markup.row(botao_Voltar)
    
    bot.edit_message_text(texto_entrega, call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# Inicia o robô
print("🤖 BOT COM IDENTIFICAÇÃO DE USUÁRIO LIGADO!")
bot.infinity_polling()
