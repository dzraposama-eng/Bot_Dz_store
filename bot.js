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
// CONFIGURAÇÃO DO GRUPO OBRIGATÓRIO
// Dica: Substitua pelo ID numérico do grupo (ex: -100xxxxxxxxxx) ou pelo @username dele
const GRUPO_ID = "@RileyStore"; 
const GRUPO_LINK = "https://t.me/RileyStore"; // Substitua pelo link real do seu grupo

// 🔥 CONEXÃO COM O BANCO DE DADOS SUPABASE
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ==========================================
// FUNÇÕES DO BANCO DE DADOS (SUPABASE)
// ==========================================

async function obterSaldo(userId) {
    const idStr = String(userId);
    
    const { data, error } = await supabase
        .from("carteiras")
        .select("saldo")
        .eq("user_id", idStr)
        .maybeSingle();

    if (error) {
        console.error("Erro ao buscar saldo:", error);
        return 0.0;
    }

    if (!data) {
        await supabase
            .from("carteiras")
            .insert([{ user_id: idStr, saldo: 0.0 }])
            .select()
            .maybeSingle();
        return 0.0;
    }

    return parseFloat(data.saldo);
}

async function atualizarSaldo(userId, novoSaldo) {
    const idStr = String(userId);
    await supabase
        .from("carteiras")
        .upsert({ user_id: idStr, saldo: parseFloat(novoSaldo) }, { onConflict: "user_id" });
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

async function obterProdutosDoBanco(binFiltro = null) {
    let query = supabase.from("produtos").select("*").order("id", { ascending: true });
    if (binFiltro) query = query.eq("bin", binFiltro);
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
}

async function removerProdutoDoBanco(produtoId) {
    await supabase.from("produtos").delete().eq("id", produtoId);
}

// 👑 ID DO TELEGRAM DO ADMINISTRADOR:
const ADMIN_ID = "882742759"; 

// ==========================================
// COMANDOS & MENUS
// ==========================================

const menuPrincipal = new InlineKeyboard()
    .text("💳 Comprar ", "menu_comprar")
    .text("👤 Perfil ", "menu_perfil")
    .row() 
    .text("💰 Saldo", "menu_saldo") 
    .row() // Cria uma nova linha para os suportes
    .url("🆘Telegram", "https://t.me/Dzstore71") // Substitua pelo seu @username (sem o @)
    .url("🆘️WhatsApp", "https://wa.me/212663116806");


bot.command("start", async (ctx) => {
    const userId = ctx.from.id;

    try {
        // Verifica o status do usuário no grupo
        const membro = await ctx.api.getChatMember(GRUPO_ID, userId);
        const statusPermitidos = ["creator", "administrator", "member"];

        if (!statusPermitidos.includes(membro.status)) {
            // Se não estiver no grupo, envia o botão para entrar
            const tecladoInscrição = new InlineKeyboard()
                .url("📢 Entrar no Grupo Riley Store", GRUPO_LINK)
                .row()
                .text("🔄 Já entrei! Liberar Acesso", "verificar_membro");

            return await ctx.reply(
                "⚠️ *ACESSO RESTRITO!*\n\nPara utilizar este bot e acessar o nosso catálogo, você precisa fazer parte do grupo oficial da **Riley Store**.",
                { parse_mode: "Markdown", reply_markup: tecladoInscrição }
            );
        }
    } catch (error) {
        console.error("Erro ao verificar membro:", error);
        // Se der erro (ex: bot não é admin do grupo), avisa no console mas você pode decidir se deixa passar ou bloqueia
    }

    // Se passou na verificação, envia a mensagem de boas-vindas original
    await ctx.reply(`👋 Bem-vindo à Riley Store!\n\n           ATENÇÃO \n\n🤖 BOT ANTIFRAUDE ATIVO\n⚠️ VIOLAÇÃO DE REGRAS É BAN\n💎 MATERIAL 100% VIRGEM \n\n O QUE VOCÊ PRECISA SABER \n⏱️ REGRA DOS 5 MINUTOS \nSE O CARTÃO NÃO FOR TROCADO \nEM 5 MINUTOS VOCÊ PERDEU O \nSEU DIREITO DE TROCA \n\n⚙️ O BOT TEM FUNÇÃO CHK \nPARA TESTAR O CARTÃO \nSABER SE ESTÁ DIE OU LIVE \nSE ESTIVER DIE O SEU DINHEIRO \nSERÁ REEMBOLSADO`, {
        reply_markup: menuPrincipal,
    });
});

bot.callbackQuery("verificar_membro", async (ctx) => {
    const userId = ctx.from.id;

    try {
        const membro = await ctx.api.getChatMember(GRUPO_ID, userId);
        const statusPermitidos = ["creator", "administrator", "member"];

        if (statusPermitidos.includes(membro.status)) {
            await ctx.answerCallbackQuery({ text: "✅ Acesso liberado com sucesso!" });
            
            // Edita a mensagem atual e libera o menu do bot
            await ctx.editMessageText(`👋 Bem-vindo à Riley Store!\n\n              ATENÇÃO \n\n🤖 BOT ANTIFRAUDE ATIVO\n⚠️ VIOLAÇÃO DE REGRAS É BAN\n💎 MATERIAL 100% VIRGEM \n\n O QUE VOCÊ PRECISA SABER \n⏱️ REGRA DOS 5 MINUTOS \nSE O CARTÃO NÃO FOR TROCADO \nEM 5 MINUTOS VOCÊ PERDEU O \nSEU DIREITO DE TROCA \n\n⚙️ O BOT TEM FUNÇÃO CHK \nPARA TESTAR O CARTÃO \nSABER SE ESTÁ DIE OU LIVE \nSE ESTIVER DIE O SEU DINHEIRO \nSERÁ REEMBOLSADO`, {
                reply_markup: menuPrincipal,
            });
        } else {
            await ctx.answerCallbackQuery({ 
                text: "❌ Você ainda não entrou no grupo! Entre antes de tentar novamente.", 
                show_alert: true 
            });
        }
    } catch (error) {
        console.error("Erro na verificação do botão:", error);
        await ctx.answerCallbackQuery({ 
            text: "❌ Erro ao verificar. O bot foi adicionado como ADM no grupo?", 
            show_alert: true 
        });
    }
});


bot.command("bin", async (ctx) => {
    const binDigitada = ctx.match ? ctx.match.trim() : "";
    if (!binDigitada) return ctx.reply("❌ Por favor, informe a BIN. Exemplo: `/bin 516292`", { parse_mode: "Markdown" });
    
    const produtosFiltrados = await obterProdutosDoBanco(binDigitada);
    if (produtosFiltrados.length === 0) return ctx.reply(`📭 Nenhuma frase encontrada vinculada à BIN *${binDigitada}*.`, { parse_mode: "Markdown" });
    await exibirCarrosselBinFiltrado(ctx, binDigitada, 0, false);
});

async function exibirCarrosselBinFiltrado(ctx, binTarget, index, editarMensagem) {
    const userId = String(ctx.from.id);
    const listaFiltrada = await obterProdutosDoBanco(binTarget);
    const total = listaFiltrada.length;

    if (total === 0 || !listaFiltrada[index]) {
        const msgVazio = "📭 Esta BIN não possui mais frases disponíveis no momento.";
        const tecladoVazio = new InlineKeyboard().text("⬅️ Voltar ao Menu", "menu_principal");
        if (editarMensagem) return ctx.editMessageText(msgVazio, { reply_markup: tecladoVazio });
        return ctx.reply(msgVazio, { reply_markup: tecladoVazio });
    }

    const produto = listaFiltrada[index];
    let textoBin = `🔎 *Mostrando ${index + 1} de ${total}*\n\n`;

    const infoDemonstracao = produto.demonstracao || produto.nome || "Produto sem descrição";
    const precoMostrar = produto.preco_texto || `R$ ${parseFloat(produto.preco).toFixed(2)}`;

    if (userId === ADMIN_ID) {
        textoBin += `👑 *MODO ADMINISTRADOR*\n\n${produto.completo || infoDemonstracao}`;
    } else {
        textoBin += `${infoDemonstracao}\n\n💸 *Valor:* ${precoMostrar}`;
    }

    const teclado = new InlineKeyboard();
    if (index > 0) teclado.text("⬅️ Ant", `bin_filtro_${binTarget}_${index - 1}`);
    if (index < total - 1) teclado.text("Próx ➡️", `bin_filtro_${binTarget}_${index + 1}`);
    if (userId !== ADMIN_ID) teclado.row().text(`💳 Comprar CC`, `pagar_id_${produto.id}`);
    teclado.row().text("⬅️ Voltar ao Menu", "menu_principal");

    try {
        if (editarMensagem) {
            await ctx.editMessageText(textoBin, { parse_mode: "Markdown", reply_markup: teclado });
        } else {
            await ctx.reply(textoBin, { parse_mode: "Markdown", reply_markup: teclado });
        }
    } catch (e) {
        if (editarMensagem) {
            await ctx.editMessageText(textoBin, { reply_markup: teclado });
        } else {
            await ctx.reply(textoBin, { reply_markup: teclado });
        }
    }
}

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

bot.command("addproduto", async (ctx) => {
    // 1. Controle de acesso (Dono do Bot)
    const userId = String(ctx.from.id);
    if (userId !== ADMIN_ID) return ctx.reply("❌ Você não tem permissão para usar este comando.");

    // 2. Separação dos dados pela barra |
    const texto = ctx.match ? ctx.match.trim() : "";
    const partes = texto.split("|");

    if (partes.length < 11) {
        return ctx.reply("❌ *Formato inválido!*\n\nUse exatamente assim em uma única linha:\n`/addproduto Preço | NúmeroCC | MesAno | CVV | Bandeira | Nível | Tipo | Banco | País | NomeCliente | CPF`", { parse_mode: "Markdown" });
    }

    const preco = parseFloat(partes[0].trim().replace(",", "."));
    const cc = partes[1].trim();
    const mesAno = partes[2].trim();
    const cvv = partes[3].trim();
    const bandeira = partes[4].trim();
    const nivel = partes[5].trim();
    const tipo = partes[6].trim();
    const banco = partes[7].trim();
    const pais = partes[8].trim();
    const nomeCliente = partes[9].trim();
    const cpf = partes[10].trim();

    if (isNaN(preco)) return ctx.reply("❌ Preço inválido.");

    // Pega a BIN (6 primeiros números)
    const bin = cc.substring(0, 6);

    // 3. 🕵️‍♂️ MÁSCARA AUTOMÁTICA (Idêntica ao layout da imagem)
    const ccMascarada = `${bin}***********`;
    const cpfMascarado = `******${cpf.slice(-3)}`; // Mostra apenas o final ex: ******430
    
    // Deixa o nome exatamente como no print (s*e*e*e*l*n*c*s*l*a)
    const nomeMascarado = nomeCliente.replace(/\s+/g, "").split("").map((letra, i) => {
        return i % 2 === 0 ? letra.toLowerCase() : "*";
    }).join("");

    // 4. DESIGN DA VITRINE (Igualzinho ao seu print da Magic Store)
    // Nota: O preço e o saldo do usuário devem ser injetados dinamicamente no seu comando de exibição (/bin), 
    // mas o texto base estruturado com os emojis corretos fica salvo assim:
    const demonstracao = `✨ Detalhes do cartão\n` +
                         `💳 cartão: ${ccMascarada}\n` +
                         `📅 mes / ano: ${mesAno}\n` +
                         `🔐 cvv: ***\n\n` +
                         `🏳️ bandeira: ${bandeira}\n` +
                         `💠 nível: ${nivel}\n` +
                         `⚜️ tipo: ${tipo}\n` +
                         `🏛️ banco: ${banco}\n` +
                         `🌍 pais: ${pais}\n\n` +
                         `👤 Nome:\n` +
                         `${nomeMascarado}\n` +
                         `🪪 cpf:\n` +
                         `${cpfMascarado}\n\n` +
                         `💵 Preço: {preco_dinamico} ( saldo )\n` +
                         `💰 Seu saldo: {saldo_dinamico}\n` +
                         `✅ INFORMAÇÕES VIRGENS DIRETO DO ADMIN (SNIFFER)`;

    // 5. TEXTO COMPLETO (O que abre após a compra)
    const completo = `✨ Detalhes do cartão\n` +
                     `💳 cartão: ${cc}\n` +
                     `📅 mes / ano: ${mesAno}\n` +
                     `🔐 cvv: ${cvv}\n\n` +
                     `🏳️ bandeira: ${bandeira}\n` +
                     `💠 nível: ${nivel}\n` +
                     `⚜️ tipo: ${tipo}\n` +
                     `🏛️ banco: ${banco}\n` +
                     `🌍 pais: ${pais}\n\n` +
                     `👤 Nome:\n` +
                     `${nomeCliente}\n` +
                     `🪪 cpf:\n` +
                     `${cpf}`;

    const nomeProduto = `${bandeira.toUpperCase()} ${nivel.toUpperCase()}`;

    // 6. Salvando no Banco de Dados (Supabase)
    const { error } = await supabase.from("produtos").insert([{
        nome: nomeProduto,
        preco: preco,
        preco_texto: `R$ ${preco.toFixed(2).replace(".", ",")}`,
        bin: bin,
        demonstracao: demonstracao,
        completo: completo
    }]);

    if (error) {
        console.error("Erro Supabase:", error);
        return ctx.reply("❌ Erro ao salvar o produto no banco de dados.");
    }

    await ctx.reply(`✅ *Produto adicionado com sucesso!*`, { parse_mode: "Markdown" });
});


bot.command("estoque", async (ctx) => {
    const userId = String(ctx.from.id);
    if (userId !== ADMIN_ID) return ctx.reply("❌ Sem permissão.");

    const lista = await obterProdutosDoBanco();
    await ctx.reply(`📊 *Estoque Atual:* ${lista.length} frases disponíveis no banco de dados.`, { parse_mode: "Markdown" });
});

bot.command("pix", async (ctx) => {
    const argumento = ctx.match ? ctx.match.trim() : "";

    if (argumento) {
        const valorDigitado = parseFloat(argumento.replace(",", "."));
        if (isNaN(valorDigitado) || valorDigitado < 30) {
            return ctx.reply("❌ *Valor inválido!*\nO valor mínimo para depósito é de *R$ 30,00*.", { parse_mode: "Markdown" });
        }
        return depararEGerarPixSaldo(ctx, valorDigitado);
    }

    await ctx.reply("💵 *Digite o valor que deseja adicionar em saldo:*\n\n_(Valor mínimo: R$ 30,00)_", {
        reply_markup: { force_reply: true }
    });
});

// ==========================================
// PROCESSAMENTO DE CALLBACKS & CARROSSEIS
// ==========================================

bot.callbackQuery(/^bin_filtro_([^_]+)_(\d+)$/, async (ctx) => {
    const binDigitada = ctx.match[1];
    const pagina = parseInt(ctx.match[2]);
    await exibirCarrosselBinFiltrado(ctx, binDigitada, pagina, true);
    await ctx.answerCallbackQuery();
});

async function enviarCarrossel(ctx, index) {
    const userId = String(ctx.from.id);
    const produtosLista = await obterProdutosDoBanco();
    const total = produtosLista.length;

    if (total === 0) {
        return ctx.editMessageText("📭 A vitrine está vazia no momento!", {
            reply_markup: new InlineKeyboard().text("⬅️ Voltar ao Menu", "menu_principal")
        });
    }

    const indexAtual = index >= total ? total - 1 : index;
    const produto = produtosLista[indexAtual];

    let textoProduto = `💳 *Vitrine de CC* (${indexAtual + 1}/${total})\n\n`;
    
    // CORREÇÃO SEGURA: Se o campo demonstracao estiver vazio, ele usa o nome do produto para não travar o bot do cliente
    const infoDemonstracao = produto.demonstracao || produto.nome || "Produto sem descrição";
    const precoMostrar = produto.preco_texto || `R$ ${parseFloat(produto.preco).toFixed(2)}`;

    if (userId === ADMIN_ID) {
        textoProduto += `👑 *MODO ADMINISTRADOR*\n\n${produto.completo || infoDemonstracao}`;
    } else {
        textoProduto += `${infoDemonstracao}\n\n💰 *Preço:* ${precoMostrar}`;
    }
    
    const teclado = new InlineKeyboard();
    if (indexAtual > 0) teclado.text("⬅️ Ant", `comprar_page_${indexAtual - 1}`);
    if (indexAtual < total - 1) teclado.text("Próx ➡️", `comprar_page_${indexAtual + 1}`);
    if (userId !== ADMIN_ID) teclado.row().text(`💳 Comprar `, `pagar_id_${produto.id}`);
    teclado.row().text("⬅️ Voltar ao Menu", "menu_principal");

    try {
        await ctx.editMessageText(textoProduto, { parse_mode: "Markdown", reply_markup: teclado });
    } catch (error) {
        // Se ainda der erro de formato, envia como texto normal para garantir que o cliente veja
        await ctx.editMessageText(textoProduto, { reply_markup: teclado });
    }
}


bot.callbackQuery("menu_principal", async (ctx) => {
    await ctx.editMessageText("Escolha uma opção no menu abaixo:", { reply_markup: menuPrincipal });
    await ctx.answerCallbackQuery();
});

bot.callbackQuery("menu_perfil", async (ctx) => {
    const userId = ctx.from.id;
    const saldoAtual = await obterSaldo(userId);
    const listaDeCompras = await obterCompras(userId);
    const totalCompras = listaDeCompras.length;

    const textoPerfil = `👤 *Seu Perfil de Usuário*\n\n🆔 *ID:* \`${userId}\`\n💰 *Saldo em Conta:* R$ ${saldoAtual.toFixed(2)}\n💳 *CC Compradas:* ${totalCompras}`;

    const teclado = new InlineKeyboard();
    if (totalCompras > 0) {
        teclado.text("💳 Minhas cc ", "perfil_page_0").row();
    }
    teclado.text("⬅️ Voltar ao Menu", "menu_principal");

    await ctx.editMessageText(textoPerfil, { parse_mode: "Markdown", reply_markup: teclado });
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
    
    let textoPerfil = `🛍️ *Suas CC Compradas* (${index + 1}/${totalCompras})\n\n`;
    const teclado = new InlineKeyboard();

    if (totalCompras === 0) {
        textoPerfil += `_Você ainda não comprou nenhuma frase._`;
        teclado.text("⬅️ Voltar ao Perfil", "menu_perfil");
    } else {
        const item = listaDeCompras[index];
        textoPerfil += `📦 *${item.nome}*\n\n${item.completo}`;
        
        if (index > 0) teclado.text("⬅️ Ant", `perfil_page_${index - 1}`);
        if (index < totalCompras - 1) teclado.text("Próx ➡️", `perfil_page_${index + 1}`);
        
        teclado.row().text("⬅️ Voltar ao Perfil", "menu_perfil");
    }

    await ctx.editMessageText(textoPerfil, { parse_mode: "Markdown", reply_markup: teclado });
}

bot.callbackQuery("menu_comprar", async (ctx) => {
    try {
        await ctx.answerCallbackQuery(); // Responde ao Telegram imediatamente para o botão parar de "girar"
        await enviarCarrossel(ctx, 0);
    } catch (e) {
        console.error("Erro no callback menu_comprar:", e);
    }
});

async function enviarCarrossel(ctx, index) {
    try {
        const userId = String(ctx.from.id);
        const produtosLista = await obterProdutosDoBanco();
        const total = produtosLista.length;

        const tecladoVoltar = new InlineKeyboard().text("⬅️ Voltar ao Menu", "menu_principal");

        // Se o estoque estiver vazio, envia uma mensagem nova garantida em vez de editar e travar
        if (total === 0) {
            try {
                await ctx.editMessageText("📭 A vitrine está vazia no momento!", { reply_markup: tecladoVoltar });
            } catch (err) {
                await ctx.reply("📭 A vitrine está vazia no momento!", { reply_markup: tecladoVoltar });
            }
            return;
        }

        const indexAtual = index >= total ? total - 1 : index;
        const produto = produtosLista[indexAtual];

        if (!produto) {
            try {
                await ctx.editMessageText("📭 Produto não encontrado.", { reply_markup: tecladoVoltar });
            } catch (err) {
                await ctx.reply("📭 Produto não encontrado.", { reply_markup: tecladoVoltar });
            }
            return;
        }

        let textoProduto = `💳 *Vitrine de CC* (${indexAtual + 1}/${total})\n\n`;
        
        const infoDemonstracao = produto.demonstracao || produto.nome || "Sem descrição";
        const precoMostrar = produto.preco_texto || `R$ ${parseFloat(produto.preco).toFixed(2)}`;

        if (userId === ADMIN_ID) {
            textoProduto += `👑 *MODO ADMINISTRADOR*\n\n${produto.completo || infoDemonstracao}`;
        } else {
            textoProduto += `${infoDemonstracao}\n\n💰 *Preço:* ${precoMostrar}`;
        }
        
        const teclado = new InlineKeyboard();
        if (indexAtual > 0) teclado.text("⬅️ Ant", `comprar_page_${indexAtual - 1}`);
        if (indexAtual < total - 1) teclado.text("Próx ➡️", `comprar_page_${indexAtual + 1}`);
        if (userId !== ADMIN_ID) teclado.row().text(`💳 Comprar `, `pagar_id_${produto.id}`);
        teclado.row().text("⬅️ Voltar ao Menu", "menu_principal");

        try {
            await ctx.editMessageText(textoProduto, { parse_mode: "Markdown", reply_markup: teclado });
        } catch (error) {
            // Se falhar a edição (ex: Markdown inválido no produto), envia uma nova mensagem limpa
            try {
                await ctx.reply(textoProduto, { parse_mode: "Markdown", reply_markup: teclado });
            } catch (deepError) {
                await ctx.reply(textoProduto, { reply_markup: teclado }); // Envia sem markdown se a descrição tiver caracteres especiais
            }
        }
    } catch (error) {
        console.error("Erro crítico na vitrine:", error);
    }
}


bot.callbackQuery(/^comprar_page_(\d+)$/, async (ctx) => {
    const pagina = parseInt(ctx.match[1]);
    await enviarCarrossel(ctx, pagina);
    await ctx.answerCallbackQuery();
});


bot.callbackQuery(/^pagar_id_(\d+)$/, async (ctx) => {
    // CORREÇÃO: Garante que o ID do cliente seja tratado como String, assim como no resto do bot
    const userId = String(ctx.from.id); 
    const produtoId = parseInt(ctx.match[1]);
    
    const produtosLista = await obterProdutosDoBanco();
    const produtoIndex = produtosLista.findIndex(p => p.id === produtoId);

    if (produtoIndex === -1) {
        await ctx.answerCallbackQuery({ text: "❌ Desculpe, este produto acabou de ser vendido!", show_alert: true });
        return;
    }

    const produto = produtosLista[produtoIndex];
    const saldoAtual = await obterSaldo(userId);

    if (saldoAtual >= produto.preco) {
        const novoSaldo = saldoAtual - produto.preco;
        await atualizarSaldo(userId, novoSaldo); 
        await salvarCompra(userId, produto); 
        await removerProdutoDoBanco(produto.id); 

        await ctx.editMessageText(`🎉 *COMPRA APROVADA VIA CARTEIRA!*\n\n${produto.completo}\n\n📉 *Saldo restante:* R$ ${novoSaldo.toFixed(2)}`, { parse_mode: "Markdown" });
        await ctx.answerCallbackQuery({ text: "Compra realizada com saldo!" });
        return;
    }

    await ctx.editMessageText("⏳ Gerando seu código Pix copia e cola, aguarde um instante...");
    await ctx.answerCallbackQuery();

    try {
        const url = "https://api.mercadopago.com/v1/payments";
        const options = {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MP_TOKEN}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": `${Date.now()}-${userId}` // Usando a variável corrigida
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
        await ctx.reply(`✅ *PIX Gerado!*\n\n💵 *Valor:* ${produto.preco_texto}\n\n👇 Copie o código Pix abaixo:`, { parse_mode: "Markdown" });
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
                    
                    await salvarCompra(userId, produto); 
                    await removerProdutoDoBanco(produto.id); 

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
    await ctx.reply("💵 *Digite o valor que deseja adicionar em saldo:*\n\n_(Valor mínimo: R$ 20,00)_", {
        reply_markup: { force_reply: true }
    });
});

// 🔥 INSTÂNCIA CORRIGIDA E TRAVADA CONTRA PERDA DE ID
async function depararEGerarPixSaldo(ctx, valorDigitado) {
    const msgAviso = await ctx.reply("⏳ _Gerando seu Pix de Saldo..._");
    
    // 💡 TRAVA DO ID: Fixa o ID do cliente em uma constante para o loop não perder!
    const usuarioIdFixo = ctx.from.id;

    try {
        const url = "https://api.mercadopago.com/v1/payments";
        const options = {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MP_TOKEN}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": `${Date.now()}-${usuarioIdFixo}`
            }
        };
        const body = {
            transaction_amount: valorDigitado,
            description: `Adicionar Saldo - User: ${usuarioIdFixo}`,
            payment_method_id: "pix",
            payer: { email: "comprador_telegram@email.com" }
        };

        const data = await fazerRequisicao(url, options, body);
        const pixCopiaCola = data.point_of_interaction?.transaction_data?.qr_code;
        if (!pixCopiaCola) throw new Error("Erro Mercado Pago");

        try { await ctx.api.deleteMessage(ctx.chat.id, msgAviso.message_id); } catch(e){}

        await ctx.reply(`✅ *PIX de Saldo Gerado!*\n💰 *Valor:* R$ ${valorDigitado.toFixed(2)}\n\n👇 Copie o código abaixo:`, { parse_mode: "Markdown" });
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
                    
                    // 💡 GARANTIA SUPABASE: Envia de forma explícita para o ID estável do comprador
                    const saldoAtual = await obterSaldo(usuarioIdFixo);
                    await atualizarSaldo(usuarioIdFixo, saldoAtual + valorDigitado); 

                    await ctx.api.sendMessage(usuarioIdFixo, `🎉 *PAGAMENTO CONFIRMADO!*\n*R$ ${valorDigitado.toFixed(2)}* foram adicionados à sua carteira.`, { parse_mode: "Markdown" });
                }
            } catch (err) {}
            if (tentativesSaldo >= 60) clearInterval(checarSaldo);
        }, 10000);

    } catch (error) {
        try { await ctx.api.deleteMessage(ctx.chat.id, msgAviso.message_id); } catch(e){}
        await ctx.reply("❌ Erro ao gerar o Pix.");
    }
}

bot.on("message", async (ctx) => {
    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.text) return; 

    if (reply.text.includes("Digite o valor que deseja adicionar")) {
        const valorDigitado = parseFloat(ctx.message.text.replace(",", "."));
        if (isNaN(valorDigitado) || valorDigitado < 5) return ctx.reply("❌ *Valor inválido!*");

        await depararEGerarPixSaldo(ctx, valorDigitado);
    }
});

bot.start();
