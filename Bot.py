import telebot
from telebot.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton

# 1. COLE O SEU TOKEN DO BOTFATHER AQUI DENTRO DAS ASPAS:
TOKEN = "8829119917:AAHfz0KUtKzItK2IanUixZOGRMfJiZJuxrc"
bot = telebot.TeleBot(TOKEN)

# 2. BANCO DE DADOS DAS FRASES
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

# Texto padrão das regras / termos (estilo o seu print)
TEXTO_TERMOS = (
    "⚡ **RECARGAS AUTOMÁTICAS VIA PIX**\n\n"
    "🚨 **TERMOS IMPORTANTES:**\n"
    "⚠️ Sem reembolso de saldo\n"
    "⚠️ Sistema de entrega imediata ativo\n"
    "⚠️ Uso indevido = BAN + perda de acesso\n\n"
    "📞 Suporte: @SeuSuporteExemplo\n\n"
    "👑 Seja profissional.\n"
    "🚀 Seja uma Frase Store."
)

# Função que gera o catálogo interno de frases (com navegação)
def gerar_menu_frase(id_atual, user_id):
    dados = frases[id_atual]
    
    texto = (
        f"👤 **ID Usuário:** `{user_id}`\n"
        f"---------------------------------------\n"
        f"🆔 **Frase ID Único: #{id_atual}**\n"
        f"📝 **Spoiler:** \"{dados['amostra']}\"\n\n"
        f"💰 **Valor:** {dados['preco']}"
    )
    
    markup = InlineKeyboardMarkup()
    
    # Botão de liberação/compra
    botao_comprar = InlineKeyboardButton("🔓 Liberar Frase Completa", callback_data=f"comprar_{id_atual}")
    markup.row(botao_comprar)
    
    # Botões de Navegação Anterior/Próximo
    botoes_navegacao = []
    id_anterior = str(int(id_atual) - 1)
    if id_anterior in frases:
        botoes_navegacao.append(InlineKeyboardButton("⬅️ Anterior", callback_data=f"ir_{id_anterior}"))
        
    id_proximo = str(int(id_atual) + 1)
    if id_proximo in frases:
        botoes_navegacao.append(InlineKeyboardButton("Próximo ➡️", callback_data=f"ir_{id_proximo}"))
        
    markup.row(*botoes_navegacao)
    return texto, markup

# Mensagem Inicial / Painel de botões igual ao print
@bot.message_handler(commands=['start'])
def enviar_painel_principal(message):
    # Cria os botões fixos grandes na parte de baixo do chat
    markup = ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    
    btn_menu = KeyboardButton("🛒 Comprar Frases")
    btn_perfil = KeyboardButton("💎 Seu Perfil")
    btn_saldo = KeyboardButton("💰 Adicionar Saldo")
    btn_termos = KeyboardButton("📜 Termos / Regras")
    
    # Organiza igual ao visual do print (linha 1 com dois botões, demais verticais)
    markup.row(btn_menu, btn_perfil)
    markup.row(btn_saldo)
    markup.row(btn_termos)
    
    bot.send_message(message.chat.id, TEXTO_TERMOS, reply_markup=markup, parse_mode="Markdown")

# Escuta os botões de texto clicados abaixo
@bot.message_handler(func=lambda message: True)
def tratar_botoes_menu(message):
    user_id = message.from_user.id
    
    if message.text == "🛒 Comprar Frases":
        # Abre o catálogo interno de frases começando do ID 1
        texto, markup = gerar_menu_frase("1", user_id)
        bot.send_message(message.chat.id, texto, reply_markup=markup, parse_mode="Markdown")
        
    elif message.text == "💎 Seu Perfil":
        bot.reply_to(message, f"👤 **Seu Perfil**\n\n🆔 ID: `{user_id}`\n💵 Saldo: R$ 0,00\nFrases Compradas: 0", parse_mode="Markdown")
        
    elif message.text == "💰 Adicionar Saldo":
        bot.reply_to(message, "Entre em contato com o suporte ou use o comando automático para gerar um PIX de recarga.")
        
    elif message.text == "📜 Termos / Regras":
        bot.send_message(message.chat.id, TEXTO_TERMOS, parse_mode="Markdown")

# Controle de navegação interna do catálogo (Inline)
@bot.callback_query_handler(func=lambda call: call.data.startswith("ir_"))
def navegar_frases(call):
    user_id = call.from_user.id
    id_destino = call.data.split("_")[1]
    texto, markup = gerar_menu_frase(id_destino, user_id)
    bot.edit_message_text(texto, call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# Processo de Compra interna
@bot.callback_query_handler(func=lambda call: call.data.startswith("comprar_"))
def processar_compra(call):
    user_id = call.from_user.id
    id_frase = call.data.split("_")[1]
    frase_escolhida = frases[id_frase]
    
    texto_pix = (
        f"⚡ **PIX GERADO PARA A FRASE #{id_frase}** ⚡\n\n"
        f"🔑 Chave Aleatória: `123e4567-e89b-12d3-a456-426614174000`\n"
        f"💵 Valor: {frase_escolhida['preco']}\n\n"
        "Simule o pagamento clicando abaixo."
    )
    
    markup = InlineKeyboardMarkup()
    botao_confirmar = InlineKeyboardButton("Confirmar Pagamento 💸", callback_data=f"pago_{id_frase}")
    botao_voltar = InlineKeyboardButton("🔙 Voltar ao Catálogo", callback_data=f"ir_{id_frase}")
    markup.row(botao_confirmar)
    markup.row(botao_voltar)
    
    bot.edit_message_text(texto_pix, call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# Entrega da frase pós-pagamento
@bot.callback_query_handler(func=lambda call: call.data.startswith("pago_"))
def entregar_frase(call):
    user_id = call.from_user.id
    id_frase = call.data.split("_")[1]
    frase_completa = frases[id_frase]["completa"]
    
    texto_entrega = (
        f"✅ **Pagamento Confirmado!** 🎉\n\n"
        f"Aqui está a sua frase completa (ID #{id_frase}):\n\n"
        f"_*\"{frase_completa}\"*_"
    )
    
    markup = InlineKeyboardMarkup()
    botao_voltar = InlineKeyboardButton("📱 Ver outras frases", callback_data="ir_1")
    markup.row(botao_voltar)
    
    bot.edit_message_text(texto_entrega, call.message.chat.id, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# Inicia o robô
print("🤖 LOJA DE FRASES COM DESIGN DO PRINT LIGADA!")
bot.infinity_polling()
