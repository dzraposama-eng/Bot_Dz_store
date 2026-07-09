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

// 👑 ID DO TELEGRAM DO ADMINISTRADOR:
const ADMIN_ID = "8827427559"; 

// 📦 VITRINE DE PRODUTOS (FRASES ÚNICAS - ELAS SOMEM AO SEREM COMPRADAS)
let produtos = [
    { 
        id: 1, 
        bin: "516292", 
        nome: "Cartão Nubank Platinum - Mastercard", 
        preco: 28.00, 
        precoTexto: "R$ 28,00",
        demonstracao: `✨Detalhes do cartão
💳 cartão: 516292*********
📆 Validade: 07/2033
🔐 CVV: ***

🏳️ Bandeira: mastercard
💠 Nível: nubank platinum
⚜️ Tipo: credit
🏛 Banco: nu pagamentos sa
🌍 Pais: brazil

👤Nome: vanessa g almeida
🪪 cpf: 25845634873`, 
        completo: `✨Detalhes do cartão (LIBERADO)
💳 cartão: 516292000055267
📆 Validade: 07/2033
🔐 cvv: 363

🏳️ Bandeira: mastercard
💠 Nível: nubank platinum
⚜️ Tipo: credit
🏛 Banco: nu pagamentos sa
🌍 Pais: brazil

👤Nome: vanessa g almeida
🪪 cpf: 25845680873`
    } , { 
        id: 2, 
        bin: "516292", 
        nome: "Cartão Nubank Platinum - Mastercard", 
        preco: 2.00, 
        precoTexto: "R$ 2,00",
        demonstracao: `✨Detalhes do cartão
💳 cartão: 516292*********
📆 Validade: 07/2033
✅️   CVV: ***

🏳️ Bandeira: mastercard
💠 Nível: nubank platinum
⚜️ Tipo: credit
🏛 Banco: nu pagamentos sa
🌍 Pais: brazil

👤Nome: marcos g almeida
🪪 cpf: 25845634873`, 
        completo: `✨Detalhes do cartão (LIBERADO)
💳 cartão: 516292000055267
📆 Validade: 07/2033
🔐 cvv: 500

🏳️ Bandeira: mastercard
💠 Nível: nubank platinum
⚜️ Tipo: credit
🏛 Banco: nu pagamentos sa
🌍 Pais: brazil

👤Nome: marcos g almeida
🪪 cpf: 25845634873`
    }
];

// Menu Principal
const menuPrincipal = new InlineKeyboard()
    .text("🛒 Comprar ", "menu_comprar")
    .text("👤 Perfil ", "menu_perfil")
    .row() 
    .text("💰 Adicionar Saldo", "menu_saldo") 
    .url("🆘 Suporte (WhatsApp)", "https://wa.me/5500999999999");

// 🏠 COMANDO /START
bot.command("start", async (ctx) => {
    await ctx.reply(`👋 Bem-vindo a Riley Store!

Aqui você encontra as melhores CCs do mercado, com qualidade, segurança e atendimento dedicado.
🛡️ Trabalhamos com um sistema rigoroso de verificação para garantir mais segurança nas transações e proteger nossa plataforma.

⚡ Produtos selecionados.
📦 Entrega rápida.
🤝 Suporte sempre que precisar.

Escolha uma opção no menu abaixo e boas compras! 🚀`, {
        reply_markup: menuPrincipal,
    });
});

// 📂 COMANDO: /bin <numero_da_bin>
bot.command("bin", async (ctx) => {
    const binDigitada = ctx.match ? ctx.match.trim() : "";

    if (!binDigitada) {
        return ctx.reply("❌ Por favor, informe a BIN. Exemplo: `/bin 516292`", { parse_mode: "Markdown" });
    }

    const produtosFiltrados = produtos.filter(p => p.bin === binDigitada);

    if (produtosFiltrados.length === 0) {
        return ctx.reply(`📭 Nenhuma frase encontrada vinculada à BIN *${binDigitada}*.`, { parse_mode: "Markdown" });
    }

    await exibirCarrosselBinFiltrado(ctx, binDigitada, 0, false);
});

bot.callbackQuery(/^bin_filtro_([^_]+)_(\d+)$/, async (ctx) => {
    const binDigitada = ctx.match[1];
    const pagina = parseInt(ctx.match[2]);
    await exibirCarrosselBinFiltrado(ctx, binDigitada, pagina, true);
    await ctx.answerCallbackQuery();
});

async function exibirCarrosselBinFiltrado(ctx, binTarget, index, editarMensagem) {
    const userId = String(ctx.from.id);
    const listaFiltrada = produtos.filter(p => p.bin === binTarget);
    const total = listaFiltrada.length;

    if (total === 0 || !listaFiltrada[index]) {
        const msgVazio = "📭 Esta BIN não possui mais frases disponíveis no momento.";
        const tecladoVazio = new InlineKeyboard().text("⬅️ Voltar ao Menu", "menu_principal");
        if (editarMensagem) return ctx.editMessageText(msgVazio, { reply_markup: tecladoVazio });
        return ctx.reply(msgVazio, { reply_markup: tecladoVazio });
    }

    const produto = listaFiltrada[index];
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString("pt-BR") + " às " + dataAtual.toLocaleTimeString("pt-BR");
    
    let textoBin = `🔎 *Mostrando ${index + 1} de ${total}*\n\n`;

    if (userId === ADMIN_ID) {
        textoBin += `👑 *MODO ADMINISTRADOR (ACESSO LIBERADO)*\n\n${produto.completo}\n\n📆 *Consultado em:* ${dataFormatada}`;
    } else {
        textoBin += `${produto.demonstracao}\n\n💸 *Valor:* ${produto.precoTexto}\n` +
                    `📆 *Consultado em:* ${dataFormatada}`;
    }

    const teclado = new InlineKeyboard();

    if (index > 0) {
        teclado.text("⬅️ Ant", `bin_filtro_${binTarget}_${index - 1}`);
    }
    if (index < total - 1) {
        teclado.text("Próx ➡️", `bin_filtro_${binTarget}_${index + 1}`);
    }

    if (userId !== ADMIN_ID) {
        teclado.row().text(`💳 Comprar esta Frase`, `pagar_id_${produto.id}`);
    }
    
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
    let textoPerfil = `👤 *Seu Perfil de Usuário*\n🆔 *ID:* \`${userId}\`\n\n--- \n🛍️ *Suas Compras:* `;
    const teclado = new InlineKeyboard();

    if (totalCompras === 0) {
        textoPerfil += `_Você ainda não comprou nenhuma frase._`;
    } else {
        const item = listaDeCompras[index];
        textoPerfil += `(${index + 1}/${totalCompras})\n\n📦 *${item.nome}*\n\n${item.completo}`;
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
    const userId = String(ctx.from.id);
    const total = produtos.length;

    if (total === 0) {
        return ctx.editMessageText("📭 A vitrine está vazia no momento! Volte mais tarde.", {
            reply_markup: new InlineKeyboard().text("⬅️ Voltar ao Menu", "menu_principal")
        });
    }

    // Se o index estourar porque um produto sumiu, joga para o último disponível
    const indexAtual = index >= total ? total - 1 : index;
    const produto = produtos[indexAtual];

    let textoProduto = `📚 *Vitrine de Frases* (${indexAtual + 1}/${total})\n\n`;
    if (userId === ADMIN_ID) {
        textoProduto += `👑 *MODO ADMINISTRADOR (ACESSO LIBERADO)*\n\n${produto.completo}`;
    } else {
        textoProduto += `${produto.demonstracao}\n\n💰 *Preço:* ${produto.precoTexto}`;
    }
    
    const teclado = new InlineKeyboard();
    if (indexAtual > 0) teclado.text("⬅️ Ant", `comprar_page_${indexAtual - 1}`);
    if (indexAtual < total - 1) teclado.text("Próx ➡️", `comprar_page_${indexAtual + 1}`);
    if (userId !== ADMIN_ID) {
        teclado.row().text(`💳 Comprar esta Frase`, `pagar_id_${produto.id}`);
    }
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
    const produtoIndex = produtos.findIndex(p => p.id === produtoId);

    if (produtoIndex === -1) {
        return ctx.reply("❌ Desculpe, este produto acabou de ser vendido para outro usuário!");
    }

    const produto = produtos[produtoIndex];

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
                    
                    // Verifica novamente se o produto ainda está na lista para evitar duplicidade externa
                    const indexFinal = produtos.findIndex(p => p.id === produto.id);
                    if (indexFinal !== -1) {
                        // REMOVE A FRASE DO ESTOQUE DO BOT DEFINITIVAMENTE:
                        produtos.splice(indexFinal, 1);
                    }

                    const comprasUser = obterCompras(ctx.from.id);
                    comprasUser.push({ id: produto.id, nome: produto.nome, completo: produto.completo });

                    await ctx.reply(`🎉 *PAGAMENTO CONFIRMADO!*\n\n${produto.completo}`, { parse_mode: "Markdown" });
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

// =================================================================
// 💰 SISTEMA DE ADICIONAR SALDO
// =================================================================

bot.callbackQuery("menu_saldo", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("💵 *Digite o valor que deseja adicionar em saldo:*\n\nExemplo: `10` ou `25.50` \n_(Valor mínimo: R$ 5,00)_", {
        reply_markup: { force_reply: true }
    });
});

bot.on("message", async (ctx) => {
    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.text) return; 

    if (reply.text.includes("Digite o valor que deseja adicionar")) {
        const valorDigitado = parseFloat(ctx.message.text.replace(",", "."));

        if (isNaN(valorDigitado) || valorDigitado < 5) {
            return ctx.reply("❌ *Valor inválido!* O valor mínimo é de R$ 5,00.");
        }

        const msgAviso = await ctx.reply("⏳ _Gerando seu Pix de Saldo... Aguarde._");

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
                transaction_amount: valorDigitado,
                description: `Adicionar Saldo - User: ${ctx.from.id}`,
                payment_method_id: "pix",
                payer: { email: "comprador_telegram@email.com" }
            };

            const data = await fazerRequisicao(url, options, body);
            const pixCopiaCola = data.point_of_interaction?.transaction_data?.qr_code;

            if (!pixCopiaCola) throw new Error("Erro Mercado Pago");

            try { await ctx.api.deleteMessage(ctx.chat.id, msgAviso.message_id); } catch(e){}

            await ctx.reply(`✅ *PIX de Saldo Gerado!*\n\n💵 *Valor:* R$ ${valorDigitado.toFixed(2)}\n\n👇 Copie o código abaixo:`);
            await ctx.reply(`\`${pixCopiaCola}\``, { parse_mode: "Markdown" });
            await ctx.reply("🔄 Monitorando seu pagamento... Seu saldo subirá assim que pagar.");

            let tentativesSaldo = 0;
            const checarSaldo = setInterval(async () => {
                tentativesSaldo++;
                try {
                    const statusData = await fazerRequisicao(`https://api.mercadopago.com/v1/payments/${data.id}`, {
                        method: "GET",
                        headers: { "Authorization": `Bearer ${process.env.MP_TOKEN}` }
                    });

                    if (statusData.status === "approved") {
                        clearInterval(checarSaldo);
                        await ctx.reply(`🎉 *PAGAMENTO CONFIRMADO!*\n\n💰 R$ ${valorDigitado.toFixed(2)} foram adicionados ao seu saldo com sucesso!`);
                    }
                } catch (err) {
                    console.log("Erro ao checar saldo: ", err);
                }

                if (tentativesSaldo >= 60) clearInterval(checarSaldo);
            }, 10000);

        } catch (error) {
            console.error(error);
            try { await ctx.api.deleteMessage(ctx.chat.id, msgAviso.message_id); } catch(e){}
            await ctx.reply("❌ Erro ao gerar o Pix. Tente novamente.");
        }
    }
});

// =================================================================
// 🚀 INICIALIZAÇÃO FINAL DO BOT
// =================================================================
bot.start();
console.log("🤖 Bot Atualizado com Painel Admin Liberado!");

