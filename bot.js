const { Bot, InlineKeyboard } = require("grammy");
const http = require("http");
const https = require("https");

// Servidor para manter a Render online
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot Online!");
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Monitor rodando na porta ${PORT}`));

// Inicializa o bot
const bot = new Bot(process.env.TELEGRAM_TOKEN);

// Banco de dados em memória para salvar as compras de cada usuário
const comprasUsuarios = {};

function obterCompras(userId) {
    if (!comprasUsuarios[userId]) {
        comprasUsuarios[userId] = [];
    }
    return comprasUsuarios[userId];
}

// Vitrine de Produtos (Frases Pagas)
const produtos = [
    { 
        id: 1, 
        nome: "Frase Motivacional Premium 01", 
        preco: 5.00, 
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

bot.command("start", async (ctx) => {
    await ctx.reply("Olá! Seja bem-vindo ao bot de Frases Exclusivas. Escolha uma opção abaixo:", {
        reply_markup: menuPrincipal,
    });
});

// 📂 COMANDO: /bin (Mostra a demonstração do produto com opção de compra)
bot.command("bin", async (ctx) => {
    await exibirCarrosselBin(ctx, 0, false);
});

// Trata a paginação dos botões do comando /bin
bot.callbackQuery(/^bin_page_(\d+)$/, async (ctx) => {
    const pagina = parseInt(ctx.match[1]);
    await exibirCarrosselBin(ctx, pagina, true);
    await ctx.answerCallbackQuery();
});

// Função para renderizar o carrossel do /bin com botão de Comprar integrado
async function exibirCarrosselBin(ctx, index, editarMensagem) {
    const total = produtos.length;
    const produto = produtos[index];

    const textoBin = `📂 *Frases Disponíveis no /bin* (${index + 1}/${total})\n\n` +
                      `📦 *Nome:* ${produto.nome}\n` +
                      `💰 *Preço:* ${produto.precoTexto}\n\n` +
                      `📝 *Demonstração:* _${produto.demonstracao}_`;

    const teclado = new InlineKeyboard();

    // Botões de navegação Esquerda / Direita
    if (index > 0) {
        teclado.text("⬅️ Ant", `bin_page_${index - 1}`);
    }
    if (index < total - 1) {
        teclado.text("Próx ➡️", `bin_page_${index + 1}`);
    }

    // Adiciona o botão de Compra direto no /bin
    teclado.row().text(`💳 Comprar esta Frase`, `pagar_id_${produto.id}`);
    teclado.row().text("⬅️ Voltar ao Menu", "menu_principal");

    if (editarMensagem) {
        await ctx.editMessageText(textoBin, { parse_mode: "Markdown", reply_markup: teclado });
    } else {
        await ctx.reply(textoBin, { parse_mode: "Markdown", reply_markup: teclado });
    }
}

bot.callbackQuery("menu_principal", async (ctx) => {
    await ctx.editMessageText("Escolha uma opção no menu abaixo:", { reply_markup: menuPrincipal });
    await ctx.answerCallbackQuery();
});

bot.callbackQuery("menu_perfil", async (ctx) => {
    await exibirPerfilComCompras(ctx, 0);
    await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^perfil_page_(\d+)$/, async (ctx) => {
    const pagina = parseInt(ctx.match[1]);
    await exibirPerfilComCompras(ctx, pagina);
    await ctx.answerCallbackQuery();
});

async function exibirPerfilComCompras(ctx, index) {
    const userId = ctx.from.id;
    const listaDeCompras = obterCompras(userId);
    const totalCompras = listaDeCompras.length;

    let textoPerfil = `👤 *Seu Perfil de Usuário*\n` +
                      `🆔 *ID:* \`${userId}\`\n\n` +
                      `--- \n` +
                      `🛍️ *Suas Compras:* `;

    const teclado = new InlineKeyboard();

    if (totalCompras === 0) {
        textoPerfil += `_Você ainda não comprou nenhuma frase._`;
    } else {
        const item = listaDeCompras[index];
        textoPerfil += `(${index + 1}/${totalCompras})\n\n` +
                       `📦 *${item.nome}*\n` +
                       `🔓 *Conteúdo:* _${item.completo}_`;

        if (index > 0) teclado.text("⬅️ Ant", `perfil_page_${index - 1}`);
        if (index < totalCompras - 1) teclado.text("Próx ➡️", `perfil_page_${index + 1}`);
    }

    teclado.row().text("⬅️ Voltar ao Menu", "menu_principal");

    await ctx.editMessageText(textoPerfil, { parse_mode: "Markdown", reply_markup: teclado });
}

bot.callbackQuery("menu_comprar", async (ctx) => {
    await enviarCarrossel(ctx, 0);
    await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^comprar_page_(\d+)$/, async (ctx) => {
    const pagina = parseInt(ctx.match[1]);
    await enviarCarrossel(ctx, pagina);
    await ctx.answerCallbackQuery();
});

async function enviarCarrossel(ctx, index) {
    const produto = produtos[index];
    const total = produtos.length;

    const textoProduto = `📚 *Vitrine de Frases* (${index + 1}/${total})\n\n📦 *Nome:* ${produto.nome}\n💰 *Preço:* ${produto.precoTexto}\n\n📝 *Demonstração (Metade):*\n_${produto.demonstracao}_`;
    const teclado = new InlineKeyboard();

    if (index > 0) teclado.text("⬅️ Ant", `comprar_page_${index - 1}`);
    if (index < total - 1) teclado.text("Próx ➡️", `comprar_page_${index + 1}`);

    teclado.row().text(`💳 Comprar esta Frase`, `pagar_id_${produto.id}`);
    teclado.row().text("⬅️ Voltar ao Menu", "menu_principal");

    await ctx.editMessageText(textoProduto, { parse_mode: "Markdown", reply_markup: teclado });
}

function fazerRequisicao(url, options, bodyData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => resolve(JSON.parse(data)));
        });
        req.on("error", (err) => reject(err));
        if (bodyData) req.write(JSON.stringify(bodyData));
        req.end();
    });
}

bot.callbackQuery(/^pagar_id_(\d+)$/, async (ctx) => {
    const produtoId = parseInt(ctx.match[1]);
    const produto = produtos.find(p => p.id === produtoId);

    if (!produto) return ctx.reply("Produto não encontrado.");

    await ctx.editMessageText("⏳ Gerando seu código Pix copia e cola, aguarde um instante...");

    try {
        const url = "https://api.mercadopago.com/v1/payments";
        const options = {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MP_TOKEN}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": `${Date.now()}-${ctx.from.id}`
            }
        };
        const body = {
            transaction_amount: produto.preco,
            description: `Compra: ${produto.nome}`,
            payment_method_id: "pix",
            payer: { email: "comprador_telegram@email.com", first_name: ctx.from.first_name }
        };

        const data = await fazerRequisicao(url, options, body);
        const pixCopiaCola = data.point_of_interaction?.transaction_data?.qr_code;
        const paymentId = data.id;

        if (!pixCopiaCola) throw new Error("Erro Mercado Pago");

        await ctx.reply(`✅ *PIX Gerado!*\n\n💵 *Valor:* ${produto.precoTexto}\n\n👇 Copie o código Pix abaixo:`, { parse_mode: "Markdown" });
        await ctx.reply(`\`${pixCopiaCola}\``, { parse_mode: "Markdown" });
        await ctx.reply("🔄 Monitorando seu pagamento...");

        let tentativas = 0;
        const checarPagamento = setInterval(async () => {
            tentativas++;
            try {
                const statusData = await fazerRequisicao(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${process.env.MP_TOKEN}` }
                });

                if (statusData.status === "approved") {
                    clearInterval(checarPagamento);
                    
                    const comprasUser = obterCompras(ctx.from.id);
                    if (!comprasUser.some(c => c.id === produto.id)) {
                        comprasUser.push({ id: produto.id, nome: produto.nome, completo: produto.completo });
                    }

                    await ctx.reply(`🎉 *PAGAMENTO CONFIRMADO!*\n\n🔓 *${produto.completo}*`, { parse_mode: "Markdown" });
                }
            } catch (err) {
                console.log("Erro ao checar: ", err);
            }
            if (tentativas >= 60) clearInterval(checarPagamento);
        }, 10000);

    } catch (error) {
        console.error(error);
        await ctx.reply("❌ Erro ao processar o seu Pix.");
    }
});

bot.start();
console.log("🤖 Bot com Compra no /bin Ativo!");
