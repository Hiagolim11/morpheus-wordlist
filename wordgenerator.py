import itertools


def exibir_cabecalho():
    ROXO = "\033[95m"
    AZUL = "\033[94m"
    CIANO = "\033[96m"
    VERDE = "\033[92m"
    CINZA = "\033[90m"
    BRANCO = "\033[97m"
    RESET = "\033[0m"
    NEGRITO = "\033[1m"

    print()
    print(f"     {ROXO}{NEGRITO}██╗  ██╗██╗ █████╗  ██████╗  ██████╗")
    print(f"     {AZUL}██║  ██║██║██╔══██╗██╔════╝ ██╔═══██╗")
    print(f"     {CIANO}███████║██║███████║██║  ███╗██║   ██║")
    print(f"     {AZUL}██╔══██║██║██╔══██║██║   ██║██║   ██║")
    print(f"     {ROXO}██║  ██║██║██║  ██║╚██████╔╝╚██████╔╝")
    print(f"     {ROXO}╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝{RESET}")

    print()
    print(f"{CIANO}╔════════════════════════════════════════════╗")
    print(f"{CIANO}║{RESET}       {ROXO}{NEGRITO}MORPHEUS WORDLIST GENERATOR{RESET}          {CIANO}║")
    print(f"{CIANO}║{RESET}       {CINZA}Created by {BRANCO}Hiago{RESET}                     {CIANO}║")
    print(f"{CIANO}╚════════════════════════════════════════════╝{RESET}")
    print(f"\n{VERDE}[+] {BRANCO}Wordlist generation system initialized{RESET}")
    print(f"{VERDE}[+] {BRANCO}Ready to generate combinations{RESET}")
    print()


def coletar_palavras():
    palavras = []

    while True:
        palavra = input("Digite uma palavra (ou 'sair' para encerrar): ").strip().lower()

        if not palavra:
            print("Entrada vazia. Digite uma palavra válida.")
            continue

        if palavra == "sair":
            break

        if palavra in palavras:
            print("Essa palavra já foi digitada.")
            continue

        palavras.append(palavra)

    return palavras


def gerar_variacoes(palavra):
    # dict.fromkeys remove duplicatas preservando a ordem
    return list(dict.fromkeys([
        palavra.lower(),
        palavra.upper(),
        palavra.capitalize(),
    ]))


LEET_BASICO = {"a": "4", "b": "8", "e": "3", "g": "9",
               "i": "1", "o": "0", "s": "5", "t": "7"}
LEET_COMPLETO = {"a": ["4", "@"], "e": ["3"], "i": ["1", "!"], "o": ["0"],
                 "s": ["5", "$"], "t": ["7"], "b": ["8"], "g": ["9"]}
LEET_CAP_POR_PALAVRA = 48  # trava anti-explosão no modo completo

PADROES_COMUNS = ["123", "1234", "12345", "123456", "321",
                  "12", "01", "00", "11", "69", "007", "111", "000"]


def leet_basico(palavra):
    return "".join(LEET_BASICO.get(c.lower(), c) for c in palavra)


def leet_completo(palavra):
    resultados = [""]
    for c in palavra:
        subs = LEET_COMPLETO.get(c.lower())
        opcoes = [c] + subs if subs else [c]
        resultados = [r + o for r in resultados for o in opcoes]
        if len(resultados) > LEET_CAP_POR_PALAVRA:
            # shortcut: trunca em LEET_CAP_POR_PALAVRA; palavras muito "leetáveis"
            # perdem completude. Subir o cap se precisar de cobertura total.
            resultados = resultados[:LEET_CAP_POR_PALAVRA]
            break
    return resultados


def aplicar_leet(palavras, modo):
    """Expande a lista com variantes leet. modo: 'off' | 'basico' | 'completo'."""
    if modo == "off":
        return palavras

    extras = []
    for p in palavras:
        if modo == "basico":
            variante = leet_basico(p)
            if variante != p:
                extras.append(variante)
        else:
            extras.extend(v for v in leet_completo(p) if v != p)

    return list(dict.fromkeys(palavras + extras))


def combinar_palavras(palavras, profundidade_maxima=2):
    """
    Gera palavras individuais e combinações de 2 até profundidade_maxima
    palavras, concatenadas diretamente (sem separadores).

    O limite de profundidade existe porque permutations() cresce
    fatorialmente: sem limite, poucas palavras já geram bilhões de linhas.
    """

    # Primeiro gera cada palavra individual.
    for palavra in palavras:
        yield palavra

    teto = min(profundidade_maxima, len(palavras))

    # Depois gera combinações de 2 até o teto.
    for tamanho in range(2, teto + 1):
        for combinacao in itertools.permutations(palavras, tamanho):
            yield "".join(combinacao)


def quebrar_numero_alvo(numero_alvo):
    partes = set()

    partes.add(numero_alvo)

    num_limpo = (
        numero_alvo
        .replace("/", "")
        .replace("-", "")
        .replace(".", "")
        .replace(" ", "")
    )

    partes.add(num_limpo)
    tamanho = len(num_limpo)

    if tamanho == 8 and num_limpo.isdigit():
        dia = num_limpo[0:2]
        mes = num_limpo[2:4]
        ano = num_limpo[4:8]
        ano_curto = num_limpo[6:8]

        partes.update([
            dia,
            mes,
            ano,
            ano_curto,
            f"{dia}{mes}",
            f"{mes}{ano_curto}",
        ])

    elif tamanho == 4 and num_limpo.isdigit():
        partes.add(num_limpo[2:4])

    elif tamanho > 8 and num_limpo.isdigit():
        partes.add(num_limpo[-4:])

    return list(partes)


def adicionar_numeros(gerador_senhas, usar_comuns=False,
                      numeros_customizados=None, usar_padroes=False):
    numeros_finais = []

    if usar_comuns:
        numeros_finais.extend(["1", "123", "2025", "2026"])

    if usar_padroes:
        numeros_finais.extend(PADROES_COMUNS)

    if numeros_customizados:
        for numero in numeros_customizados:
            numeros_finais.extend(quebrar_numero_alvo(numero))

    # Remove duplicatas.
    numeros_finais = list(dict.fromkeys(numeros_finais))

    # Combina pares de números.
    if len(numeros_finais) >= 2:
        numeros_combinados = []

        for par in itertools.permutations(numeros_finais, 2):
            numeros_combinados.append("".join(par))

        numeros_finais.extend(numeros_combinados)
        numeros_finais = list(dict.fromkeys(numeros_finais))

    for senha in gerador_senhas:
        # Mantém também a versão sem números.
        yield senha

        for numero in numeros_finais:
            yield f"{senha}{numero}"
            yield f"{numero}{senha}"


def adicionar_caracteres_especiais(gerador_senhas, caracteres=None):
    """
    Adiciona caracteres especiais no início e no final da senha.

    Exemplo:
        hiago
        hiago!
        !hiago
        hiago@
        @hiago

    Não coloca caracteres entre cada palavra para evitar uma explosão
    desnecessária no número de combinações.
    """

    if not caracteres:
        for senha in gerador_senhas:
            yield senha
        return

    caracteres = list(dict.fromkeys(caracteres))

    for senha in gerador_senhas:
        # Mantém a senha original.
        yield senha

        # Adiciona 1 caractere no começo ou no fim.
        for caractere in caracteres:
            yield f"{senha}{caractere}"
            yield f"{caractere}{senha}"


def coletar_caracteres_especiais():
    resposta = input(
        "\nDeseja adicionar caracteres especiais às combinações? (s/n): "
    ).strip().lower()

    if resposta != "s":
        return []

    padrao = "!@#$%&*?"

    personalizados = input(
        f"Digite os caracteres desejados ou ENTER para usar {padrao}: "
    ).strip()

    if not personalizados:
        personalizados = padrao

    return list(dict.fromkeys(personalizados))


if __name__ == "__main__":
    exibir_cabecalho()

    palavras_base = coletar_palavras()

    if not palavras_base:
        print("\n[!] Nenhuma palavra foi informada. Encerrando.")
        raise SystemExit

    todas_palavras = []

    for palavra in palavras_base:
        todas_palavras.extend(gerar_variacoes(palavra))

    # Remove duplicatas mantendo a ordem.
    todas_palavras = list(dict.fromkeys(todas_palavras))

    print(f"\n[*] Palavras originais: {len(palavras_base)}")
    print(f"[*] Palavras com variações: {len(todas_palavras)}")

    # Leetspeak
    resp_leet = input(
        "\nAplicar leetspeak? (n/basico/completo) [n]: "
    ).strip().lower()
    modo_leet = resp_leet if resp_leet in ("basico", "completo") else "off"
    todas_palavras = aplicar_leet(todas_palavras, modo_leet)

    if modo_leet != "off":
        print(f"[*] Palavras com leet ({modo_leet}): {len(todas_palavras)}")

    # Números comuns
    resp_comuns = input(
        "\nDeseja adicionar números comuns (1, 123, 2025, 2026)? (s/n): "
    ).strip().lower()

    quer_comuns = resp_comuns == "s"

    # Padrões comuns (123, 1234, 12345, 69, 007...)
    resp_padroes = input(
        "Adicionar padrões comuns (123, 1234, 12345, 69, 007...)? (s/n): "
    ).strip().lower()

    quer_padroes = resp_padroes == "s"

    # Números personalizados
    numeros_extra = []

    print("\n[DICA] Você pode informar datas, anos ou telefones.")
    while True:
        numero = input(
            "Digite um número alvo (ENTER para terminar): "
        ).strip()

        if not numero or numero.lower() == "sair":
            break

        numeros_extra.append(numero)

    # Profundidade de combinação (quantas palavras se juntam).
    resp_prof = input(
        "\nMáximo de palavras por combinação (ENTER para 2): "
    ).strip()
    profundidade = int(resp_prof) if resp_prof.isdigit() and int(resp_prof) >= 1 else 2

    # NOVA ETAPA: caracteres especiais
    caracteres_especiais = coletar_caracteres_especiais()

    nome_arquivo = "wordlist.txt"

    print(f"\n[*] Gerando wordlist em: {nome_arquivo}")

    contador = 0

    with open(nome_arquivo, "w", encoding="utf-8") as arquivo:

        # 1. Combina palavras SEM separadores.
        gerador_base = combinar_palavras(todas_palavras, profundidade)

        # 2. Adiciona números.
        gerador_numeros = adicionar_numeros(
            gerador_base,
            usar_comuns=quer_comuns,
            numeros_customizados=numeros_extra,
            usar_padroes=quer_padroes,
        )

        # 3. Adiciona caracteres especiais.
        gerador_final = adicionar_caracteres_especiais(
            gerador_numeros,
            caracteres=caracteres_especiais,
        )

        # shortcut: dedup guarda cada senha única em memória; ok até ~dezenas
        # de milhões de linhas. Acima disso, trocar por `sort -u` no arquivo.
        vistas = set()
        for senha_final in gerador_final:
            if senha_final in vistas:
                continue
            vistas.add(senha_final)
            arquivo.write(senha_final + "\n")
            contador += 1

    print(f"\n[+] Geração concluída!")
    print(f"[+] Total de combinações geradas: {contador}")
    print(f"[+] Arquivo salvo em: {nome_arquivo}")
