
// --------------------------------
// LÓGICA DE ONBOARDING E REDIRECIONAMENTO (NOVA ADIÇÃO)
// --------------------------------

// NO SEU ARQUIVO index.js

function checkOnboardingStatus() {
    const status = localStorage.getItem('primeiroAcesso');

    // Estado 1: Início ou Termos não aceitos (null ou 'true')
    if (status === null || status === 'true') {
        window.location.replace('termos.html');
        return true; 
    }
    
    // NOVO ESTADO 2: Termos aceitos, mas Políticas de Privacidade não aceitas
    if (status === 'politica') {
        window.location.replace('politica_privacidade.html');
        return true; 
    }
    
    // Estado 3: Políticas aceitas, mas Ajuda/Guia não visto ('ajuda')
    if (status === 'ajuda') {
        window.location.replace('ajuda.html');
        return true; 
    }
    
    // Estado 4: Onboarding completo ('false')
    console.log("Onboarding completo. Carregando App Principal.");
    return false;
}

// --------------------------------
// SETUP E VARIÁVEIS GLOBAIS
// (O restante do seu código começa aqui, e só será executado se o onboarding for 'false')
// --------------------------------

const FRASES_URL = 'assets/frases/frases.json'; 

const frasesFallback = [
    { texto: "O amor não consiste em olhar um para o outro, mas sim em olhar juntos para a mesma direção.", autor: "Antoine de Saint-Exupéry", categoria: "Romance" },
    { texto: "A criatividade é a inteligência se divertindo.", autor: "Albert Einstein", categoria: "Criatividade" },
    { texto: "A tecnologia move o mundo, mas a alma é que dá sentido à vida.", autor: "Anônimo", categoria: "Tecnologia e Vida" },
    { texto: "Felicidade é um modo de viajar e não um destino.", autor: "Roy M. Goodman", categoria: "Felicidade" },
    { texto: "A persistência realiza o impossível.", autor: "Provérbio Chinês", categoria: "Motivação" },
];
const fraseCristina = {
    texto: "Cada momento contigo é como respirar pela primeira vez, um misto de paz, desejo e encantamento. O teu toque acende o meu coração e o teu sorriso ilumina a minha alma ✨❤️🔥. Contigo, todo o amor que sonhei finalmente existe.",
    autor: "Seu Admirador Secreto",
    categoria: "Romance Exclusivo"
};

// Variáveis de Lógica
let cliqueContador = 0;
let fraseAtual = null; 
let allFrasesData = []; 
let typingTimeout = null; 
let lastScrollTop = 0;
const scrollContainer = document.documentElement; 
let isInteracting = false; 

// Variáveis de Tema e Cor 
const themeKey = 'appTheme';
const corKey = 'appCorDestaque'; 
const corPadrao = '#e91e63';
const corTextoKey = 'appCorTexto';
const corTextoPadrao = '#1c274b'; 
const fundoKey = 'appCorFundo';
const fundoPadrao = '#eef2f5'; 

// CHAVES DE FEEDBACK
const KEY_VIBRACAO = 'prefVibracao';
const KEY_SOM = 'prefSomClique';
const clickSound = new Audio('assets/sound/click.mp3');

// Variáveis DOM
const dom = {
    cardFrase: document.getElementById('card-frase'),
    fraseTexto: document.getElementById('frase-texto'),
    fraseAutor: document.getElementById('frase-autor'),
    fraseCategoria: document.getElementById('frase-categoria'),
    cabecalho: document.getElementById('cabecalho-principal'), 
    cardsInferiores: document.getElementById('cards-inferiores'), 
    cardsInterativos: document.querySelectorAll('.ripple'),
    logoEasterEgg: document.getElementById('logo-easter-egg'),
    cardPublicidade: document.getElementById('card-publicidade'),
    btnCompartilhar: document.getElementById('btn-compartilhar-app'),
    botoesAcaoFrase: document.querySelectorAll('.acoes-frase .btn-acao'),
    btnShuffle: document.getElementById('btn-shuffle-frase'),
    btnToggleTheme: document.getElementById('btn-toggle-theme'),
    searchBar: document.querySelector('.input-pesquisa'),
    suggestionsBox: document.querySelector('.sugestoes-animadas'),
};


/** Aplica as configurações de tema e cor salvas no armazenamento local. */
function loadSettings() {
    const savedTheme = localStorage.getItem(themeKey);
    const savedDestaque = localStorage.getItem(corKey);
    const savedFundo = localStorage.getItem(fundoKey);
    const savedTexto = localStorage.getItem(corTextoKey);
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDarkMode = (savedTheme === 'dark') || (!savedTheme && prefersDark);
    
    if (document.body) {
        if (isDarkMode) {
            document.body.classList.add('theme-escuro');
        } else {
            document.body.classList.remove('theme-escuro');
        }
    }
    
    const finalFundo = savedFundo || (isDarkMode ? '#121212' : fundoPadrao);
    const finalTexto = savedTexto || (isDarkMode ? '#f0f0f0' : corTextoPadrao);

    document.documentElement.style.setProperty('--cor-destaque', savedDestaque || corPadrao);
    document.documentElement.style.setProperty('--cor-fundo-principal', finalFundo);
    document.documentElement.style.setProperty('--cor-texto-principal', finalTexto);
}

loadSettings();


// --------------------------------
// FUNÇÕES DE FEEDBACK
// --------------------------------

function playClickSound() {
    const isSomEnabled = localStorage.getItem(KEY_SOM) !== 'false';
    if (isSomEnabled) {
        const soundClone = clickSound.cloneNode();
        soundClone.volume = 0.5;
        soundClone.play().catch(e => console.log("A reprodução do som foi impedida:", e));
    }
}

function triggerHapticFeedback(pattern = 50) {
    const isVibracaoEnabled = localStorage.getItem(KEY_VIBRACAO) !== 'false';
    if (navigator.vibrate && isVibracaoEnabled) {
        navigator.vibrate(pattern); 
    }
}


// --------------------------------
// LÓGICA DE FRASES E DADOS (FETCHING)
// --------------------------------

async function fetchFrases() {
    try {
        const response = await fetch(FRASES_URL);
        if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
        const data = await response.json();
        // Garante que allFrasesData é um array, se o JSON tiver um wrapper 'frases'
        allFrasesData = Array.isArray(data) ? data : data.frases || frasesFallback;
    } catch (error) {
        console.error("Falha ao carregar frases externas. Usando frases de fallback.", error);
        allFrasesData = frasesFallback;
    }
}

function getDataString() {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}
// ASSUME QUE AS VARIÁVEIS GLOBAIS (dom, allFrasesData, themeKey, etc.) DA PARTE 1 ESTÃO DEFINIDAS.

// --------------------------------
// LÓGICA DE PESQUISA
// --------------------------------

/**
 * Lógica principal de sugestão: filtra categorias e frases.
 * Aparece com 2 ou mais caracteres.
 */
function updateSuggestions(query) {
    query = query.trim().toLowerCase();
    dom.suggestionsBox.innerHTML = '';
    
    // Se a query for curta, ou se estiver vazio, esconde e sai
    if (query.length < 2 || !query) {
        dom.suggestionsBox.style.display = 'none';
        return;
    }

    const MAX_SUGGESTIONS = 6;
    let suggestionsCount = 0;
    
    // Para a Home, vamos focar em frases e autores
    const matchedFrases = allFrasesData.filter(frase => 
        frase.texto.toLowerCase().includes(query) || 
        (frase.autor && frase.autor.toLowerCase().includes(query)) ||
        (frase.categoria && frase.categoria.toLowerCase().includes(query))
    );
    
    matchedFrases.slice(0, MAX_SUGGESTIONS).forEach(frase => {
        if (suggestionsCount < MAX_SUGGESTIONS) {
            let display = frase.texto.length > 50 
                ? frase.texto.substring(0, 50) + '...' 
                : frase.texto;

            // Adiciona o nome do autor/categoria para contexto
            const infoExtra = frase.categoria === query ? `[${frase.autor}]` : `[${frase.categoria}]`;
            
            // Destaca a palavra chave
            display = highlightMatch(display, query);

            renderSuggestionItem(display + ' <small style="opacity:0.7;">' + infoExtra + '</small>', frase.texto);
            suggestionsCount++;
        }
    });
    
    if (suggestionsCount > 0) {
        dom.suggestionsBox.style.display = 'block';
    } else {
        dom.suggestionsBox.style.display = 'none';
    }
}

/** Cria e anexa um item de sugestão. */
function renderSuggestionItem(displayHtml, value) {
    const item = document.createElement('div');
    item.className = `suggestion-item`;
    item.innerHTML = displayHtml;
    
    item.addEventListener('click', () => {
        dom.searchBar.value = value;
        handleSearchSubmit(value);
    });

    dom.suggestionsBox.appendChild(item);
}

/** Função auxiliar para destacar a query nos resultados. */
function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong style="color:var(--cor-destaque);">$1</strong>');
}

/** Lida com a submissão da pesquisa (Enter ou clique em sugestão). */
function handleSearchSubmit(query) {
    if (query.length >= 2) {
        window.location.href = `categorias.html?search=${encodeURIComponent(query)}`;
        clearSuggestions();
    } else {
        alert("Digite pelo menos 2 caracteres para pesquisar.");
    }
}

/** Limpa a caixa de sugestões. */
function clearSuggestions() {
    dom.suggestionsBox.innerHTML = '';
    dom.suggestionsBox.style.display = 'none';
}


// --------------------------------
// LÓGICA DE FRASES E DADOS (APLICAÇÃO)
// --------------------------------


async function loadFraseDoDia() {
    if (allFrasesData.length === 0) await fetchFrases();
    if (allFrasesData.length === 0) return;
    
    const dataCache = getDataString();
    const cacheKey = `fraseDoDia_${dataCache}`;
    
    let fraseSalva = localStorage.getItem(cacheKey);

    if (fraseSalva) {
        fraseAtual = JSON.parse(fraseSalva);
    } else {
        const indiceAleatorio = Math.floor(Math.random() * allFrasesData.length);
        fraseAtual = allFrasesData[indiceAleatorio];
        localStorage.setItem(cacheKey, JSON.stringify(fraseAtual));
    }

    dom.fraseAutor.textContent = `— ${fraseAtual.autor || 'Anônimo'}`;
    dom.fraseCategoria.textContent = `Categoria: ${fraseAtual.categoria || 'Geral'}`;
    
    typeText(dom.fraseTexto, fraseAtual.texto);
    updateFavoritoIcon(fraseAtual);

    // === NOVO: Registrar no Histórico e atualizar badge ===
    registrarNoHistorico(fraseAtual);
    atualizarContadoresHome();
}

async function atualizarContadoresHome() {
    // 1. Categorias (Baseado no JSON)
    if (typeof allFrasesData !== 'undefined' && allFrasesData.length > 0) {
        const categorias = [...new Set(allFrasesData.map(f => f.categoria))];
        const el = document.getElementById('badge-categorias');
        if (el) el.textContent = categorias.length;
    }

    // 2. Favoritos
    const favs = JSON.parse(localStorage.getItem('frasesFavoritas') || '[]');
    const elFav = document.getElementById('badge-favoritos');
    if (elFav) {
        elFav.textContent = favs.length;
        elFav.style.display = favs.length > 0 ? 'flex' : 'none';
    }

    // 3. Histórico
    const hist = JSON.parse(localStorage.getItem('Frases') || '[]');
    const elHist = document.getElementById('badge-historico');
    if (elHist) {
        elHist.textContent = hist.length;
        elHist.style.display = hist.length > 0 ? 'flex' : 'none';
    }
// 4. Minhas Frases (O que corrigimos antes)
    const dadosMinhas = localStorage.getItem('minhasCitacoes');
    const minhas = JSON.parse(dadosMinhas || '[]');
    const elMinhas = document.getElementById('badge-minhas-frases');
    if (elMinhas) {
        elMinhas.textContent = minhas.length;
        elMinhas.style.display = minhas.length > 0 ? 'flex' : 'none';
    }

    // 5. NOVO: Histórias (Ajuste aqui)
    // Se você tiver um array historiasData, use historiasData.length
    const totalHistorias = 6; // Valor exemplo enquanto você não cria a tela
    const elStories = document.getElementById('badge-historias');
    if (elStories) {
        elStories.textContent = totalHistorias;
        elStories.style.display = totalHistorias > 0 ? 'flex' : 'none';
        
        // Aplica a animação pop se você a adicionou no CSS
        elStories.classList.add('badge-pop'); 
    }
}

async function shuffleFrase() {
    triggerHapticFeedback();
    playClickSound();
    
    if (dom.btnShuffle) {
        dom.btnShuffle.classList.add('active');
        setTimeout(() => dom.btnShuffle.classList.remove('active'), 800);
    }
    
    if (allFrasesData.length === 0) {
        await fetchFrases();
        if (allFrasesData.length === 0) return;
    }
    
    let newFrase = null;
    let attempts = 0;
    
    while (!newFrase || getFraseId(newFrase) === getFraseId(fraseAtual) && attempts < 10) {
        const indiceAleatorio = Math.floor(Math.random() * allFrasesData.length);
        newFrase = allFrasesData[indiceAleatorio];
        attempts++;
    }
    
    if (!newFrase) return;

    fraseAtual = newFrase;
    dom.fraseAutor.textContent = `— ${fraseAtual.autor || 'Anônimo'}`;
    dom.fraseCategoria.textContent = `Categoria: ${fraseAtual.categoria || 'Geral'}`;
    
    typeText(dom.fraseTexto, fraseAtual.texto);
    updateFavoritoIcon(fraseAtual); 

    // === NOVO: Registrar no Histórico e atualizar badge ===
    registrarNoHistorico(fraseAtual);
    atualizarContadoresHome();
}


function registrarNoHistorico(frase) {
    if (!frase) return;
    const KEY_HISTORICO = 'frasesHistorico';
    let historico = JSON.parse(localStorage.getItem(KEY_HISTORICO) || '[]');
    
    const textoAtual = frase.texto || frase.Texto;

    // Verifica se a frase já está no histórico pelo texto
    const jaExiste = historico.some(item => (item.texto || item.Texto) === textoAtual);

    if (!jaExiste) {
        historico.unshift({
            texto: textoAtual,
            autor: frase.autor || frase.Autor || 'Anônimo',
            categoria: frase.categoria || frase.Categoria || 'Geral',
            data: new Date().toISOString()
        });
        
        // Limita aos últimos 50 para não travar o app
        localStorage.setItem(KEY_HISTORICO, JSON.stringify(historico.slice(0, 50)));
        
        // Atualiza os números na tela na hora
        atualizarContadoresHome();
    }
}

// --------------------------------
// ANIMAÇÃO E INTERATIVIDADE GERAL
// --------------------------------

function typeText(elemento, texto, indice = 0) {
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (indice === 0) {
        elemento.textContent = '';
        elemento.classList.remove('typing-done');
        elemento.style.opacity = '1';
        elemento.classList.add('typing-in-progress'); 
        dom.cardFrase.classList.remove('animacao-brilho-suave');
    }
    
    if (indice < texto.length) {
        elemento.textContent += texto.charAt(indice);
        typingTimeout = setTimeout(() => typeText(elemento, texto, indice + 1), 50);
    } else {
        elemento.classList.remove('typing-in-progress'); 
        elemento.classList.add('typing-done');
        dom.cardFrase.classList.add('animacao-brilho-suave');
    }
}

function aplicarEfeitoRipple(event) {
    const card = this;
    
    triggerHapticFeedback(20);
    playClickSound();

    card.classList.add('elastic-scale-active');
    setTimeout(() => {
        card.classList.remove('elastic-scale-active');
    }, 200);

    const rippleExistente = card.querySelector('.ripple-effect');
    if (rippleExistente) rippleExistente.remove();

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const diametro = Math.max(card.clientWidth, card.clientHeight);
    const ripple = document.createElement('span');
    
    ripple.classList.add('ripple-effect');
    ripple.style.width = ripple.style.height = `${diametro}px`;
    ripple.style.left = `${x - diametro / 2}px`;
    ripple.style.top = `${y - diametro / 2}px`;

    card.appendChild(ripple);

    setTimeout(() => ripple.remove(), 500);
}



// --- CONFIGURAÇÃO GLOBAL ---
const listaArquivosHistorias = ['infantis', 'biblicas', 'romance', 'reflexao', 'drama'];

// Dados que serão trocados no Guia Visual
const dadosCards = {
    'infantis': { titulo: 'Infantis', texto: 'Histórias lúdicas para crianças.' },
    'biblicas': { titulo: 'Histórias Bíblicas', texto: 'Historias e reflexões baseadas na palavra divina.' },
    'romance':  { titulo: 'Romance', texto: 'Veja os melhores contos de Amor.' },
    'reflexao': { titulo: 'Pausa e Reflexão', texto: 'Pensamentos para o seu dia.' }, 
        'drama': { titulo: 'Dramas', texto: 'Leia historias mais dramaticas de sempre.' },
};

function atualizarHistoriasHome() {
    const card = document.getElementById('card-historias-home');
    const tituloEl = card?.querySelector('.publicidade-title');
    const textoEl = card?.querySelector('.publicidade-text');
    
    if (!card) return;

    // Sorteia a categoria
    const categoria = listaArquivosHistorias[Math.floor(Math.random() * listaArquivosHistorias.length)];
    
    // AJUSTADO: Pasta 'imagem' e extensão '.png'
    const path = `assets/imagem/${categoria}.jpg`;

    // 1. Fade Out
    card.style.transition = 'opacity 0.6s ease-in-out';
    card.style.opacity = '0';

    setTimeout(() => {
        // 2. Troca o Fundo com o novo caminho
        card.style.backgroundImage = `url('${path}')`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';

        // 3. Troca as Informações do Guia
        if (tituloEl && textoEl) {
            tituloEl.textContent = dadosCards[categoria].titulo;
            textoEl.textContent = dadosCards[categoria].texto;
        }
        
        // 4. Reset do Zoom e Fade In
        card.style.transition = 'none';
        card.style.transform = 'scale(1)';
        void card.offsetWidth; 

        card.style.transition = 'opacity 0.8s ease-in-out, transform 4.5s linear';
        card.style.opacity = '1';
        card.style.transform = 'scale(1.15)';
    }, 600);
}

// 2. FUNÇÃO DOS CONTADORES (Ajustada para contar categorias)
async function atualizarContadoresHome() {
    const atualizarElemento = (id, valor) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = valor;
        el.style.display = valor > 0 ? 'flex' : 'none';
        
        el.classList.remove('badge-pop');
        void el.offsetWidth; 
        el.classList.add('badge-pop');
    };

    // 1. Categorias principais (Frases do app)
    if (typeof allFrasesData !== 'Não Definido') {
        const totalCat = [...new Set(allFrasesData.map(f => f.categoria))].length;
        atualizarElemento('badge-categorias', totalCat);
    }

    // 2. Favoritos, 3. Histórico, 4. Minhas Frases
    atualizarElemento('badge-favoritos', JSON.parse(localStorage.getItem('frasesFavoritas') || '[]').length);
    
    // 3. Histórico (Trecho para a HOME)
const elHist = document.getElementById('badge-historico');
if (elHist) {
    // Tentamos ler as duas chaves possíveis para garantir
    const dados = localStorage.getItem('frasesHistorico') || localStorage.getItem('frasesHistorico') || '[]';
    const lista = JSON.parse(dados);
    
    // Atualiza o número
    elHist.textContent = lista.length;
    
    // FORÇA O APARECIMENTO: Se for 0, ele mostra 0 mas não some mais.
    // Isso ajuda a ver se o elemento está no lugar certo.
    elHist.style.setProperty('display', 'flex', 'important');
    
    // Se estiver 0, muda a cor para cinza, se tiver algo, volta para a cor destaque
    elHist.style.backgroundColor = lista.length > 0 ? 'var(--cor-destaque)' : '#999';
    
    console.log("Home leu total de:", lista.length);
}
    
    atualizarElemento('badge-minhas-frases', JSON.parse(localStorage.getItem('minhasCitacoes') || '[]').length);

    // 5. Histórias (Contagem de Categorias)
    const totalTemasHistorias = listaArquivosHistorias.length;
    atualizarElemento('badge-historias', totalTemasHistorias);
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    atualizarContadoresHome();
    
    // Executa a primeira vez logo ao carregar
    atualizarHistoriasHome();
    
    // Inicia o loop de 5 segundos
    setInterval(atualizarHistoriasHome, 5000);
});

// --------------------------------
// LÓGICA DE OCULTAR/MOSTRAR AO SCROLL
// --------------------------------

function setupScrollAnimations() {
    window.addEventListener('touchstart', handleInteractionStart);
    window.addEventListener('touchend', handleInteractionEnd);
    window.addEventListener('mousedown', handleInteractionStart);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('scroll', handleScrollMoveAndHide); 
}

function handleInteractionStart() {
    isInteracting = true; 
    const currentScroll = scrollContainer.scrollTop;
    
    if (currentScroll > 50) {
        dom.cabecalho.classList.add('oculto');
        dom.cardsInferiores.classList.add('oculto');
    }
}

function handleScrollMoveAndHide() {
    const currentScroll = scrollContainer.scrollTop;
    
    if (currentScroll > 50) {
        dom.cabecalho.classList.add('oculto');
        dom.cardsInferiores.classList.add('oculto');
    }
    
    lastScrollTop = currentScroll;
}

function handleInteractionEnd() {
    setTimeout(() => {
        const currentScroll = scrollContainer.scrollTop;
        const scrollMax = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        
        const scrolledUp = currentScroll < lastScrollTop;
        const scrolledToTop = currentScroll <= 50;
        const noScrollNeeded = scrollMax <= 10; 

        if (scrolledToTop || scrolledUp || noScrollNeeded) {
            dom.cabecalho.classList.remove('oculto');
            dom.cardsInferiores.classList.remove('oculto');
        } 
        
        isInteracting = false; 
        lastScrollTop = currentScroll; 
    }, 100);
}


// --------------------------------
// LÓGICA DE TEMA E COR
// --------------------------------

function aplicarVariavelCSS(nomeVariavel, valor) {
    if (valor) {
        document.documentElement.style.setProperty(nomeVariavel, valor);
    }
}

function loadCorPreference() {
    const savedCor = localStorage.getItem(corKey);
    aplicarVariavelCSS('--cor-destaque', savedCor || corPadrao);
}

function loadCorTextoPreference() {
    const savedCorTexto = localStorage.getItem(corTextoKey);
    aplicarVariavelCSS('--cor-texto-principal', savedCorTexto || corTextoPadrao);
}

function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('theme-escuro');
    localStorage.setItem(themeKey, isDarkMode ? 'dark' : 'light');
    
    aplicarTemaSalvo(); 
    updateThemeIcon(isDarkMode);
    
    triggerHapticFeedback();
    playClickSound();
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem(themeKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let isDarkMode = false;
    
    if (savedTheme === 'dark') {
        isDarkMode = true;
    } else if (savedTheme === 'light') {
        isDarkMode = false;
    } else if (prefersDark) {
        isDarkMode = true;
    }

    if (isDarkMode) {
        document.body.classList.add('theme-escuro');
    }
    
    updateThemeIcon(isDarkMode);
}

function updateThemeIcon(isDarkMode) {
    const btnIcon = document.querySelector('#btn-toggle-theme i');
    if (btnIcon) {
        if (isDarkMode) {
            btnIcon.classList.remove('fa-moon');
            btnIcon.classList.add('fa-sun');
        } else {
            btnIcon.classList.remove('fa-sun');
            btnIcon.classList.add('fa-moon');
        }
    }
}

// --------------------------------
// FUNÇÕES AUXILIARES DE TEMA (PARA EASTER EGG)
// --------------------------------

function aplicarTemaSalvo() {
    const savedTheme = localStorage.getItem(themeKey);
    const savedFundo = localStorage.getItem(fundoKey); 
    const savedDestaque = localStorage.getItem(corKey);
    const savedTexto = localStorage.getItem(corTextoKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let isDarkMode = (savedTheme === 'dark') || (!savedTheme && prefersDark);
    
    if (isDarkMode) {
        document.body.classList.add('theme-escuro');
    } else {
        document.body.classList.remove('theme-escuro');
    }

    const finalFundo = savedFundo || (isDarkMode ? '#121212' : '#eef2f5'); 
    const finalTexto = savedTexto || (isDarkMode ? '#f0f0f0' : corTextoPadrao);
    
    aplicarVariavelCSS('--cor-destaque', savedDestaque || corPadrao);
    aplicarVariavelCSS('--cor-fundo-principal', finalFundo);
    aplicarVariavelCSS('--cor-texto-principal', finalTexto); 

    if (dom.cardFrase) dom.cardFrase.style.removeProperty('background-color');
    if (dom.cabecalho) dom.cabecalho.style.removeProperty('background-color');
}

// Lógica do Easter Egg (5 cliques no logo)
function handleLogoClick() {
    triggerHapticFeedback();
    playClickSound();

    cliqueContador++;

    if (cliqueContador >= 5) {
        fraseAtual = fraseCristina;
        typeText(dom.fraseTexto, fraseAtual.texto);
        dom.fraseAutor.textContent = `— ${fraseAtual.autor}`;
        dom.fraseCategoria.textContent = `Categoria: ${fraseAtual.categoria}`;
        

        cliqueContador = 0;
    }

    clearTimeout(dom.logoEasterEgg.resetTimer);
    dom.logoEasterEgg.resetTimer = setTimeout(() => {
        if (cliqueContador < 5) {
            cliqueContador = 0;
        }
    }, 2000); 
}
// ASSUME QUE AS VARIÁVEIS GLOBAIS (dom, fraseAtual, etc.) E FUNÇÕES DE UTILIDADE DA PARTE 1 E 2.1 ESTÃO DEFINIDAS.

// --------------------------------
// CARROSSEL DE PUBLICIDADE
// --------------------------------

const publicidadeItems = [
    // --- PROMOÇÃO DE RECURSOS EXISTENTES ---
    { 
        img: 'assets/imagem/imagem1.jpg', 
        icon: 'fas fa-heart', 
        title: 'Frases Favoritas', 
        text: 'Salve as frases que mais tocam seu coração para ler a qualquer momento.' 
    },
    { 
        img: 'assets/imagem/imagem2.jpg', 
        icon: 'fas fa-book-open', 
        title: 'Explore Categorias', 
        text: 'Mergulhe em centenas de temas: amor, motivação, vida e muito mais!' 
    },
    { 
        img: 'assets/imagem/imagem3.jpg', 
        icon: 'fas fa-palette', 
        title: 'Customize o Tema', 
        text: 'Vá em Personalização e escolha suas cores favoritas para deixar o app com sua cara.' 
    },
    { 
        img: 'assets/imagem/imagem4.jpg', 
        icon: 'fas fa-share-alt', 
        title: 'Compartilhe Sabedoria', 
        text: 'Envie as melhores frases diretamente para seus amigos e redes sociais.' 
    },
    { 
        img: 'assets/imagem/imagem5.jpg', 
        icon: 'fas fa-history', 
        title: 'Relembre o Histórico', 
        text: 'Não perca aquela frase especial que você viu ontem. Seu histórico guarda tudo.' 
    },
    { 
        img: 'assets/imagem/imagem6.png', 
        icon: 'fas fa-pen-nib', 
        title: 'Crie Sua Frase', 
        text: 'Use a seção "Minhas Citações" para escrever e guardar suas próprias frases inspiradoras.' 
    },
    
    // --- DICAS DE USO E INTERATIVIDADE ---
    {
        img: 'assets/imagem/imagem7.jpg', 
        icon: 'fas fa-redo-alt', 
        title: 'Mude a Frase do Dia', 
        text: 'Não gostou da frase? Toque no ícone de recarregar para uma nova inspiração!'
    },
    {
        img: 'assets/imagem/imagem8.jpg', 
        icon: 'fas fa-search', 
        title: 'Busque Rapidamente', 
        text: 'Use a barra de pesquisa no topo para encontrar frases, autores ou categorias específicas.'
    },
    {
        img: 'assets/imagem/imagem9.jpg', 
        icon: 'fas fa-copy', 
        title: 'Copie e Cole', 
        text: 'Facilite sua vida! Copie qualquer frase instantaneamente com um toque no botão.'
    },

    // --- MENSAGENS INSPIRADORAS / TEASERS ---
    {
        img: 'assets/imagem/imagem10.jpg', 
        icon: 'fas fa-hand-holding-heart', 
        title: 'Um Momento para Você', 
        text: 'Tire um instante para refletir. Encontre a palavra certa para o seu dia.'
    },
    {
        img: 'assets/imagem/imagem11.png', 
        icon: 'fas fa-users', 
        title: 'Participe da Comunidade!', 
        text: 'Em breve: Espaço para interagir, comentar e compartilhar suas frases preferidas com outros usuários.' 
    },
    {
        img: 'assets/imagem/imagem12.jpg', 
        icon: 'fas fa-lightbulb', 
        title: 'Desvende Novas Ideias', 
        text: 'Cada frase é uma porta para um novo pensamento. Inspire-se e cresça!'
    }
];

let currentImageIndex = 0;


function startPublicidadeCarousel() {
    if (!dom.cardPublicidade) return;

    function updateImage() {
        dom.cardPublicidade.style.opacity = '0'; 

        setTimeout(() => {
            const currentItem = publicidadeItems[currentImageIndex];
            
            // 1. Atualiza o fundo da imagem
            dom.cardPublicidade.style.backgroundImage = `url(${currentItem.img})`;
            
            // 2. Cria e injeta o novo conteúdo HTML
            dom.cardPublicidade.innerHTML = `
                <div class="publicidade-overlay">
                    <div class="publicidade-header">
                        <i class="${currentItem.icon} publicidade-icon"></i>
                        <h3 class="publicidade-title">${currentItem.title}</h3>
                    </div>
                    <p class="publicidade-text">${currentItem.text}</p>
                </div>
            `;
            
            // 3. Atualiza o índice
            currentImageIndex = (currentImageIndex + 1) % publicidadeItems.length;
            
            // 4. Mostra o card
            dom.cardPublicidade.style.opacity = '1';
        }, 500); 
    }

    updateImage(); 
    setInterval(updateImage, 5000);
}


// --------------------------------
// AÇÕES DA FRASE (COPIAR, FAVORITAR, PARTILHAR)
// --------------------------------

function getFraseId(frase) {
    // Cria um ID único baseado no autor e nos primeiros 50 caracteres do texto
    return `${frase.autor || 'Anônimo'}-${frase.texto.substring(0, 50)}`;
}

function updateFavoritoIcon(frase) {
    const favoritosKey = 'frasesFavoritas';
    const favoritos = JSON.parse(localStorage.getItem(favoritosKey) || '[]');
    const isFavorita = favoritos.some(f => f.id === getFraseId(frase));
    
    const btnFavoritar = dom.cardFrase.querySelector('[data-acao="favoritar"]');
    if (!btnFavoritar) return;
    const icone = btnFavoritar.querySelector('i');

    if (isFavorita) {
        icone.classList.remove('far', 'fa-heart');
        icone.classList.add('fas', 'fa-heart', 'favoritado');
    } else {
        icone.classList.remove('fas', 'fa-heart', 'favoritado'); 
        icone.classList.add('far', 'fa-heart'); 
    }
}

function copiarFrase() {
    const textoParaCopiar = `${fraseAtual.texto}\n— ${fraseAtual.autor || 'Anônimo'}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textoParaCopiar).then(() => {
            alert('Frase copiada! ✔️');
        });
    } else {
        alert('Falha ao copiar. O navegador não suporta a cópia automática.');
    }
}

function partilharFrase() {
    const textoPartilha = `${fraseAtual.texto}\n— ${fraseAtual.autor || 'Anônimo'}\n\n(Compartilhado do App de Frases)`;
    if (navigator.share) {
        navigator.share({
            title: 'Frase Inspiradora',
            text: textoPartilha,
            url: window.location.href 
        }).catch((error) => {
            console.error('Erro ao partilhar:', error);
        });
    } else {
        alert('O compartilhamento nativo não é suportado.');
    }
}

function favoritarFrase(btnFavoritar) {
    const favoritosKey = 'frasesFavoritas';
    let favoritos = JSON.parse(localStorage.getItem(favoritosKey) || '[]');
    const id = getFraseId(fraseAtual);
    const indiceExistente = favoritos.findIndex(f => f.id === id);

    const icone = btnFavoritar.querySelector('i');

    if (indiceExistente !== -1) {
        // Desfavorita
        favoritos.splice(indiceExistente, 1);
        icone.classList.remove('fas', 'fa-heart', 'favoritado'); 
        icone.classList.add('far', 'fa-heart'); 
        triggerHapticFeedback(30); 
        
    } else {
        // Favorita
        favoritos.push({ id: id, texto: fraseAtual.texto, autor: fraseAtual.autor, categoria: fraseAtual.categoria });
        icone.classList.remove('far', 'fa-heart');
        icone.classList.add('fas', 'fa-heart', 'favoritado', 'animacao-pop');
        setTimeout(() => icone.classList.remove('animacao-pop'), 500);
        triggerHapticFeedback([20, 10, 20]); 
    }

    localStorage.setItem(favoritosKey, JSON.stringify(favoritos));
}

function handleAcoesFrase(event) {
    const btn = event.currentTarget; 
    const acao = btn.getAttribute('data-acao');

    triggerHapticFeedback(); 
    playClickSound();

    if (!fraseAtual) {
        alert('Carregando frase, tente novamente em um momento.');
        return;
    }

    switch (acao) {
        case 'copiar':
            copiarFrase();
            break;
        case 'favoritar':
            favoritarFrase(btn);
            break;
        case 'partilhar':
            partilharFrase();
            break;
        default:
            console.warn('Ação desconhecida:', acao);
    }
}

function handleCompartilharApp(event) {
    event.preventDefault(); 
    triggerHapticFeedback();
    playClickSound();
    
    if (navigator.share) {
        navigator.share({
            title: 'Aplicativo de Frases Inspiradoras',
            text: 'Confira este app incrível para frases diárias de motivação e sabedoria!',
            url: window.location.href
        }).then(() => {
            console.log('Compartilhado com sucesso!');
        }).catch((error) => {
            console.error('Erro ao compartilhar:', error);
        });
    } else {
        alert("O compartilhamento nativo não é suportado neste dispositivo/navegador. Copie o link manualmente!");
    }
}



// --------------------------------
// INICIALIZAÇÃO
// --------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Aplicação inicial de temas 
    loadThemePreference(); 
    loadCorPreference(); 
    loadCorTextoPreference(); 
    
    // 2. Animação de entrada do cabeçalho
    if (dom.cabecalho) {
        setTimeout(() => dom.cabecalho.classList.add('entrou'), 50); 
    }
    
    // 3. Carregamento e exibição da frase do dia
    await fetchFrases(); // Garante que os dados das categorias carregaram
    await loadFraseDoDia();
    
    // CHAMADA OBRIGATÓRIA AQUI:
    atualizarContadoresHome();
    
    // 4. Configuração das interações de scroll e carrossel
    setupScrollAnimations();
    startPublicidadeCarousel();

    // 5. Configuração dos Listeners de Eventos
    
    // Cards Interativos (Ripple)
    dom.cardsInterativos.forEach(card => {
        card.addEventListener('mousedown', aplicarEfeitoRipple);
        card.addEventListener('touchstart', aplicarEfeitoRipple);
    });

    // Ações principais
    if (dom.btnCompartilhar) dom.btnCompartilhar.addEventListener('click', handleCompartilharApp);
    if (dom.btnShuffle) dom.btnShuffle.addEventListener('click', shuffleFrase);
    if (dom.btnToggleTheme) dom.btnToggleTheme.addEventListener('click', toggleTheme);
    if (dom.logoEasterEgg) dom.logoEasterEgg.addEventListener('click', handleLogoClick);

    // Botões de Ação da Frase
    dom.botoesAcaoFrase.forEach(botao => {
        botao.addEventListener('click', handleAcoesFrase);
    });
    
    // Lógica de Pesquisa
    if (dom.searchBar) {
        dom.searchBar.addEventListener('input', (e) => updateSuggestions(e.target.value));
        dom.searchBar.addEventListener('focus', (e) => updateSuggestions(e.target.value));
        
        dom.searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearchSubmit(dom.searchBar.value);
            }
        });

        dom.searchBar.addEventListener('blur', () => {
            setTimeout(clearSuggestions, 200); 
        });
    }
});