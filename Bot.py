import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

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

# Texto padrão dos termos (Exatamente igual ao print)
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

# Função para criar o Menu Principal flutuante (Estilo o print)
def gerar_menu_principal():
    markup = InlineKeyboardMarkup()
    
    # Linha 1: Menu e Seu Perfil lado a lado
    btn_menu = InlineKeyboardButton("🛒 Menu / Comprar", callback_data="menu_comprar")
    btn_perfil = InlineKeyboardButton("💎 Seu Perfil", callback_data="menu_perfil")
    markup.row(btn_menu, btn_perfil)
    
    #
