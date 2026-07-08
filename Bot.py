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
    }
}

TEXTO_STORE = (
    "⚡ Recargas automáticas via PIX\n\n"
    "🚨 **TERMOS IMPORTANTES:**\n"
    "⚠️ Sem reembolso de saldo\n"
    "⚠️ Sistema antifraude ativo\n"
    "⚠️ Uso indevido = BAN + perda de saldo\n"
    "⚠️ Garantimos entrega imediata\n"
    "⚠️ Dúvidas somente via suporte\n\n"
    "📢 Grupo: @SeuGrupo\n"
    "📢 Canal: @SeuCanal\n"
    "📞 Suporte: @SeuSuporte\n\n"
    "👑 Seja profissional.\n"
    "🚀 Seja Frases Store."
)

# Função que gera o menu exatamente igual ao layout do print
def gerar_menu_estilo_print():
    markup = InlineKeyboardMarkup()
    
    # Linha 1: Dois botões lado a lado
    btn_menu = InlineKeyboardButton("🛒 Menu", callback_data="abrir_catalogo")
    btn_perfil = InlineKeyboardButton("💎 Seu Perfil", callback_data="ver_perfil")
    markup.row(btn_menu, btn_perfil)
    
    # Linha 2: Botão único vertical
    btn_saldo = InlineKeyboardButton("💰 Adiciona Saldo", callback_data="add_saldo")
    markup.row(btn_saldo)
    
    # Linha 3: Botão único vertical
    btn_afiliados = InlineKeyboardButton("👤 Afiliados", callback_data="ver_afiliados")
    markup.row(btn_afiliados)
    
    # Linha 4: Botão de destaque embaixo
    btn_vip = InlineKeyboardButton("👑 SEJA CLIENTE VIP FRASES STORE", callback_data="ver_vip")
    markup.row(btn_vip)
    
    return markup

# Catálogo interno das frases (Gera ID único e navegação)
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
    
    botao_comprar = InlineKeyboardButton("🔓 Liberar Frase Completa", callback_data=f"comprar_{id_atual}")
    markup.row(botao_comprar)
    
    botoes_navegacao = []
    id_anterior = str(int(id_atual) - 1)
    if id_anterior in frases:
        botoes_navegacao.append(InlineKeyboardButton("⬅️ Anterior", callback_data=f"ir_{id_anterior}"))
        
    id_proximo = str(int(id_atual) + 1)
    if id_proximo in frases:
        botoes_navegacao.append(InlineKeyboardButton("Próximo ➡️", callback_data=f"ir_{id_proximo}"))
    markup.row(*botoes_navegacao)
    
    markup.row(InlineKeyboardButton("🔙 Voltar ao Menu Principal", callback_data="voltar_menu"))
    return texto, markup

# Comando /start
@bot.message_

