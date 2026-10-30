# Workplace — demonstração interativa

Prévia funcional para testar plantas, assentos, salas, reservas, bloqueios e comunicados. Funciona inteiramente no navegador, com dados em IndexedDB. Abre diretamente com uma planta fictícia e permite alternar entre perfis de administrador e colaborador.

**É uma demonstração, não um sistema compartilhado.** Não usa autenticação real; os perfis servem apenas para explorar os fluxos. Dados não são enviados para um servidor, não sincronizam com outras pessoas/dispositivos e podem ser apagados ao limpar os dados do navegador. Use plantas de teste. Não há necessidade de senha, banco ou variáveis secretas.

## Vercel

Importe este repositório no projeto `colliers`:

- Framework: Vite
- Root Directory: raiz do repositório (sem subpasta)
- Build Command: `npm run build:demo`
- Output Directory: `dist-demo`
- Install Command: `npm ci`
- Node.js: 24.x

Essas opções também estão em `vercel.json`. O modo demo é ativado pelo arquivo `.env.demo`, que contém apenas uma opção pública de compilação. Depois do deploy ficar **Ready**, use o botão **Visit** para abrir a demonstração.

## Desenvolvimento

Requer Node.js 24:

```bash
npm ci
npm run dev
```

Para testar o build estático:

```bash
npm run build
npm run preview
```

Com a prévia em execução na porta 4173 e Chromium em `/usr/bin/chromium`, `npm test` verifica persistência, conflitos, cancelamento, bloqueios, perfis e upload. O contexto de navegador do teste é isolado.

## Identidade visual

Interface orientada pelas skills Colliers. Logo oficial ainda reservado com placeholder; ícones funcionais provisórios. Rascunho para revisão do Marketing. Capa e favicon preparados; URLs de compartilhamento dependem do domínio final, sem domínio inventado.
