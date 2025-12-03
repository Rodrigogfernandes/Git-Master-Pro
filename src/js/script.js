    // --- SISTEMA ---
        let levels = [];
        let currentLevel = 0;
        let maxLevelReached = 0; // Rastreia o nível máximo realmente alcançado
        let missionStep = 0; // Para missões com múltiplos comandos
        let isMissionActive = false;

        const dom = {
            levels: document.getElementById('levels-container'),
            tutView: document.getElementById('tutorial-view'),
            misView: document.getElementById('mission-view'),
            output: document.getElementById('output'),
            input: document.getElementById('cmd-input'),
            progress: document.getElementById('progress-display'),
            // Text Elements
            tutTitle: document.getElementById('tut-title'),
            tutDesc: document.getElementById('tut-desc'),
            tutDetailed: document.getElementById('tut-detailed'),
            tutTips: document.getElementById('tut-tips'),
            tutDiagram: document.getElementById('tut-diagram'),
            tutEx: document.getElementById('tut-example'),
            misTitle: document.getElementById('mis-title'),
            misDesc: document.getElementById('mis-desc'),
            misGoal: document.getElementById('mis-goal')
        };

        // Carrega levels.json e inicia a aplicação
        function loadLevels() {
            fetch('src/json/levels.json')
                .then(res => {
                    if (!res.ok) throw new Error('Não foi possível carregar levels.json');
                    return res.json();
                })
                .then(data => {
                    levels = data;
                    init();
                })
                .catch(err => {
                    console.error(err);
                    const out = document.getElementById('output');
                    if (out) {
                        const div = document.createElement('div');
                        div.className = 'line error';
                        div.innerText = 'Erro ao carregar levels.json: ' + err.message;
                        out.appendChild(div);
                    }
                });
        }

        function init() {
            const saved = localStorage.getItem('gitMasterLevel_v2');
            if (saved) {
                currentLevel = parseInt(saved);
                maxLevelReached = currentLevel; // O nível máximo é o salvo
            }

            renderSidebar();
            loadLevel(currentLevel);

            dom.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleCommand();
            });
        }

        function renderSidebar() {
                dom.levels.innerHTML = '';

                // Definição de grupos e intervalos (ajustável)
                const groups = [
                    { name: 'Básico', start: 0, end: 8 },
                    { name: 'Básico/Intermediário', start: 9, end: 13 },
                    { name: 'Intermediário', start: 14, end: 18 },
                    { name: 'Intermediário/Avançado', start: 19, end: 22 },
                    { name: 'Avançado', start: 23, end: Infinity }
                ];

                levels.forEach((lvl, idx) => {
                    // Inserir separador quando o índice for o início de um grupo
                    const group = groups.find(g => g.start === idx);
                    if (group) {
                        const sep = document.createElement('div');
                        sep.className = 'level-separator';
                        sep.innerText = group.name;
                        dom.levels.appendChild(sep);
                    }

                    const el = document.createElement('div');
                    el.className = `level-card ${idx === currentLevel ? 'active' : ''} ${idx < maxLevelReached ? 'completed' : ''}`;
                    el.innerText = lvl.title;
                    el.dataset.idx = idx;
                    el.setAttribute('role', 'button');
                    el.setAttribute('tabindex', '0');
                    // tooltip nativo ao passar o mouse
                    el.title = lvl.title;
                    // Ao clicar em um nível, navega direto para ele
                    el.addEventListener('click', () => {
                        currentLevel = idx;
                        // Só permite navegar para níveis já alcançados ou o próximo
                        if (idx <= maxLevelReached) {
                            localStorage.setItem('gitMasterLevel_v2', currentLevel);
                        }
                        loadLevel(idx);
                        print(`Navegando para: ${lvl.title}`, 'info');
                    });
                    // Permitir ativação por Enter/Space
                    el.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            el.click();
                        }
                    });
                    dom.levels.appendChild(el);
                });
        }

        function loadLevel(idx) {
            if (idx >= levels.length) {
                finishGame();
                return;
            }

            const lvl = levels[idx];
            missionStep = 0; // Reset steps

            // Tutorial Data
            dom.tutTitle.innerText = lvl.title;
            dom.tutDesc.innerText = lvl.tutorial.desc || '';
            dom.tutDetailed.innerText = lvl.tutorial.detailed || '';
            dom.tutTips.innerText = lvl.tutorial.tips || '';
            dom.tutDiagram.innerText = lvl.tutorial.diagram || '';
            dom.tutEx.innerText = lvl.tutorial.example || '';

            // Mission Data
            dom.misTitle.innerText = `Missão ${idx + 1}`;
            dom.misDesc.innerText = lvl.mission.desc;
            dom.misGoal.innerText = lvl.mission.goal;

            // Renderizar passos da missão (se houver)
            const stepsEl = document.getElementById('mis-steps');
            if (stepsEl) {
                stepsEl.innerHTML = '';
                if (Array.isArray(lvl.mission.steps)) {
                    lvl.mission.steps.forEach(s => {
                        const li = document.createElement('li');
                        li.innerText = s;
                        stepsEl.appendChild(li);
                    });
                }
            }

            showTutorial();
            renderSidebar();
            dom.progress.innerText = `Nível: ${idx + 1}/${levels.length}`;
        }

        function showTutorial() {
            dom.tutView.classList.remove('hidden');
            dom.misView.classList.add('hidden');
            dom.input.disabled = true;
            isMissionActive = false;
        }

        function startMission() {
            dom.tutView.classList.add('hidden');
            dom.misView.classList.remove('hidden');
            dom.input.disabled = false;
            dom.input.focus();
            isMissionActive = true;
            print(`\n--- INICIANDO NÍVEL ${currentLevel + 1} ---`, 'info');

            // Se for multi-step, avisa o primeiro passo
            if (levels[currentLevel].mission.multiStep) {
                print("Passo 1: " + levels[currentLevel].mission.goal, 'info');
            }
        }

        function skipTutorial() { startMission(); }
        function focusInput() { if (isMissionActive) dom.input.focus(); }

        function print(text, type = '') {
            const div = document.createElement('div');
            div.className = `line ${type}`;
            div.innerText = text;
            dom.output.appendChild(div);
            // SCROLL FIX: Garante que o scroll vá para o final
            dom.output.scrollTop = dom.output.scrollHeight;
        }

        function handleCommand() {
            const raw = dom.input.value.trim();
            if (!raw) return;

            dom.input.value = '';
            print(`user@dev:~$ ${raw}`, 'cmd');

            if (raw === 'clear') { dom.output.innerHTML = ''; return; }
            if (raw === 'help') {
                print('Comandos: git init, add, commit, status, log, checkout, merge, remote, push...', 'info');
                return;
            }

            checkLogic(raw);
        }

        function checkLogic(cmd) {
            const lvl = levels[currentLevel];
            const mission = lvl.mission;

            // Lógica Multi-passos (ex: Merge)
            if (mission.multiStep) {
                const currentStepObj = mission.steps[missionStep];
                // Verifica se o comando bate com qualquer um dos esperados no array
                if (currentStepObj.expect.includes(cmd)) {
                    print(`✔ ${currentStepObj.msg}`, 'success');
                    missionStep++;

                    if (missionStep >= mission.steps.length) {
                        levelPassed();
                    } else {
                        print(`Próximo passo: Complete a fusão.`, 'info');
                    }
                } else {
                    printError(cmd);
                }
                return;
            }

            // Lógica Padrão (Passo Único)
            let correct = false;
            if (mission.validate) {
                correct = mission.validate(cmd);
            } else if (mission.expected === cmd) {
                correct = true;
            }

            if (correct) {
                print(`✔ ${mission.success}`, 'success');
                levelPassed();
            } else {
                printError(cmd);
            }
        }

        function printError(cmd) {
            const lvl = levels[currentLevel];
            let expected = lvl.mission.expected;
            // Se for multi step, pega o esperado do passo atual
            if (lvl.mission.multiStep) {
                expected = lvl.mission.steps[missionStep].expect[0];
            }

            print(`✖ Comando '${cmd.split(' ')[0]}' não é o esperado.`, 'error');
            print(`  Dica: Tente algo como '${expected}'`, 'info');
        }

        function levelPassed() {
            currentLevel++;
            if (currentLevel > maxLevelReached) {
                maxLevelReached = currentLevel; // Atualiza o máximo alcançado
            }
            localStorage.setItem('gitMasterLevel_v2', currentLevel);
            setTimeout(() => {
                loadLevel(currentLevel);
            }, 1500);
        }

        function finishGame() {
            dom.tutView.innerHTML = `
                <h2 style="font-size:2rem">🏆 Mestre Git!</h2>
                <p class="content-text">Você completou todo o treinamento, incluindo operações remotas com GitHub.</p>
                <div class="actions">
                    <button class="btn-primary" onclick="localStorage.clear(); location.reload();">Reiniciar Curso</button>
                </div>
            `;
            dom.tutView.classList.remove('hidden');
            dom.misView.classList.add('hidden');
            dom.input.disabled = true;
            print("CURSO CONCLUÍDO COM SUCESSO.", "success");
        }

        loadLevels();