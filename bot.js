const { Bot, InlineKeyboard } = require("grammy");
const http = require("http");
const https = require("https");
const { createClient } = require("@supabase/supabase-js");

// Servidor para manter a Render online
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot Online!");
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Monitor rodando na porta ${PORT}`));

// Inicializa o bot
const bot = new Bot(process.env.TELEGRAM_TOKEN);

// 🔥 CONEXÃO COM O BANCO DE DADOS SUPABASE
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Funções para gerenciar o Saldo no Banco de Dados
async function obterSaldo(userId) {
    const idStr = String(userId);
    const { data, error } = await supabase.from("carteiras").select("saldo").eq("user_id", idStr).single();
    if (error || !data) {
        // Se o usuário não existir no banco, cria ele com saldo 0
        await supabase.from("carteiras").insert([{ user_id: idStr, saldo: 0.0 }]);
        return 0.0;
    }
    return parseFloat(data.saldo);
}

async function atualizarSaldo(userId, novoSaldo) {
    const idStr = String(userId);
    await supabase.from("carteiras").upsert({ user_id: idStr, saldo: novoSaldo });
}

async function obterCompras(userId) {
    const idStr = String(userId);
    const { data, error } = await supabase.from("historico_compras").select("*").eq("user_id", idStr).order("id", { ascending: true });
    if (error || !data) return [];
    return data;
}

async function salvarCompra(userId, produto) {
    const idStr = String(userId);
    await supabase.from("historico_compras").insert([{
        user_id: idStr,
        produto_id: produto.id,
        nome: produto.nome,
        completo: produto.completo
    }]);
}

// 👑 ID DO TELEGRAM DO ADMINISTRADOR:
const ADMIN_ID = "8827427559"; 

// 📦 VITRINE DE PRODUTOS (IDs corrigidos e strings ajustadas)
let produtos = [
    { 
        id: 1, 
        bin: "516292", 
        nome: "Cartão Nubank Platinum - Mastercard", 
        preco: 2.00, 
        precoTexto: "R$ 2,00",
        demonstracao: `✨Detalhes do cartão\n💳 cartão: 516292*********\n📆 Validade: 07/2033\n🔐 Cod: ***\n\n🏳️ Bandeira: mastercard\n💠 Nível: nubank platinum\n⚜️ Tipo: credit\n🏛 Banco: nu pagamentos sa\n🌍 Pais: brazil\n\n👤Nome: vanessa g almeida\n🪪 cpf: 25845634873`, 
        completo: `✨Detalhes do cartão (LIBERADO)\n💳 cartão: 516292000055267\n📆 Validade: 07/203\n🔐 cvv: 363\n\n🏳️ Bandeira: mastercard\n💠 Nível: nubank platinum\n⚜️ Tipo: credit\n🏛 Banco: nu pagamentos sa\n🌍 Pais: brazil\n\n👤Nome: vanessa g almeida\n🪪 cpf: 25845680873`
    }, { 
        id: 2, 
        bin: "516292", 
        nome: "Cartão Nubank Platinum - Mastercard", 
        preco: 2.00, 
        precoTexto: "R$ 2,00",
        demonstracao: `✨Detalhes do cartão\n💳 cartão: 516292*********\n📆 Validade: 07/2033\n🔐 Cod: ***\n\n🏳️ Bandeira: mastercard\n💠 Nível: nubank platinum\n⚜️ Tipo: credit\n🏛 Banco: nu pagamentos sa\n🌍 Pais: brazil\n\n👤Nome: marcos g almeida\n🪪 cpf: 25845634873`, 
        completo: `✨Detalhes do cartão (LIBERADO)\n💳 cartão: 516292000055267\n📆 Validade: 07/2043\n🔐 cvv: 500\n\n🏳️ Bandeira: mastercard\n💠 Nível: nubank platinum\n⚜️ Tipo: credit\n🏛 Banco: nu pagamentos sa\n🌍 Pais: brazil\n\n👤Nome: marcos g almeida\n🪪 cpf: 25845634873\n score : 300`
    }, {
        id: 3, 
        bin: "516292", 
        nome: "Cartão Nubank Platinum - Mastercard", 
        preco: 2.00, 
        precoTexto: "R$ 2,00",
        demonstracao: `✨Detalhes do cartão\n💳 cartão: 516292*********\n📆 Validade: 07/2033\n🔐 Cod: ***\n\n🏳️ Bandeira: mastercard\n💠 Nível: nubank platinum\n⚜️ Tipo: credit\n🏛 Banco: nu pagamentos sa\n🌍 Pais: brazil\n\n👤Nome: vanessa g almeida\n🪪 cpf: 25845634873`, 
        completo: `✨Detalhes do cartão (LIBERADO)\n💳 cartão: 516292000055267\n📆 Validade: 07/203\n🔐 cvv: 363\n\n🏳️ Bandeira: mastercard\n💠 Nível: nubank platinum\n⚜️ Tipo: credit\n🏛 Banco: nu pagamentos sa\n🌍 Pais: brazil\n\n👤Nome: vanessa g almeida\n🪪 cpf: 25845680873`
    }, { 
        id: 4, 
        bin: "516292", 
        nome: "Cartão Nubank Platinum - Mastercard", 
        preco: 2.00, 
        precoTexto: "R$ 2,00",
        demonstracao: `✨Detalhes do cartão\n💳 cartão: 516292*********\n📆 Validade: 07/2033\n🔐 Cod: ***\n\n🏳️ Bandeira: mastercard\n💠 Nível: nubank platinum\n⚜️ Tipo: credit\n🏛 Banco: nu pagamentos sa\n🌍 Pais: brazil\n\n👤Nome: marcos g almeida\n🪪 cpf: 25845634873`, 
        completo: `✨Detalhes do cartão (LIBERADO)\n💳 cartão: 516292000055267\n📆 Validade: 07/2043\n🔐 cvv: 500\n\n🏳️ Bandeira: mastercard\n💠 Nível: nubank platinum\n⚜️ Tipo: credit\n🏛 Banco: nu pagamentos sa\n🌍 Pais: brazil\n\n👤Nome: marcos g almeida\n🪪 cpf: 25845634873\n score : 300`
    }
];

const menuPrincipal = new InlineKeyboard()
    .text("🛒 Comprar ", "menu_comprar")
    .text("👤 Perfil / Carteira", "menu_perfil")
    .row() 
    .text("💰 Adicionar Saldo", "menu_saldo") 
    .url("🆘 Suporte (WhatsApp)", "https://wa.me/5500999999999");

bot.command("start", async (ctx) => {
    await ctx.reply(`👋 Bem-vindo a Riley Store!\n\nEscolha uma opção no menu abaixo e boas compras! 🚀`, {
        reply_markup: menuPrincipal,
    });
});

bot.command("bin", async (ctx) => {
    const binDigitada = ctx.match ? ctx.match.trim() : "";
    if (!binDigitada) return ctx.reply("❌ Por favor, informe a BIN. Exemplo: `/bin 516292`", { parse_mode: "Markdown" });
    const produtosFiltrados = produtos.filter(p => p.bin === binDigitada);
    if (produtosFiltrados.length === 0) return ctx.reply(`📭 Nenhuma frase encontrada vinculada à BIN *${binDigitada}*.`, { parse_mode: "Markdown" });
    await exibirCarrosselBinFiltrado(ctx, binDigitada, 0, false);
});

// 👑 COMANDO EXCLUSIVO DO ADMIN: /addsaldo <id> <valor>
bot.command("addsaldo", async (ctx) => {
    const userId = String(ctx.from.id);
    if (userId !== ADMIN_ID) return ctx.reply("❌ Você não tem permissão para usar este comando.");

    const argumentos = ctx.match ? ctx.match.trim().split(" ") : [];
    if (argumentos.length < 2) return ctx.reply("❌ *Formato inválido!*\n\nUse assim: `/addsaldo <ID_DO_CLIENTE> <VALOR>`", { parse_mode: "Markdown" });

    const idCliente = argumentos[0].trim();
    const valorAdicionar = parseFloat(argumentos[1].replace(",", "."));
    if (isNaN(valorAdicionar) || valorAdicionar <= 0) return ctx.reply("❌ *Valor inválido!* Digite um número maior que zero.");

    const saldoAtual = await obterSaldo(idCliente);
    const novoSaldo = saldoAtual + valorAdicionar;
    await atualizarSaldo(idCliente, novoSaldo); 

    await ctx.reply(`✅ *Saldo adicionado com sucesso!*\n\n👤 *ID do Cliente:* \`${idCliente}\`\n💰 *Valor inserido:* R$ ${valorAdicionar.toFixed(2)}\n💳 *Saldo total atual:* R$ ${novoSaldo.toFixed(2)}`, { parse_mode: "Markdown" });

    try {
        await ctx.api.sendMessage(idCliente, `🎉 *Notificação de Depósito!*\n\nO administrador adicionou *R$ ${valorAdicionar.toFixed(2)}* à sua carteira.`, { parse_mode: "Markdown" });
    } catch (e){}
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
    let textoBin = `🔎 *Mostrando ${index + 1} de ${total}*\n\n`;

    if (userId === ADMIN_ID) {
        textoBin += `👑 *MODO ADMINISTRADOR*\n\n${produto.completo}`;
    } else {
        textoBin += `${produto.demonstracao}\n\n💸 *Valor:* ${produto.precoTexto}`;
    }

    const teclado = new InlineKeyboard();
    if (index > 0) teclado.text("⬅️ Ant", `bin_filtro_${binTarget}_${index - 1}`);
    if (index < total - 1) teclado.text("Próx ➡️", `bin_filtro_${binTarget}_${index + 1}`);
    if (userId !== ADMIN_ID) teclado.row().text(`💳 Comprar esta Frase`, `pagar_id_${produto.id}`);
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
    const listaDeCompras = await obterCompras(userId); 
    const totalCompras = listaDeCompras.length;
    const saldoAtual = await obterSaldo(userId); 
    
    let textoPerfil = `👤 *Seu Perfil de Usuário*\n🆔 *ID:* \`${userId}\`\n💰 *Saldo em Conta:* R$ ${saldoAtual.toFixed(2)}\n\n--- \n🛍️ *Suas Compras:* `;
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
        return ctx.editMessageText("📭 A vitrine está vazia no momento!", {
            reply_markup: new InlineKeyboard().text("⬅️ Voltar ao Menu", "menu_principal")
        });
    }

    const indexAtual = index >= total ? total - 1 : index;
    const produto = produtos[indexAtual];

    let textoProduto = `📚 *Vitrine de Frases* (${indexAtual + 1}/${total})\n\n`;
    if (userId === ADMIN_ID) {
        textoProduto += `👑 *MODO ADMINISTRADOR*\n\n${produto.completo}`;
    } else {
        textoProduto += `${produto.demonstracao}\n\n💰 *Preço:* ${produto.precoTexto}`;
    }
    
    const teclado = new InlineKeyboard();
    if (indexAtual > 0) teclado.text("⬅️ Ant", `comprar_page_${indexAtual - 1}`);
    if (indexAtual < total - 1) teclado.text("Próx ➡️", `comprar_page_${indexAtual + 1}`);
    if (userId !== ADMIN_ID) teclado.row().text(`💳 Comprar esta Frase`, `pagar_id_${produto.id}`);
    teclado.row().text("⬅️ Voltar ao Menu", "menu_principal");

    await ctx.editMessageText(textoProduto, { parse_mode: "Markdown", reply_markup: teclado });
}

function fazerRequisicao(url, options, bodyData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => {
                try { resolve(JSON.parse(data)); } catch(e) { resolve({}); }
            });
        });
        req.on("error", (err) => reject(err));
        if (bodyData) req.write(JSON.stringify(bodyData));
        req.end();
    });
}

// 🛒 LOGICA DE PAGAMENTO COMPLETA (SALDO OU PIX)
bot.callbackQuery(/^pagar_id_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    const produtoId = parseInt(ctx.match[1]);
    const produtoIndex = produtos.findIndex(p => p.id === produtoId);

    if (produtoIndex === -1) {
        await ctx.answerCallbackQuery({ text: "❌ Desculpe, este produto acabou de ser vendido!", show_alert: true });
        return;
    }

    const produto = produtos[produtoIndex];
    const saldoAtual = await obterSaldo(userId);

    // 🔥 COMPRA DIRETA COM SALDO DA CARTEIRA
    if (saldoAtual >= produto.preco) {
        const novoSaldo = saldoAtual - produto.preco;
        await atualizarSaldo(userId, novoSaldo); // Atualiza no banco Supabase
        await salvarCompra(userId, produto); // Grava histórico permanente no Supabase

        // Remove o produto comprado do array em memória para ninguém mais comprar
        produtos.splice(produtoIndex, 1);

        await ctx.editMessageText(`🎉 *COMPRA APROVADA VIA CARTEIRA!*\n\n${produto.completo}\n\n📉 *Saldo restante:* R$ ${novoSaldo.toFixed(2)}`, { parse_mode: "Markdown" });
        await ctx.answerCallbackQuery({ text: "Compra realizada com saldo!" });
        return;
    }

    // 💸 SE NÃO TIVER SALDO, GERA O PIX DO MERCADO PAGO
    await ctx.editMessageText("⏳ Gerando seu código Pix copia e cola, aguarde um instante...");
    await ctx.answerCallbackQuery();

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
                    
                    const indexFinal = produtos.findIndex(p => p.id === produto.id);
                    if (indexFinal !== -1) produtos.splice(indexFinal, 1);

                    await salvarCompra(userId, produto); 

                    await ctx.reply(`🎉 *PAGAMENTO CONFIRMADO!*\n\n${produto.completo}`, { parse_mode: "Markdown" });
                }
            } catch (err) {}
            if (tentativas >= 60) clearInterval(checarPagamento);
        }, 10000);

    } catch (error) {
        await ctx.reply("❌ Erro ao processar o seu Pix.");
    }
});

bot.callbackQuery("menu_saldo", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("💵 *Digite o valor que deseja adicionar em saldo:*\n\n_(Valor mínimo: R$ 5,00)_", {
        reply_markup: { force_reply: true }
    });
});

bot.on("message", async (ctx) => {
    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.text) return; 

    if (reply.text.includes("Digite o valor que deseja adicionar")) {
        const valorDigitado = parseFloat(ctx.message.text.replace(",", "."));
        if (isNaN(valorDigitado) || valorDigitado < 5) return ctx.reply("❌ *Valor inválido!*");

        const msgAviso = await ctx.reply("⏳ _Gerando seu Pix de Saldo..._");

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

            await ctx.reply(`✅ *PIX de Saldo Gerado!* Valor: R$ ${valorDigitado.toFixed(2)}`);
            await ctx.reply(`\`${pixCopiaCola}\``, { parse_mode: "Markdown" });

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
                        const saldoAtual = await obterSaldo(ctx.from.id);
                        await atualizarSaldo(ctx.from.id, saldoAtual + valorDigitado); 

                        await ctx.reply(`🎉 *PAGAMENTO CONFIRMADO!* R$ ${valorDigitado.toFixed(2)} adicionados.`);
                    }
                } catch (err) {}
                if (tentativesSaldo >= 60) clearInterval(checarSaldo);
            }, 10000);

        } catch (error) {
            await ctx.reply("❌ Erro ao gerar o Pix.");
        }
    }
});

bot.start();
