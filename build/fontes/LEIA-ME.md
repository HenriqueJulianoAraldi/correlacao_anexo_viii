# Planilhas de origem

Os arquivos desta pasta são publicados pela Secretaria-Executiva do CGNFS-e e estão
versionados para que `gerar.py` rode sem download nenhum.

| Arquivo | O que é |
| --- | --- |
| `AnexoVIII-CorrelacaoItemNBSIndOpCClassTrib_IBSCBS_V1.01.00.xlsx` | A correlação entre subitem da LC 116, NBS, indOp e cClassTrib. Gravado em 1º de abril de 2026. |
| `TabelaClassificacaoTributaria_IBSCBS.xlsx` | Os 154 cClassTrib com o CST, o tratamento e o artigo da LC 214/2025. |

Origem: <https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/rtc>

## Quando sair uma versão nova

Baixe a planilha e coloque aqui **sem apagar a antiga**. O gerador localiza os arquivos por
padrão de nome e usa sempre o de versão mais alta, então o histórico do repositório passa a
guardar as duas — e o `git diff` do `web/data/anexo8.json` mostra exatamente o que mudou na
correlação.
