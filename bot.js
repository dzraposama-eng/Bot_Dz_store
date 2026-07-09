const { Bot, InlineKeyboard } = require("grammy");

// Substitua pelo token do seu bot
const bot = new Bot(process.env.TELEGRAM_TOKEN);


const produtos = [
    { 
        id: 1, 
        nome: "Frase Motivacional Premium 01", 
        preco: "R$ 5,00",
        demonstracao: "💥 'O sucesso não é o final, o fracasso não é fatal: o que importa é...'", 
        completo: "💥 'O sucesso não é o final, o fracasso não é fatal: o que importa é a coragem de continuar.' - Winston Churchill"
    },
    { 
        id: 2, 
        nome: "Frase de Sabedoria 02", 
        preco: "R$ 4,90",
        demonstracao: "🌱 'A vida é igual a andar de bicicleta. Para manter o equilíbrio...'", 
        completo: "🌱 'A vida é igual a andar de bicicleta. Para manter o equilíbrio, você tem que se manter em movimento.' - Albert Einstein"
    }
];

];

// Menu Principal
const menuPrincipal = new InlineKeyboard()
    .text("🛒 Comprar", "menu_comprar")
    .text("👤 Meu Perfil", "menu_perfil");

// Comando /start
bot.command("start", async (ctx) => {
    await ctx.reply("Olá! Seja bem-vindo ao bot. Escolha uma opção no menu abaixo:", {
        reply_markup: menuPrincipal,
    });
});

// Voltar para o Menu Principal
bot.callbackQuery("menu_principal", async (ctx) => {
    await ctx.editMessageText("Escolha uma opção no menu abaixo:", {
        reply_markup: menuPrincipal,
    });
    await ctx.answerCallbackQuery();
});

// Opção: Perfil
bot.callbackQuery("menu_perfil", async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : "Não definido";
    const nome = ctx.from.first_name;

    const textoPerfil = `👤 *Seu Perfil:*\n\n` +
                        `🆔 *ID Único:* \`${userId}\`\n` +
                        `🏷️ *Nome:* ${nome}\n` +
                        `📱 *Usuário:* ${username}`;

    const botaoVoltar = new InlineKeyboard().text("⬅️ Voltar", "menu_principal");

    await ctx.editMessageText(textoPerfil, {
        parse_mode: "Markdown",
        reply_markup: botaoVoltar,
    });
    await ctx.answerCallbackQuery();
});

// Opção: Comprar (Inicia no índice 0)
bot.callbackQuery("menu_comprar", async (ctx) => {
    enviarCarrossel(ctx, 0);
    await ctx.answerCallbackQuery();
});

// Trata a paginação dos produtos (Próximo e Anterior)
bot.callbackQuery(/^comprar_page_(\d+)$/, async (ctx) => {
    const pagina = parseInt(ctx.match[1]);
    enviarCarrossel(ctx, pagina);
    await ctx.answerCallbackQuery();
});

// Função auxiliar para renderizar o carrossel de produtos
async function enviarCarrossel(ctx, index) {
    const produto = produtos[index];
    const total = produtos.length;

    const textoProduto = `🛒 *Vitrine de Produtos (${index + 1}/${total})*\n\n` +
                         `📦 *Produto:* ${produto.nome}\n` +
                         `💰 *Preço:* ${produto.preco}`;

    const teclado = new InlineKeyboard();

    // Botão Anterior (só aparece se não for o primeiro item)
    if (index > 0) {
        teclado.text("⬅️ Anterior", `comprar_page_${index - 1}`);
    } else {
        teclado.text("❌", "ignorar"); // Espaçador estético
    }

    // Botão Próximo (só aparece se não for o último item)
    if (index < total - 1) {
        teclado.text("Próximo ➡️", `comprar_page_${index + 1}`);
    } else {
        teclado.text("❌", "ignorar"); // Espaçador estético
    }

    // Botão de ação e voltar ao menu
    teclado.row()
           .text("💳 Finalizar Compra", `finalizar_${produto.id}`).row()
           .text("⬅️ Menu Principal", "menu_principal");

    await ctx.editMessageText(textoProduto, {
        parse_mode: "Markdown",
        reply_markup: teclado,
    });
}

// Resposta genérica para o botão inativo ou finalização
bot.callbackQuery("ignorar", async (ctx) => await ctx.answerCallbackQuery());

bot.callbackQuery(/^finalizar_(\d+)$/, async (ctx) => {
    const prodId = ctx.match[1];
    await ctx.reply(`🎉 Você escolheu finalizar a compra do produto ID ${prodId}! (Integre sua API de pagamento aqui)`);
    await ctx.answerCallbackQuery();
});

// Inicia o bot
console.log("🤖 Bot online e rodando...");
bot.start();


