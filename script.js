const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function listGames() {
    const gamesDir = path.resolve(__dirname, 'games');
    const imgDir = path.resolve(__dirname, 'img');

    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir);
    }

    fs.readdir(gamesDir, (err, files) => {
        if(err) {
            console.error('Erro ao ler a pasta de jogos:', err);
            return;
        }

        const games = files.filter(file => file.endsWith('.swf'));

        const gamesListElement = document.getElementById('games-list');
        gamesListElement.innerHTML = '';

        games.forEach(game => {
            const gameBaseName = game.replace('.swf', '');
            const coverPathPng = path.join(imgDir, `${gameBaseName}.png`);
            const coverPathJpg = path.join(imgDir, `${gameBaseName}.jpg`);

            let coverPath = null;
            if (fs.existsSync(coverPathPng)) {
                coverPath = coverPathPng;
            } else if (fs.existsSync(coverPathJpg)) {
                coverPath = coverPathJpg;
            }

            const cardHTML = `
                <div class="col-md-3 col-sm-4 col-6 game-card">
                    <div class="card shadow-sm border-0 m-1">
                        <div class="game-image-container">
                            <img src="${coverPath ? 'img/' + path.basename(coverPath) : 'assets/img/sem-jogo.png'}" 
                                class="card-img-top game-image rounded" alt="${gameBaseName} cover" data-game="${game}">
                            <div class="game-name-container">
                                ${gameBaseName}
                            </div>
                        </div>
                        <div class="position-absolute bottom-0 left-0 m-3 bg-dark text-white px-2 py-1 rounded change-cover" data-game="${game}">
                            <img src="assets/img/engrenagem.png" alt="Engrenagem" style="width: 20px; height: 20px;">
                        </div>
                    </div>
                </div>
            `;

            gamesListElement.innerHTML += cardHTML;
        });

        const gameImages = document.querySelectorAll('.game-image');
        gameImages.forEach(image => {
            image.addEventListener('click', function() {
                const gameName = image.getAttribute('data-game');
                playGame(gameName);
            });
        });

        const changeCoverButtons = document.querySelectorAll('.change-cover');
        changeCoverButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const gameName = button.getAttribute('data-game');
                uploadImage(gameName);
            });
        });
    });
}

function playGame(gameName) {
    ipcRenderer.send('minimize');

    const flashPlayerPath = path.resolve(__dirname, 'flashplayer.exe');
    const gamePath = path.resolve(__dirname, 'games', gameName);
    const windowsGamePath = gamePath.replace(/^\/mnt\/c\//, 'C:\\').replace(/\//g, '\\');

    const command = `"${flashPlayerPath}" "${windowsGamePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Erro ao abrir o jogo:', error);
            alert('Erro ao abrir o jogo. Verifique o Flash Player e o arquivo .swf.');
        } else {
            console.log('Jogo iniciado com sucesso!');
        }
    });
}

function uploadImage(gameName) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg';

    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;

        const imgDir = path.resolve(__dirname, 'img');
        const ext = path.extname(file.name);
        const newFileName = gameName.replace('.swf', ext);
        const newFilePath = path.join(imgDir, newFileName);

        const existingPng = path.join(imgDir, gameName.replace('.swf', '.png'));
        const existingJpg = path.join(imgDir, gameName.replace('.swf', '.jpg'));

        [existingPng, existingJpg].forEach(existingPath => {
            if(fs.existsSync(existingPath)) {
                fs.unlinkSync(existingPath);
            }
        });

        const reader = new FileReader();
        reader.onload = () => {
            const buffer = Buffer.from(reader.result);
            fs.writeFile(newFilePath, buffer, err => {
                if(err) {
                    console.error('Erro ao salvar a nova capa do jogo:', err);
                } else {
                    console.log('Nova capa salva com sucesso:', newFileName);
                    listGames();
                }
            });
        };
        reader.onerror = err => {
            console.error('Erro ao ler o arquivo:', err);
            alert('Erro ao processar o arquivo. Tente novamente.');
        };
        reader.readAsArrayBuffer(file);
    };

    input.click();
}

document.getElementById('add-game-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.swf';

    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;

        const gamesDir = path.resolve(__dirname, 'games');

        if(!fs.existsSync(gamesDir)) {
            fs.mkdirSync(gamesDir);
        }

        const newGamePath = path.join(gamesDir, file.name);

        const reader = new FileReader();

        reader.onload = () => {
            const buffer = Buffer.from(reader.result);
            
            fs.writeFile(newGamePath, buffer, (err) => {
                if(err) {
                    console.error('Erro ao mover o arquivo:', err);
                } else {
                    console.log('Jogo adicionado com sucesso!');
                    listGames();
                }
            });
        };

        reader.onerror = err => {
            console.error('Erro ao ler o arquivo:', err);
            alert('Erro ao processar o arquivo. Tente novamente.');
        };

        reader.readAsArrayBuffer(file);
    };

    input.click();
});

listGames();

const { ipcRenderer } = require('electron');

document.getElementById('minimize-btn').addEventListener('click', () => {ipcRenderer.send('minimize');});

document.getElementById('maximize-btn').addEventListener('click', () => {ipcRenderer.send('maximize');});

document.getElementById('close-btn').addEventListener('click', () => {ipcRenderer.send('close');});