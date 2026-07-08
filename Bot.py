from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# Função /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Criando o menu personalizado
    keyboard = [['👤 Perfil', '🛒 Comprar']]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    
    await update.message.reply_text(
        "Olá! Bem-vindo ao bot. Escolha uma opção:", 
        reply_markup=reply_markup
    )

# Função de Perfil (Mostra ID único)
async def perfil(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    await update.message.reply_text(f"Seu ID único é: {user_id}")

# Função de Comprar
async def comprar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Você selecionou a opção de compra! (Aqui você integraria um meio de pagamento).")

if __name__ == '__main__':
    # Insira o seu TOKEN aqui
    app = ApplicationBuilder().token("8829119917:AAHfz0KUtKzItK2IanUixZOGRMfJiZJuxrc").build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("perfil", perfil)) # ou tratar como texto
    
    print("Bot rodando...")
    app.run_polling()
