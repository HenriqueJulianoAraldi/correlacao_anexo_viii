#!/usr/bin/env python3
"""Gera uma versão de arquivo único, com CSS, JS e dados embutidos.

Serve para quem não tem onde hospedar: o arquivo abre com duplo clique, direto do
disco ou de uma pasta de rede, sem servidor.

Uso:
  python3 empacotar.py     escreve ../dist/fluxo-anexo-viii.html
"""

from __future__ import annotations

from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
SAIDA = RAIZ / "dist" / "fluxo-anexo-viii.html"

def main() -> None:
    html = (WEB / "index.html").read_text(encoding="utf-8")
    css = (WEB / "app.css").read_text(encoding="utf-8")
    js = (WEB / "app.js").read_text(encoding="utf-8")
    dados = (WEB / "data" / "anexo8.json").read_text(encoding="utf-8")

    # O JSON entra dentro de <script>, então qualquer '</' precisa ser escapado.
    dados = dados.replace("</", "<\\/")

    html = html.replace('<link rel="stylesheet" href="app.css">', f"<style>\n{css}</style>")
    html = html.replace(
        '<script src="app.js" defer></script>',
        f"<script>window.__ANEXO8__ = {dados};</script>\n<script>\n{js}</script>",
    )

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(html, encoding="utf-8")
    print(f"{SAIDA.relative_to(RAIZ)} — {SAIDA.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
