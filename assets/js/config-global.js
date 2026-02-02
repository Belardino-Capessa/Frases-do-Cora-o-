
/**
 * Função Global para atualizar preferências vindo de Toggles (HTML)
 */
window.updatePref = function(key, value) {
    // 1. Salva no localStorage imediatamente
    localStorage.setItem(key, value);
    
    const root = document.documentElement;

    // 2. Aplica as classes de performance em tempo real sem precisar recarregar
    switch(key) {
        case 'pref-animInterface':
            root.classList.toggle('no-anim-interface', value === false);
            break;
        case 'pref-animFundo':
            root.classList.toggle('no-anim-fundo', value === false);
            break;
        case 'pref-efeitoRipple':
            root.classList.toggle('no-ripple', value === false);
            break;
        case 'prefVibracao':
            if (value && navigator.vibrate) navigator.vibrate(20);
            break;
    }

    // 3. Feedback sonoro global
    if (window.playGlobalClick) window.playGlobalClick();
};
(function() {
    const prefs = {
        fontePerc: localStorage.getItem('appFontePerc') || '100',
        tipoFonte: localStorage.getItem('appFontFace') || 'sans-serif',
        corDestaque: localStorage.getItem('appCorDestaque') || '#e91e63',
        tema: localStorage.getItem('appTheme') || 'light',
        animInterface: localStorage.getItem('pref-animInterface') !== 'false',
        animFundo: localStorage.getItem('pref-animFundo') !== 'false',
        efeitoRipple: localStorage.getItem('pref-efeitoRipple') !== 'false'
    };

    const root = document.documentElement;

    // Aplicação de Estilos Base
    const tamanhoPx = (prefs.fontePerc / 100) * 16;
    const familia = prefs.tipoFonte === 'serif' ? '"Georgia", serif' : '"Nunito", sans-serif';
    root.style.setProperty('--fonte-base', tamanhoPx + 'px');
    root.style.setProperty('--familia-fonte', familia);
    root.style.setProperty('--cor-destaque', prefs.corDestaque);

    // Tema
    if (prefs.tema === 'dark' || (!localStorage.getItem('appTheme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('theme-escuro');
    } else {
        root.classList.remove('theme-escuro');
    }

    // Performance (Classes de bloqueio)
    if (!prefs.animInterface) root.classList.add('no-anim-interface');
    if (!prefs.animFundo)     root.classList.add('no-anim-fundo');
    if (!prefs.efeitoRipple)  root.classList.add('no-ripple');

    // Injeção do CSS do Modal Global
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000; opacity: 0; visibility: hidden; transition: all 0.3s ease;
        }
        .modal-overlay.active { opacity: 1; visibility: visible; }
        .modal-box {
            background: var(--cor-glass-fundo, rgba(255,255,255,0.2)); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
            border: 1px solid var(--cor-glass-borda, rgba(255,255,255,0.4)); border-radius: 1.5rem;
            padding: 2.2rem; width: 88%; max-width: 380px; transform: scale(0.85);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 1.5rem 4rem rgba(0,0,0,0.25); text-align: center;
        }
        .modal-overlay.active .modal-box { transform: scale(1); }
       .modal-icon { 
    font-size: 3.2rem; 
    color: var(--cor-destaque); 
    margin: 0 auto 1.2rem auto; /* 0 em cima, auto nas laterais, 1.2rem embaixo */
    display: block; 
    width: fit-content; /* Garante que o bloco tenha apenas o tamanho do ícone */
}
        .modal-titulo { color: var(--cor-destaque); font-weight: 800; margin-bottom: 0.6rem; font-size: 1.5rem; }
        .modal-msg { color: var(--cor-texto-principal); margin-bottom: 2rem; line-height: 1.6; font-size: 1.05rem; }
        .modal-botoes { display: flex; gap: 12px; justify-content: center; }
        .btn-modal {
            padding: 0.9rem 1.3rem; border-radius: 1rem; border: none;
            font-weight: 700; cursor: pointer; transition: all 0.2s; flex: 1; font-family: inherit; font-size: 1rem;
        }
        .btn-confirmar { background: var(--cor-destaque); color: white; box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3); }
        .btn-cancelar { background: rgba(0,0,0,0.1); color: var(--cor-texto-principal); }
        .theme-escuro .btn-cancelar { background: rgba(255,255,255,0.15); }
    `;
    document.head.appendChild(modalStyle);

    window.addEventListener('DOMContentLoaded', () => {
        // Inicializa o HTML do Modal se não existir
        if (!document.getElementById('global-modal')) {
            const modalHTML = `
                <div id="global-modal" class="modal-overlay">
                    <div class="modal-box">
                        <i id="modal-icon" class="fas modal-icon"></i>
                        <h3 id="modal-titulo" class="modal-titulo"></h3>
                        <p id="modal-msg" class="modal-msg"></p>
                        <div id="modal-botoes" class="modal-botoes"></div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Entrada suave da página
        setTimeout(() => {
            if (document.body) {
                document.body.classList.add('pagina-carregada');
                document.body.style.visibility = "visible";
            }
        }, 100);
    });
})();

/**
 * OBJETO GLOBAL DE MODAL PERSONALIZADO
 */
window.CustomModal = {
    show({ titulo = "Aviso", mensagem, tipo = "alert", icone = "fa-info-circle", aoConfirmar }) {
        const overlay = document.getElementById('global-modal');
        if (!overlay) return;

        const t = document.getElementById('modal-titulo');
        const m = document.getElementById('modal-msg');
        const b = document.getElementById('modal-botoes');
        const i = document.getElementById('modal-icon');

        t.innerText = titulo;
        m.innerText = mensagem;
        i.className = `fas ${icone} modal-icon`;
        b.innerHTML = ''; 

        if (tipo === "confirm") {
            const btnCancel = document.createElement('button');
            btnCancel.className = 'btn-modal btn-cancelar ripple';
            btnCancel.innerText = 'Cancelar';
            btnCancel.onclick = () => this.hide();
            b.appendChild(btnCancel);

            const btnOk = document.createElement('button');
            btnOk.className = 'btn-modal btn-confirmar ripple';
            btnOk.innerText = 'Continuar';
            btnOk.onclick = () => { if(aoConfirmar) aoConfirmar(); this.hide(); };
            b.appendChild(btnOk);
        } else {
            const btnOk = document.createElement('button');
            btnOk.className = 'btn-modal btn-confirmar ripple';
            btnOk.innerText = 'Entendido';
            btnOk.onclick = () => this.hide();
            b.appendChild(btnOk);
        }

        overlay.classList.add('active');
        window.playGlobalClick();
    },
    hide() {
        const overlay = document.getElementById('global-modal');
        if (overlay) overlay.classList.remove('active');
    }
};

/**
 * MONKEY PATCHING - INTERCEPTOR GLOBAL
 * Substitui os diálogos feios do navegador pelo seu Modal Glass
 */
window.alert = function(msg) {
    window.CustomModal.show({ mensagem: msg });
};

window.confirm = function(msg) {
    // Como o confirm nativo pausa o JS e modais não podem fazer isso, 
    // avisamos que este método deve ser evitado para fluxos lógicos complexos.
    window.CustomModal.show({
        titulo: "Confirmar",
        mensagem: msg,
        tipo: "confirm",
        icone: "fa-question-circle"
    });
    return false; // Retorna falso para prevenir ações automáticas não tratadas
};

/**
 * FUNÇÕES GLOBAIS DE NAVEGAÇÃO E BACKUP
 */
window.irParaTela = function(url) {
    if (localStorage.getItem('pref-animInterface') !== 'false') {
        document.body.style.opacity = '0';
        setTimeout(() => window.location.href = url, 350);
    } else {
        window.location.href = url;
    }
};

window.playGlobalClick = function() {
    if (localStorage.getItem('prefSomClique') !== 'false') {
        const audio = new Audio('assets/sound/click.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }
    if (navigator.vibrate) navigator.vibrate(10); 
};

window.exportarConfig = function() {
    const backup = JSON.stringify(localStorage);
    const blob = new Blob([backup], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meu-app-backup.json';
    a.click();
};

window.importarConfig = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            Object.keys(config).forEach(key => localStorage.setItem(key, config[key]));
            window.CustomModal.show({
                titulo: "Sucesso",
                mensagem: "Configurações importadas com sucesso! Vamos reiniciar o app.",
                icone: "fa-check-circle",
                aoConfirmar: () => window.location.reload()
            });
        } catch (err) {
            window.CustomModal.show({ titulo: "Erro", mensagem: "Arquivo de backup inválido.", icone: "fa-exclamation-triangle" });
        }
    };
    reader.readAsText(file);
};

window.onpageshow = (e) => { if (e.persisted) window.location.reload(); };