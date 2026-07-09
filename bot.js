const { Bot, InlineKeyboard } = require("grammy");

// Inicializa o bot com o token guardado na Render
const bot = new Bot(process.env.TELEGRAM_TOKEN);

// Banco de dados de conteúdos (Frases) com demonstração e texto completo
const produtos = [
    { 
        id: 1, 
        nome: "Frase Motivacional Premium 01", 
        preco: 5.00, // Número puro para a API calcular
        precoTexto: "R$ 5,00",
        demonstracao: "💥 'O sucesso não é o final, o fracasso não é fatal: o que importa é...'", 
        completo: "💥 'O sucesso não é o final, o fracasso não é fatal: o que importa é a coragem de continuar.' - Winston Churchill"
    },
    { 
        id: 2, 
        nome: "Frase de Sabedoria 02", 
        preco: 4.90,
        precoTexto: "R$ 4,90",
        demonstracao: "🌱 'A vida é igual a andar de bicicleta. Para manter o equilíbrio...'", 
        completo: "🌱 'A vida é igual a andar de bicicleta. Para manter o equilíbrio, você tem que se manter em movimento.' - Albert Einstein"
    }
];

// Menu Principal
const menuPrincipal = new InlineKeyboard()
    .text("🛒 Comprar Frases", "menu_comprar")
    .text("👤 Meu Perfil", "menu_perfil");

// Comando /start
bot.command("start", async (ctx) => {
    await ctx.reply("Olá! Seja bem-vindo ao bot de Frases Exclusivas. Escolha uma opção abaixo:", {
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
                        `✏️ *Nome:* ${nome}\n` +
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
    await enviarCarrossel(ctx, 0);
    await ctx.answerCallbackQuery();
});

// Trata a paginação dos produtos (Próximo e Anterior)
bot.callbackQuery(/^comprar_page_(\d+)$/, async (ctx) => {
    const pagina = parseInt(ctx.match[1]);
    await enviarCarrossel(ctx, pagina);
    await ctx.answerCallbackQuery();
});

// Função auxiliar para renderizar o carrossel de produtos com Spoilers
async function enviarCarrossel(ctx, index) {
    const produto = produtos[index];
    const total = produtos.length;

    const textoProduto = `📚 *Vitrine de Frases* (${index + 1}/${total})\n\n` +
                         `📦 *Nome:* ${produto.nome}\n` +
                         `💰 *Preço:* ${produto.precoTexto}\n\n` +
                         `📝 *Demonstração (Metade):*\n_${produto.demonstracao}_`;

    const teclado = new InlineKeyboard();

    // Botões de navegação
    if (index > 0) {
        teclado.text("⬅️ Ant", `comprar_page_${index - 1}`);
    }
    if (index < total - 1) {
        teclado.text("Próx ➡️", `comprar_page_${index + 1}`);
    }

    teclado.row().text(`💳 Comprar esta Frase`, `pagar_id_${produto.id}`);
    teclado.row().text("⬅️ Voltar ao Menu", "menu_principal");

    await ctx.editMessageText(textoProduto, {
        parse_mode: "Markdown",
        reply_markup: teclado,
    });
}

// Lógica de Geração do PIX Automático via Mercado Pago
bot.callbackQuery(/^pagar_id_(\d+)$/, async (ctx) => {
    const produtoId = parseInt(ctx.match[1]);
    const produto = produtos.find(p => p.id === produtoId);

    if (!produto) {
        await ctx.reply("Produto não encontrado.");
        return;
    }

    await ctx.editMessageText("⏳ Gerando seu código Pix copia e cola, aguarde um instante...");

    try {
        // Chamada direta para a API do Mercado Pago criando a ordem Pix
        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MP_TOKEN}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": `${Date.now()}-${ctx.from.id}` // Chave para evitar duplicados
            },
            body: JSON.stringify({
                transaction_amount: produto.preco,
                description: `Compra: ${produto.nome}`,
                payment_method_id: "pix",
                payer: {
                    email: "comprador_telegram@email.com", // E-mail genérico exigido pela API
                    first_name: ctx.from.first_name
                }
            })
        });

        const data = await response.json();

        // Extrai o Pix Copia e Cola retornado pelo Mercado Pago
        const pixCopiaCola = data.point_of_interaction?.transaction_data?.qr_code;
        const paymentId = data.id;

        if (!pixCopiaCola) {
            throw new Error("Não foi possível gerar os dados do PIX.");
        }

        // Envia as instruções e o código para o cliente copiar
        await ctx.reply(
            `✅ *PIX Gerado com Sucesso!*\n\n` +
            `💵 *Valor:* ${produto.precoTexto}\n\n` +
            `👇 Clique na mensagem abaixo para copiar o código Pix e pagar no seu banco:`,
            { parse_mode: "Markdown" }
        );

        // Mensagem isolada contendo apenas o código para facilitar o ato de copiar no celular
        await ctx.reply(`\`${pixCopiaCola}\``, { parse_mode: "Markdown" });
        
        await ctx.reply("🔄 Nosso sistema está monitorando o seu pagamento. Assim que concluir, o conteúdo completo aparecerá aqui automaticamente.");

        // Loop de checagem automática (Verifica a cada 10 segundos por até 10 minutos)
        let tentativas = 0;
        const maxTentativas = 60; 

        const checarPagamento = setInterval(async () => {
            tentativas++;
            try {
                const statusRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { "Authorization": `Bearer ${process.env.MP_TOKEN}` }
                });
                const statusData = await statusRes.json();

                // Se o status for aprovado, para o loop e entrega o conteúdo completo!
                if (statusData.status === "approved") {
                    clearInterval(checarPagamento);
                    await ctx.reply(
                        `🎉 *PAGAMENTO CONFIRMADO!* 🎉\n\n` +
                        `Muito obrigado pela sua compra. Aqui está o seu conteúdo completo:\n\n` +
                        `🔓 *${produto.completo}*`, 
                        { parse_mode: "Markdown" }
                    );
                }
            } catch (err) {
                console.log("Erro ao checar pagamento: ", err);
            }

            // Cancela se estourar o tempo limite de 10 minutos esperando o pagamento
            if (tentativas >= maxTentativas) {
                clearInterval(checarPagamento);
            }
        }, 10000);

    } catch (error) {
        console.error(error);
        await ctx.reply("❌ Ocorreu um erro ao processar o seu Pix com o Mercado Pago. Tente novamente mais tarde.");
    }
});

// Inicialização do Bot
bot.start();
console.log("🤖 Bot com Pix Automático Iniciado!");
