# Vida Smart Coach - Guia Técnico

## 1. Visão Geral

O Vida Smart Coach é um sistema de coaching de vida holístico, construído sobre a plataforma Supabase. Ele utiliza uma IA com tecnologia da OpenAI para fornecer coaching personalizado em quatro áreas: física, alimentar, emocional e espiritual. A integração com o WhatsApp é feita através da API Evolution, e os pagamentos são processados pelo Stripe.

## 2. Arquitetura

- **Backend & Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions).
- **Frontend:** React (Vite).
- **IA (Inteligência Artificial):** [OpenAI API](https://openai.com/docs) (GPT).
- **Mensageria:** [Evolution API](https://evolution-api.com/) para integração com o WhatsApp.
- **Pagamentos:** [Stripe](https://stripe.com/) para gerenciamento de assinaturas.
- **Testes:** [Vitest](https://vitest.dev/) para testes unitários e de integração.

## 3. Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas:

- [Node.js](https://nodejs.org/) (versão 20.x ou superior)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/products/docker-desktop/) (necessário para o Supabase CLI)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## 4. Configuração do Ambiente

1.  **Clonar o Repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd vida-smart-coach
    ```

2.  **Instalar Dependências:**
    ```bash
    pnpm install
    ```

3.  **Configurar Variáveis de Ambiente:**
    Crie uma cópia do arquivo `.env.example` (se existir) ou crie um novo arquivo chamado `.env` na raiz do projeto e adicione as seguintes variáveis:

    ```env
    # Supabase (obtido ao rodar 'supabase start')
    SUPABASE_URL=http://localhost:54321
    SUPABASE_ANON_KEY=your-anon-key
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

    # OpenAI
    OPENAI_API_KEY=sk-your-openai-api-key

    # Stripe
    STRIPE_API_KEY=sk_test_your-stripe-api-key
    STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

    # Evolution API (para o webhook do WhatsApp)
    EVOLUTION_API_SECRET=your-evolution-api-secret
    EVOLUTION_API_URL=http://localhost:8080
    EVOLUTION_API_KEY=your-evolution-api-key
    ```

## 5. Executando o Projeto Localmente

1.  **Iniciar o Ambiente Supabase:**
    Este comando iniciará os contêineres do Docker para o banco de dados, Auth e outras APIs do Supabase. Ao final, ele exibirá as URLs e chaves da API local, que você deve usar para preencher seu arquivo `.env`.

    ```bash
    supabase start
    ```

2.  **Aplicar as Migrações do Banco de Dados:**
    Para criar as tabelas e funções necessárias, execute:
    ```bash
    supabase db reset
    ```

3.  **Iniciar o Frontend:**
    Em um novo terminal, inicie o servidor de desenvolvimento do Vite:
    ```bash
    pnpm dev
    ```
    A aplicação estará disponível em `http://localhost:5173`.

## 6. Executando os Testes

Para garantir a qualidade e a estabilidade do código, execute a suíte de testes automatizados:

```bash
pnpm test
```
