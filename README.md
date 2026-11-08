# 🔐 Morpheus Wordlist Generator

Gerador de **wordlists inteligentes** para testes de segurança e auditoria de senhas.
A partir de poucas palavras-base (nome, empresa, pet, datas…), gera combinações realistas
usando as mesmas estratégias que pessoas reais usam para criar senhas: variações de caixa,
**leetspeak**, números, datas quebradas e caracteres especiais.

> ⚠️ **Uso autorizado apenas.** Esta ferramenta é para testes de penetração, CTFs e
> auditoria de senhas **com permissão**. O uso contra sistemas sem autorização é ilegal.

---

## ✨ O que ele faz

| Recurso | Descrição |
|---|---|
| **Variações de caixa** | Cada palavra vira `minúscula`, `MAIÚSCULA` e `Capitalizada` |
| **Combinação** | Junta 1 a N palavras (profundidade configurável, com trava anti-explosão) |
| **Leetspeak** | `a→4/@`, `e→3`, `i→1/!`, `o→0`, `s→5/$`, `t→7`… nos modos *Básico* (1 variante) e *Completo* (combinações) |
| **Números alvo** | Datas (`DDMMAAAA`) são quebradas em dia, mês, ano e combinações; telefones pegam os últimos dígitos |
| **Números comuns** | `1`, `123`, `2025`, `2026` |
| **Padrões comuns** | `123`, `1234`, `12345`, `123456`, `69`, `007`, `111`… |
| **Caracteres especiais** | Adicionados no início e no fim das senhas |
| **Dedup global** | Nenhuma linha repetida na saída |
| **Estimativa-teto** | Calcula o máximo de linhas **antes** de gerar e bloqueia explosões combinatórias |

---

## 🧩 Três interfaces, um motor

A lógica de geração vive em um único arquivo — **[`app/wordlist-core.js`](app/wordlist-core.js)** —
espelhado em Python. Isso evita divergência entre as interfaces.

### 1. CLI (Python) — `wordgenerator.py`
Sem dependências. Ideal para wordlists grandes (milhões de linhas).

```bash
python3 wordgenerator.py
```

Responde às perguntas (palavras, leet, números, padrões, profundidade, caracteres) e
gera `wordlist.txt`.

### 2. Web (navegador) — `index.html`
Interface estilo *matrix/terminal*. Abre direto, sem servidor:

```bash
xdg-open index.html        # Linux
# ou arraste o arquivo para o navegador
```

### 3. Desktop (Electron) — `app/`
Interface com visual **Apple/3D** (glassmorphism, janela sem moldura, controles iOS).

```bash
cd app
npm install
npm start
```

---

## 📦 Instaladores (releases)

Baixe o instalador pronto na aba **[Releases](../../releases)**:

- **Linux:** `.deb` (`sudo dpkg -i morpheus-wordlist_*.deb`)
- **Windows:** `.exe` (instalador NSIS)

### Gerar os instaladores você mesmo

```bash
cd app
npm install
npm run dist          # gera .deb (Linux) e .exe (Windows, requer wine no Linux)
# ou separadamente:
npm run dist:linux
npm run dist:win
```

Os arquivos saem em `app/dist/`.

---

## 🗂️ Estrutura

```
wordlist/
├── wordgenerator.py     # CLI Python (motor em Python)
├── index.html           # interface web (matrix)
├── app/                 # app desktop Electron (Apple/3D)
│   ├── wordlist-core.js # motor JS compartilhado (puro, testável)
│   ├── main.js          # processo principal (janela, IPC, salvar arquivo)
│   ├── preload.js       # ponte segura (contextIsolation)
│   ├── index.html       # renderer (UI Apple/3D)
│   ├── renderer.js      # lógica da UI (usa wordlist-core.js)
│   └── package.json     # scripts + config de build
└── README.md
```

---

## 🛡️ Segurança & privacidade

- **Nada sai da sua máquina.** As interfaces web e desktop geram tudo localmente; nenhum dado é enviado a servidores.
- O app Electron roda com `contextIsolation` ligado e sem `nodeIntegration` no renderer.
- O acesso ao disco (salvar arquivo) passa por um diálogo nativo controlado pelo processo principal.

---

## 📄 Licença

MIT © Hiago
